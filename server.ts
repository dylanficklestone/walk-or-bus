import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

interface CacheEntry {
  timestamp: number;
  data: any;
}

const cacheStore = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30 * 1000; // 30 seconds
const BUS_STOP_REGEX = /^[0-9]{5}$/;

const serverStartTime = Date.now();

/**
 * Health check endpoint for LTA DataMall proxy, cache stats, and uptime
 */
app.get('/api/health', async (_req: Request, res: Response) => {
  const checkTimestamp = Date.now();
  const uptimeSeconds = Math.floor((checkTimestamp - serverStartTime) / 1000);
  const ltaApiKeyConfigured = Boolean(process.env.LTA_ACCOUNT_KEY);

  let upstreamStatus: 'CONNECTED' | 'SANDBOX_SIMULATED' | 'ERROR' = 'SANDBOX_SIMULATED';
  let upstreamLatencyMs = 0;
  let upstreamMessage = 'Running with deterministic Singapore transit simulation engine.';

  if (ltaApiKeyConfigured) {
    const pingStart = Date.now();
    try {
      const pingRes = await fetch(
        'http://datamall2.mytransport.sg/ltaodataservice/BusArrivalv2?BusStopCode=09048',
        {
          headers: {
            AccountKey: process.env.LTA_ACCOUNT_KEY!,
            accept: 'application/json',
          },
        }
      );
      upstreamLatencyMs = Date.now() - pingStart;

      if (pingRes.ok) {
        upstreamStatus = 'CONNECTED';
        upstreamMessage = `Connected to LTA DataMall API (${upstreamLatencyMs}ms).`;
      } else {
        upstreamStatus = 'ERROR';
        upstreamMessage = `LTA DataMall returned HTTP ${pingRes.status}`;
      }
    } catch (err: any) {
      upstreamStatus = 'ERROR';
      upstreamMessage = `Failed to reach LTA DataMall: ${err?.message || 'Timeout'}`;
    }
  }

  const memoryUsage = process.memoryUsage ? process.memoryUsage() : null;

  const healthReport = {
    status: upstreamStatus === 'ERROR' ? 'DEGRADED' : 'HEALTHY',
    service: 'walk-or-wait-sg-decision-engine',
    timestamp: new Date().toISOString(),
    uptimeSeconds,
    checks: {
      ltaDataMall: {
        status: upstreamStatus,
        configured: ltaApiKeyConfigured,
        latencyMs: upstreamLatencyMs,
        message: upstreamMessage,
        endpoint: 'http://datamall2.mytransport.sg/ltaodataservice/BusArrivalv2',
      },
      cache: {
        status: 'OPERATIONAL',
        activeEntries: cacheStore.size,
        ttlSeconds: 30,
        strategy: 'In-Memory with HTTP Cache-Control (s-maxage=30)',
      },
      routingEngine: {
        status: 'OPERATIONAL',
        algorithm: 'Delta-T Penalized Comfort Scoring',
        weatherFactors: ['clear', 'heat_33c', 'rain_downpour'],
      },
      busStopsDatabase: {
        status: 'OPERATIONAL',
        coverage: 'Singapore island-wide (All 5-digit bus stop codes 01xxx-99xxx)',
      },
    },
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      memoryHeapUsedMb: memoryUsage ? Math.round(memoryUsage.heapUsed / 1024 / 1024) : null,
      memoryRssMb: memoryUsage ? Math.round(memoryUsage.rss / 1024 / 1024) : null,
    },
  };

  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('X-Health-Status', healthReport.status);
  return res.status(upstreamStatus === 'ERROR' ? 503 : 200).json(healthReport);
});

/**
 * Proxy route for Singapore LTA DataMall BusArrivalv2
 */
app.get('/api/bus-arrival', async (req: Request, res: Response) => {
  try {
    const busStopCode = String(req.query.BusStopCode || '').trim();
    const serviceNo = String(req.query.ServiceNo || '').trim();

    if (!busStopCode) {
      return res.status(400).json({ error: 'Missing required query parameter: BusStopCode' });
    }

    if (!BUS_STOP_REGEX.test(busStopCode)) {
      return res.status(400).json({
        error: 'Invalid BusStopCode. Singapore bus stop codes must be exactly 5 digits (e.g. 08057).',
      });
    }

    const cacheKey = `${busStopCode}:${serviceNo}`;
    const now = Date.now();

    // Check in-memory 30s cache
    const cached = cacheStore.get(cacheKey);
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=15');
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('X-Cache-Remaining-Seconds', Math.round((CACHE_TTL_MS - (now - cached.timestamp)) / 1000).toString());
      return res.json(cached.data);
    }

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
      });

      if (!upstreamRes.ok) {
        return res.status(upstreamRes.status).json({
          error: `LTA DataMall upstream returned: ${upstreamRes.status} ${upstreamRes.statusText}`,
        });
      }

      const rawData = await upstreamRes.json();
      const sanitized = sanitizeLTAData(rawData, busStopCode);

      cacheStore.set(cacheKey, { timestamp: now, data: sanitized });

      res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=15');
      res.setHeader('X-Cache', 'MISS');
      return res.json(sanitized);
    }

    // High-fidelity simulated Singapore transit data
    const simulatedData = generateSimulatedLTAArrivals(busStopCode, serviceNo);
    cacheStore.set(cacheKey, { timestamp: now, data: simulatedData });

    res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=15');
    res.setHeader('X-Cache', 'SIMULATED');
    return res.json(simulatedData);
  } catch (error: any) {
    console.error('Bus arrival proxy error:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error?.message });
  }
});

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
    const seed = (Math.floor(nowMs / 60000) * 17 + parseInt(serviceNo.replace(/\D/g, '') || '10', 10) * 31 + idx * 7) % 100;

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
    'odata.metadata': 'http://datamall2.mytransport.sg/ltaodataservice/$metadata#BusArrivalv2/@Element',
    BusStopCode: busStopCode,
    Services: services,
  };
}

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT} (mode: ${isProduction ? 'prod' : 'dev'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
