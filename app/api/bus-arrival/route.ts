/**
 * Production Next.js App Router Route Handler: GET /api/bus-arrival
 *
 * Responsibilities:
 * 1. API Key Security: Kept server-side only in process.env.LTA_ACCOUNT_KEY.
 * 2. Caching: 30-second TTL cache to honor LTA DataMall rate limits and prevent redundant calls.
 * 3. Validation & Sanitization: Validates 5-digit bus stop code format, sanitizes query parameters.
 * 4. Deterministic Simulation Fallback: In development or when no LTA key is supplied, generates
 *    dynamic, realistic Singapore transit arrivals with changing timestamps and loads.
 */

// Next.js App Router compatible response helper (extends Web standard Response.json)
const NextResponse = {
  json: (data: any, init?: ResponseInit) => Response.json(data, init),
};

interface CacheEntry {
  timestamp: number;
  data: any;
}

// In-memory cache store: BusStopCode -> CacheEntry (30-second TTL)
const cacheStore = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30 * 1000; // 30 seconds

// Valid Singapore 5-digit bus stop code regex
const BUS_STOP_REGEX = /^[0-9]{5}$/;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const busStopCode = searchParams.get('BusStopCode')?.trim() || '';
    const serviceNo = searchParams.get('ServiceNo')?.trim() || '';

    // 1. Validation & Sanitization
    if (!busStopCode) {
      return NextResponse.json(
        { error: 'Missing required query parameter: BusStopCode' },
        { status: 400 }
      );
    }

    if (!BUS_STOP_REGEX.test(busStopCode)) {
      return NextResponse.json(
        { error: 'Invalid BusStopCode. Singapore bus stop codes must be exactly 5 digits (e.g. 08057).' },
        { status: 400 }
      );
    }

    const cacheKey = `${busStopCode}:${serviceNo}`;
    const now = Date.now();

    // 2. Check in-memory cache (30-second TTL)
    const cached = cacheStore.get(cacheKey);
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(cached.data, {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=15',
          'X-Cache': 'HIT',
          'X-Cache-Remaining-Seconds': Math.round((CACHE_TTL_MS - (now - cached.timestamp)) / 1000).toString(),
        },
      });
    }

    // 3. Upstream LTA DataMall Fetch
    const ltaApiKey = process.env.LTA_ACCOUNT_KEY;

    if (ltaApiKey) {
      const upstreamUrl = new URL('http://datamall2.mytransport.sg/ltaodataservice/BusArrivalv2');
      upstreamUrl.searchParams.set('BusStopCode', busStopCode);
      if (serviceNo) {
        upstreamUrl.searchParams.set('ServiceNo', serviceNo);
      }

      const upstreamRes = await fetch(upstreamUrl.toString(), {
        method: 'GET',
        headers: {
          AccountKey: ltaApiKey,
          accept: 'application/json',
        },
        // Prevent aggressive Node fetch caching beyond 30s in Next.js
        ...({ next: { revalidate: 30 } } as any),
      });

      if (!upstreamRes.ok) {
        return NextResponse.json(
          {
            error: `LTA DataMall upstream returned error: ${upstreamRes.status} ${upstreamRes.statusText}`,
          },
          { status: upstreamRes.status }
        );
      }

      const rawData = await upstreamRes.json();
      const sanitized = sanitizeLTAData(rawData, busStopCode);

      // Save to cache
      cacheStore.set(cacheKey, { timestamp: now, data: sanitized });

      return NextResponse.json(sanitized, {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=15',
          'X-Cache': 'MISS',
        },
      });
    }

    // 4. Deterministic Simulated Fallback (when no LTA_ACCOUNT_KEY is configured)
    const simulatedData = generateSimulatedLTAArrivals(busStopCode, serviceNo);
    cacheStore.set(cacheKey, { timestamp: now, data: simulatedData });

    return NextResponse.json(simulatedData, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=15',
        'X-Cache': 'SIMULATED',
        'X-Notice': 'Running in sandbox mode with live-computed Singapore transit simulation. Set LTA_ACCOUNT_KEY for direct DataMall feed.',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal Server Error', message: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Sanitizes and validates raw LTA payload against corrupted fields
 */
function sanitizeLTAData(raw: any, busStopCode: string) {
  const services = Array.isArray(raw?.Services) ? raw.Services : [];

  const cleanServices = services.map((srv: any) => {
    return {
      ServiceNo: String(srv.ServiceNo || '').trim(),
      Operator: srv.Operator || 'SBST',
      NextBus: cleanNextBus(srv.NextBus),
      NextBus2: srv.NextBus2?.EstimatedArrival ? cleanNextBus(srv.NextBus2) : undefined,
      NextBus3: srv.NextBus3?.EstimatedArrival ? cleanNextBus(srv.NextBus3) : undefined,
    };
  });

  return {
    'odata.metadata': raw?.['odata.metadata'] || 'http://datamall2.mytransport.sg/ltaodataservice/$metadata#BusArrivalv2/@Element',
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

/**
 * High-fidelity Singapore bus arrival simulation with realistic ETAs and loads
 */
function generateSimulatedLTAArrivals(busStopCode: string, requestedServiceNo?: string) {
  // Common feeder and trunk services per stop
  const defaultServicesMap: Record<string, string[]> = {
    '08057': ['65', '106', '111', '14', '190'],
    '09048': ['67', '143', '162', '54', '190'],
    '75009': ['291', '293', '3', '27', '21'],
    '28009': ['52', '105', '183', '333', '334'],
    '11361': ['95', '106', '147', '196', '200'],
    '01012': ['10', '70', '100', '196', '57'],
    '53231': ['54', '56', '410W', '410G'],
    '84039': ['2', '9', '24', '222', '28'],
  };

  const servicesList = requestedServiceNo
    ? [requestedServiceNo]
    : defaultServicesMap[busStopCode] || ['67', '190', '65', '14'];

  const nowMs = Date.now();

  const services = servicesList.map((serviceNo, idx) => {
    // Generate realistic pseudorandom arrivals based on current time window
    const seed = (Math.floor(nowMs / 60000) * 17 + parseInt(serviceNo.replace(/\D/g, '') || '10', 10) * 31 + idx * 7) % 100;
    
    // ETA 1: 1 to 11 minutes
    const waitMin1 = (seed % 10) + 1.2;
    const waitMin2 = waitMin1 + 7 + (seed % 5);
    const waitMin3 = waitMin2 + 8 + (seed % 6);

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
      Operator: 'SBST',
      NextBus: {
        OriginCode: busStopCode,
        DestinationCode: '99999',
        EstimatedArrival: eta1,
        Latitude: '1.3000',
        Longitude: '103.8500',
        VisitNumber: '1',
        Load: load1,
        Feature: 'WAB',
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
        Feature: 'WAB',
        Type: 'DD',
      },
      NextBus3: {
        OriginCode: busStopCode,
        DestinationCode: '99999',
        EstimatedArrival: eta3,
        Latitude: '1.3100',
        Longitude: '103.8600',
        VisitNumber: '1',
        Load: 'SEA',
        Feature: 'WAB',
        Type: 'SD',
      },
    };
  });

  return {
    'odata.metadata': 'http://datamall2.mytransport.sg/ltaodataservice/$metadata#BusArrivalv2/@Element',
    BusStopCode: busStopCode,
    Services: services,
  };
}
