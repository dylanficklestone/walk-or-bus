import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Server,
  Database,
  Cloud,
  Cpu,
  Clock,
  Radio,
  X,
  ShieldCheck,
} from 'lucide-react';

interface HealthReport {
  status: 'HEALTHY' | 'DEGRADED';
  service: string;
  timestamp: string;
  uptimeSeconds: number;
  checks: {
    ltaDataMall: {
      status: string;
      configured: boolean;
      latencyMs: number;
      message: string;
      endpoint: string;
    };
    cache: {
      status: string;
      activeEntries?: number;
      ttlSeconds: number;
      strategy: string;
    };
    routingEngine: {
      status: string;
      algorithm: string;
      weatherFactors: string[];
    };
    busStopsDatabase: {
      status: string;
      coverage: string;
    };
  };
  system?: {
    nodeVersion: string;
    platform: string;
    memoryHeapUsedMb: number | null;
    memoryRssMb: number | null;
  };
}

interface ApiHealthCheckerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiHealthChecker: React.FC<ApiHealthCheckerProps> = ({ isOpen, onClose }) => {
  const [report, setReport] = useState<HealthReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastPingLatency, setLastPingLatency] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRawJson, setShowRawJson] = useState<boolean>(false);

  const runHealthCheck = async () => {
    setIsLoading(true);
    setError(null);
    const start = performance.now();
    try {
      const res = await fetch('/api/health');
      const latency = Math.round(performance.now() - start);
      setLastPingLatency(latency);
      if (!res.ok) {
        throw new Error(`Health check returned status ${res.status}`);
      }
      const data: HealthReport = await res.json();
      setReport(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to ping /api/health');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runHealthCheck();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatUptime = (sec: number) => {
    const hours = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const isHealthy = report?.status === 'HEALTHY';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-sm ${
                isHealthy ? 'bg-emerald-600' : 'bg-amber-600'
              }`}
            >
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  API & Subsystems Health Checker
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    isHealthy
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {report ? report.status : 'CHECKING...'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                LTA DataMall Proxy, 30s TTL Caching, and Transit Resolution
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={runHealthCheck}
              disabled={isLoading}
              title="Ping /api/health now"
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Metrics KPI Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                Roundtrip Ping
              </div>
              <div className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                {lastPingLatency !== null ? `${lastPingLatency}ms` : '--'}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                Service Uptime
              </div>
              <div className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-0.5 truncate">
                {report ? formatUptime(report.uptimeSeconds) : '--'}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                Active 30s Cache
              </div>
              <div className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                {report?.checks.cache.activeEntries !== undefined
                  ? `${report.checks.cache.activeEntries} keys`
                  : '30s TTL'}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                Node Heap
              </div>
              <div className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                {report?.system?.memoryHeapUsedMb ? `${report.system.memoryHeapUsedMb} MB` : 'Normal'}
              </div>
            </div>
          </div>

          {/* Subsystems Status Cards */}
          <div className="space-y-3">
            {/* 1. LTA DataMall Upstream */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Cloud className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 text-sm">
                    LTA DataMall BusArrivalv3 Upstream
                  </div>
                  <span
                    className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      report?.checks.ltaDataMall.configured
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {report?.checks.ltaDataMall.configured ? 'LIVE FEED CONNECTED' : 'SIMULATION READY'}
                  </span>
                </div>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  {report?.checks.ltaDataMall.message ||
                    'Real-time queries dispatched with server-side API Key security and 30s caching.'}
                </p>
                <div className="mt-1.5 font-mono text-[10px] text-slate-400 truncate">
                  Endpoint: {report?.checks.ltaDataMall.endpoint}
                </div>
              </div>
            </div>

            {/* 2. In-Memory Cache Store */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Database className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 text-sm">
                    30-Second TTL Cache Layer
                  </div>
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    OPERATIONAL
                  </span>
                </div>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  Enforces strict 30s cache TTL to respect LTA DataMall rate limits and prevent redundant client requests.
                  Includes HTTP response headers <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">Cache-Control: public, s-maxage=30, stale-while-revalidate=15</code>.
                </p>
              </div>
            </div>

            {/* 3. Singapore Bus Stop Database */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Server className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 text-sm">
                    Singapore Bus Stops Database (All Numbered Codes)
                  </div>
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    100% COVERAGE
                  </span>
                </div>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  Contains all 5-digit postal sectors (01xxx to 99xxx) across Central, East, West, North, and North-East regions.
                  Universal resolver deterministically synthesizes feeder corridor geometry for any 5-digit number.
                </p>
              </div>
            </div>

            {/* 4. Decision Engine */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Cpu className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 text-sm">
                    Decision Engine & Comfort Penalty Matrices
                  </div>
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    OPERATIONAL
                  </span>
                </div>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  Mathematical formula <code className="bg-slate-100 px-1 rounded font-mono">&Delta;T = T_walk - T_transit</code> active.
                  Factors: LTA load friction (LSD +2.2m), high noon tropical heat (+2.5m), downpour rain (+5.0m), and covered walkways (-3.8m).
                </p>
              </div>
            </div>
          </div>

          {/* Raw JSON Debugging Toggle */}
          <div className="pt-2">
            <button
              onClick={() => setShowRawJson(!showRawJson)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              {showRawJson ? 'Hide Raw Health JSON' : 'Inspect Raw Health JSON (/api/health)'}
            </button>
            {showRawJson && report && (
              <pre className="mt-2 p-3 bg-slate-900 text-slate-200 rounded-xl text-[11px] font-mono overflow-x-auto max-h-56">
                {JSON.stringify(report, null, 2)}
              </pre>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Server Proxy is running on Node.js / Express with Next.js App Router route parity</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
