import React, { useState } from 'react';
import { X, Code2, Cpu, Database, CheckCircle2, Shield, Layers, Copy, Check } from 'lucide-react';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'algorithm' | 'proxy' | 'client'>('algorithm');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const nextJsRouteSnippet = `// app/api/bus-arrival/route.ts
import { NextResponse } from 'next/server';

const cacheStore = new Map<string, { timestamp: number; data: any }>();
const CACHE_TTL_MS = 30 * 1000; // 30-second TTL
const BUS_STOP_REGEX = /^[0-9]{5}$/;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const busStopCode = searchParams.get('BusStopCode')?.trim() || '';
  const serviceNo = searchParams.get('ServiceNo')?.trim() || '';

  if (!BUS_STOP_REGEX.test(busStopCode)) {
    return NextResponse.json({ error: 'Invalid 5-digit BusStopCode' }, { status: 400 });
  }

  const cacheKey = \`\${busStopCode}:\${serviceNo}\`;
  const cached = cacheStore.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(cached.data, {
      headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=15' }
    });
  }

  const upstreamRes = await fetch(
    \`https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=\${busStopCode}\`,
    { headers: { AccountKey: process.env.LTA_ACCOUNT_KEY!, accept: 'application/json' } }
  );
  const data = await upstreamRes.json();
  cacheStore.set(cacheKey, { timestamp: Date.now(), data });
  return NextResponse.json(data);
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Architecture & Decision Algorithm
              </h2>
              <p className="text-xs text-slate-500">
                Singapore Commuter Real-Time Micro-Decision Engine Specification
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 bg-white">
          <button
            onClick={() => setActiveTab('algorithm')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'algorithm'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            1. Decision Algorithm & Formula
          </button>
          <button
            onClick={() => setActiveTab('proxy')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'proxy'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            2. Backend Proxy & Caching
          </button>
          <button
            onClick={() => setActiveTab('client')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'client'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            3. Frontend Component & Hook
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700 text-sm leading-relaxed">
          {activeTab === 'algorithm' && (
            <div className="space-y-5">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <h3 className="font-bold text-slate-900 text-base mb-2">
                  1. Mathematical Decision Model
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  The engine evaluates whether walking a 10–12 minute distance (700m to 1300m)
                  beats waiting for a feeder bus across 1–3 stops by computing the effective time delta &Delta;T:
                </p>

                <div className="bg-slate-900 text-white p-4 rounded-xl font-mono text-xs space-y-2">
                  <div className="text-emerald-400 font-bold">
                    ΔT = T_walk_effective - T_transit_effective
                  </div>
                  <div className="text-slate-300">
                    T_walk_effective = T_walk_raw + P_weather - B_shelter + P_luggage
                  </div>
                  <div className="text-slate-300">
                    T_transit_effective = T_wait + T_in_bus + P_bus_load + P_headway_risk
                  </div>
                </div>
              </div>

              {/* Thresholds and Logic */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2">Decision Threshold Rules (&theta; = 0.8 mins buffer):</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <div className="font-bold text-emerald-800 mb-1">ΔT &lt; -0.8m → WALK NOW</div>
                    <p className="text-emerald-700">
                      Walking reaches the stop significantly faster than waiting for the feeder bus.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                    <div className="font-bold text-blue-800 mb-1">ΔT &gt; +0.8m → WAIT FOR BUS</div>
                    <p className="text-blue-700">
                      Feeder bus arrival + short hop ride is decisively faster or protects against weather.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                    <div className="font-bold text-amber-800 mb-1">|ΔT| ≤ 0.8m → TIE / EITHER</div>
                    <p className="text-amber-700">
                      Equally timed. Nuanced sub-verdict advises walking for steps or bus for comfort.
                    </p>
                  </div>
                </div>
              </div>

              {/* Penalty Matrices */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2">Singapore Reality Penalty Weights:</h4>
                <table className="w-full text-xs text-left border border-slate-200 rounded-xl overflow-hidden">
                  <thead className="bg-slate-100 text-slate-700 font-semibold">
                    <tr>
                      <th className="p-2.5">Variable</th>
                      <th className="p-2.5">LTA / Real Condition</th>
                      <th className="p-2.5">Weight (Minutes)</th>
                      <th className="p-2.5">Commuter Rationale</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-2.5 font-mono font-medium">LTA Load = LSD</td>
                      <td className="p-2.5">Limited Standing</td>
                      <td className="p-2.5 font-mono text-rose-600 font-bold">+2.2 mins</td>
                      <td className="p-2.5 text-slate-500">Psychological friction, crowded squeeze, slow alighting</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono font-medium">LTA Load = SDA</td>
                      <td className="p-2.5">Standing Available</td>
                      <td className="p-2.5 font-mono text-amber-600 font-bold">+0.6 mins</td>
                      <td className="p-2.5 text-slate-500">Short standing ride fatigue</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono font-medium">LTA Load = SEA</td>
                      <td className="p-2.5">Seats Available</td>
                      <td className="p-2.5 font-mono text-emerald-600 font-bold">-0.4 mins</td>
                      <td className="p-2.5 text-slate-500">Air-conditioned seated comfort bonus</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono font-medium">Weather = Rain</td>
                      <td className="p-2.5">Tropical Downpour</td>
                      <td className="p-2.5 font-mono text-blue-600 font-bold">+5.0 mins</td>
                      <td className="p-2.5 text-slate-500">Puddles, road crossings with umbrella, avoiding wet shoes</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono font-medium">Weather = Heat</td>
                      <td className="p-2.5">SG 33°C Noon Sun</td>
                      <td className="p-2.5 font-mono text-amber-600 font-bold">+2.5 mins</td>
                      <td className="p-2.5 text-slate-500">Sweat avoidance, heat exhaustion risk</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono font-medium">Linkway = Sheltered</td>
                      <td className="p-2.5">Covered walkway</td>
                      <td className="p-2.5 font-mono text-emerald-600 font-bold">-3.8m / -1.5m</td>
                      <td className="p-2.5 text-slate-500">Cancels 75% of rain and 60% of heat friction</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'proxy' && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <h3 className="font-bold text-slate-900 text-base mb-1">
                  2. Security & Rate-Limiting Strategy
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  LTA DataMall mandates rate discipline. Direct client calls would leak the private <code className="bg-slate-200 px-1 rounded">AccountKey</code> and trigger CORS errors in browsers.
                  Our proxy enforces a strict 30-second in-memory cache TTL with HTTP response headers:
                </p>
                <div className="mt-2 text-xs font-mono bg-white p-2.5 rounded-lg border border-slate-200 text-slate-800">
                  Cache-Control: public, s-maxage=30, stale-while-revalidate=15
                </div>
              </div>

              <div className="relative">
                <div className="flex items-center justify-between pb-1.5">
                  <span className="text-xs font-bold text-slate-500">Next.js App Router Route Handler</span>
                  <button
                    onClick={() => handleCopy(nextJsRouteSnippet, 'route')}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {copiedKey === 'route' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'route' ? 'Copied' : 'Copy Code'}</span>
                  </button>
                </div>
                <pre className="p-4 bg-slate-900 text-slate-100 rounded-2xl overflow-x-auto text-xs font-mono leading-relaxed max-h-72">
                  {nextJsRouteSnippet}
                </pre>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900">
                <span className="font-bold">Dual Environment Support: </span>
                Both the Next.js App Router route (<code className="font-mono">app/api/bus-arrival/route.ts</code>) and the Express server route (<code className="font-mono">server.ts</code>) are fully implemented and ready to deploy in any environment.
              </div>
            </div>
          )}

          {activeTab === 'client' && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <h3 className="font-bold text-slate-900 text-base mb-1">
                  3. Clean Separation of Concerns
                </h3>
                <p className="text-xs text-slate-600">
                  The client architecture is modularized into three decoupled layers:
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                  <div className="font-bold text-slate-900 flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    <span>Hook (<code className="font-mono">useWalkOrWait.ts</code>)</span>
                  </div>
                  <p className="text-slate-600">
                    Manages geolocation permissions, fallback to 5-digit bus stop code lookup, 30-second interval polling, AbortController lifecycle, and raw ISO timestamp normalization.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                  <div className="font-bold text-slate-900 flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    <span>Decision Utility (<code className="font-mono">decisionEngine.ts</code>)</span>
                  </div>
                  <p className="text-slate-600">
                    Pure, deterministic TypeScript function computing effective times, load friction (SEA / SDA / LSD), weather penalties, and generating human zero-cognitive-load verdicts.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                  <div className="font-bold text-slate-900 flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-purple-600" />
                    <span>Presentation Card (<code className="font-mono">WalkOrWaitCard.tsx</code>)</span>
                  </div>
                  <p className="text-slate-600">
                    High daylight contrast mobile-first card with dynamic winner state (Green/Blue/Amber), side-by-side ETA comparison, 30s countdown ring, and tactile weather/shelter toggles.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Singapore Land Transport Authority (LTA) DataMall Compliant
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
