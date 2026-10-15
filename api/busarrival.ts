/**
 * Serverless Route Handler: /api/busarrival
 *
 * Endpoint:
 * GET https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival
 *
 * Headers required upstream:
 * - AccountKey: <LTA_ACCOUNT_KEY> (read securely from process.env)
 * - accept: application/json
 *
 * Query Parameters:
 * - BusStopCode: (required) 5-digit Singapore bus stop code (e.g. 09048)
 * - ServiceNo: (optional) Specific bus service number (e.g. 67)
 *
 * Supports both Node.js serverless functions (req, res) and Edge/Web Fetch (request: Request).
 */

interface CacheEntry {
  timestamp: number;
  data: any;
}

// In-memory 30-second TTL cache to respect LTA DataMall rate limits
const cacheStore = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30 * 1000;

const BUS_STOP_REGEX = /^[0-9]{5}$/;
const LTA_V3_BASE_URL = 'https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival';

/**
 * Core business logic that executes the LTA DataMall v3 request
 */
export async function handleBusArrivalQuery(
  busStopCode: string,
  serviceNo: string = ''
): Promise<{ status: number; data: any; headers: Record<string, string> }> {
  if (!busStopCode) {
    return {
      status: 400,
      data: { error: 'Missing required parameter: BusStopCode' },
      headers: {},
    };
  }

  if (!BUS_STOP_REGEX.test(busStopCode)) {
    return {
      status: 400,
      data: {
        error: 'Invalid BusStopCode. Must be exactly 5 digits (e.g. 08057, 09048).',
      },
      headers: {},
    };
  }

  const cacheKey = `${busStopCode}:${serviceNo}`;
  const now = Date.now();

  // 1. Check in-memory 30s cache
  const cached = cacheStore.get(cacheKey);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    const remainingSec = Math.round((CACHE_TTL_MS - (now - cached.timestamp)) / 1000);
    return {
      status: 200,
      data: cached.data,
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=15',
        'X-Cache': 'HIT',
        'X-Cache-Remaining-Seconds': remainingSec.toString(),
      },
    };
  }

  // 2. Read LTA AccountKey securely from environment (never hardcoded)
  const accountKey =
    process.env.LTA_ACCOUNT_KEY ||
    process.env.LTA_API_KEY ||
    process.env.ACCOUNT_KEY ||
    '';

  // 3. Live query to LTA DataMall v3 API
  if (accountKey) {
    try {
      const upstreamUrl = new URL(LTA_V3_BASE_URL);
      upstreamUrl.searchParams.set('BusStopCode', busStopCode);
      if (serviceNo) {
        upstreamUrl.searchParams.set('ServiceNo', serviceNo);
      }

      const upstreamRes = await fetch(upstreamUrl.toString(), {
        method: 'GET',
        headers: {
          AccountKey: accountKey,
          accept: 'application/json',
        },
      });

      if (!upstreamRes.ok) {
        return {
          status: upstreamRes.status,
          data: {
            error: `LTA DataMall v3 upstream returned error HTTP ${upstreamRes.status} (${upstreamRes.statusText})`,
            endpoint: LTA_V3_BASE_URL,
          },
          headers: {
            'Cache-Control': 'no-store',
          },
        };
      }

      const rawData = await upstreamRes.json();
      const sanitized = sanitizeLTAData(rawData, busStopCode);

      cacheStore.set(cacheKey, { timestamp: now, data: sanitized });

      return {
        status: 200,
        data: sanitized,
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=15',
          'X-Cache': 'MISS',
          'X-LTA-Source': 'LIVE_DATAMALL_V3',
        },
      };
    } catch (fetchErr: any) {
      return {
        status: 502,
        data: {
          error: `Failed to reach LTA DataMall v3: ${fetchErr?.message || 'Network error'}`,
        },
        headers: {},
      };
    }
  }

  // 4. Deterministic sandbox simulation if no key is configured yet
  const simulated = generateSimulatedLTAArrivals(busStopCode, serviceNo);
  cacheStore.set(cacheKey, { timestamp: now, data: simulated });

  return {
    status: 200,
    data: simulated,
    headers: {
      'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=15',
      'X-Cache': 'SIMULATED',
      'X-LTA-Notice': 'No LTA_ACCOUNT_KEY configured in environment. Running sandbox simulation.',
    },
  };
}

/**
 * Standard Node.js Serverless Function Handler (Vercel / Express / AWS Lambda compatible)
 */
export default async function handler(req: any, res: any) {
  try {
    const busStopCode = String(req.query?.BusStopCode || req.body?.BusStopCode || '').trim();
    const serviceNo = String(req.query?.ServiceNo || req.body?.ServiceNo || '').trim();

    const result = await handleBusArrivalQuery(busStopCode, serviceNo);

    // Set response headers
    for (const [key, val] of Object.entries(result.headers)) {
      res.setHeader(key, val as string);
    }

    return res.status(result.status).json(result.data);
  } catch (err: any) {
    return res.status(500).json({
      error: 'Internal Serverless Execution Error',
      message: err?.message,
    });
  }
}

/**
 * Web standard / Edge Runtime Handler (e.g. Next.js App Router, Cloudflare Workers)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const busStopCode = searchParams.get('BusStopCode')?.trim() || '';
    const serviceNo = searchParams.get('ServiceNo')?.trim() || '';

    const result = await handleBusArrivalQuery(busStopCode, serviceNo);

    return Response.json(result.data, {
      status: result.status,
      headers: result.headers,
    });
  } catch (err: any) {
    return Response.json(
      { error: 'Internal Server Error', message: err?.message },
      { status: 500 }
    );
  }
}

function sanitizeLTAData(raw: any, busStopCode: string) {
  const services = Array.isArray(raw?.Services) ? raw.Services : [];

  const cleanServices = services.map((srv: any) => ({
    ServiceNo: String(srv.ServiceNo || '').trim(),
    Operator: srv.Operator || 'SBST',
    NextBus: cleanNextBus(srv.NextBus),
    NextBus2: srv.NextBus2?.EstimatedArrival ? cleanNextBus(srv.NextBus2) : undefined,
    NextBus3: srv.NextBus3?.EstimatedArrival ? cleanNextBus(srv.NextBus3) : undefined,
  }));

  return {
    'odata.metadata':
      raw?.['odata.metadata'] ||
      'https://datamall2.mytransport.sg/ltaodataservice/$metadata#BusArrivalv3/@Element',
    BusStopCode: busStopCode,
    Services: cleanServices,
  };
}

function cleanNextBus(nb: any) {
  if (!nb || !nb.EstimatedArrival) {
    return {
      EstimatedArrival: '',
      Load: 'SEA',
      Feature: 'WAB',
      Type: 'SD',
      Latitude: '0',
      Longitude: '0',
      VisitNumber: '1',
      OriginCode: '',
      DestinationCode: '',
    };
  }

  const validLoads = ['SEA', 'SDA', 'LSD'];
  const load = validLoads.includes(nb.Load) ? nb.Load : 'SEA';
  const validTypes = ['SD', 'DD', 'BD'];
  const type = validTypes.includes(nb.Type) ? nb.Type : 'SD';

  return {
    EstimatedArrival: nb.EstimatedArrival,
    Load: load,
    Feature: nb.Feature === 'WAB' ? 'WAB' : '',
    Type: type,
    Latitude: String(nb.Latitude || '0'),
    Longitude: String(nb.Longitude || '0'),
    VisitNumber: String(nb.VisitNumber || '1'),
    OriginCode: String(nb.OriginCode || ''),
    DestinationCode: String(nb.DestinationCode || ''),
  };
}

function generateSimulatedLTAArrivals(busStopCode: string, requestedServiceNo?: string) {
  const defaultServicesMap: Record<string, string[]> = {
    '08057': ['65', '106', '111', '14', '190', '16'],
    '09048': ['67', '143', '162', '54', '190', '124'],
    '75009': ['291', '293', '3', '27', '21', '67'],
    '28009': ['52', '105', '183', '333', '334', '66'],
    '11361': ['95', '106', '147', '196', '200', '74'],
    '01012': ['10', '70', '100', '196', '57', '130'],
    '53231': ['54', '56', '410W', '410G', '53', '58'],
    '84039': ['2', '9', '24', '222', '28', '67'],
  };

  const servicesList = requestedServiceNo
    ? [requestedServiceNo]
    : defaultServicesMap[busStopCode] || ['67', '190', '65', '14'];

  const nowMs = Date.now();

  const services = servicesList.map((serviceNo, idx) => {
    const seed =
      (Math.floor(nowMs / 60000) * 17 +
        parseInt(serviceNo.replace(/\D/g, '') || '10', 10) * 31 +
        idx * 7) %
      100;

    const waitMin1 = (seed % 9) + 1.2;
    const waitMin2 = waitMin1 + 7 + (seed % 4);
    const waitMin3 = waitMin2 + 8 + (seed % 5);

    const eta1 = new Date(nowMs + waitMin1 * 60 * 1000).toISOString();
    const eta2 = new Date(nowMs + waitMin2 * 60 * 1000).toISOString();
    const eta3 = new Date(nowMs + waitMin3 * 60 * 1000).toISOString();

    const loads: Array<'SEA' | 'SDA' | 'LSD'> = ['SEA', 'SDA', 'LSD'];
    const load1 = loads[seed % 3];
    const load2 = loads[(seed + 1) % 3];

    const types: Array<'SD' | 'DD' | 'BD'> = ['SD', 'DD', 'SD'];
    const type1 = types[seed % 3];

    return {
      ServiceNo: serviceNo,
      Operator: 'SBST' as const,
      NextBus: {
        OriginCode: busStopCode,
        DestinationCode: '99999',
        EstimatedArrival: eta1,
        Latitude: '1.3000',
        Longitude: '103.8500',
        VisitNumber: '1',
        Load: load1,
        Feature: 'WAB' as const,
        Type: type1,
      },
      NextBus2: {
        OriginCode: busStopCode,
        DestinationCode: '99999',
        EstimatedArrival: eta2,
        Latitude: '1.3050',
        Longitude: '103.8550',
        VisitNumber: '1',
        Load: load2,
        Feature: 'WAB' as const,
        Type: 'DD' as const,
      },
      NextBus3: {
        OriginCode: busStopCode,
        DestinationCode: '99999',
        EstimatedArrival: eta3,
        Latitude: '1.3100',
        Longitude: '103.8600',
        VisitNumber: '1',
        Load: 'SEA' as const,
        Feature: 'WAB' as const,
        Type: 'SD' as const,
      },
    };
  });

  return {
    'odata.metadata':
      'https://datamall2.mytransport.sg/ltaodataservice/$metadata#BusArrivalv3/@Element',
    BusStopCode: busStopCode,
    Services: services,
  };
}
