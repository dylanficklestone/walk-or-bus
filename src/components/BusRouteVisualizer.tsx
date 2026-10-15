import React from 'react';
import { Bus, Footprints, MapPin, Navigation, ArrowRight, ShieldCheck } from 'lucide-react';
import { BusStop, NormalizedBusService, VerdictType } from '../types/transit';

interface BusRouteVisualizerProps {
  currentStop: BusStop;
  destination: {
    targetStopCode: string;
    targetStopName: string;
    targetRoad: string;
    stopsCount: number;
    walkDistanceMeters: number;
    walkDurationMinutes: number;
  };
  activeService?: NormalizedBusService;
  verdict: VerdictType;
  walkMinutes: number;
  transitMinutes: number;
}

export const BusRouteVisualizer: React.FC<BusRouteVisualizerProps> = ({
  currentStop,
  destination,
  activeService,
  verdict,
  walkMinutes,
  transitMinutes,
}) => {
  const isWalk = verdict === 'WALK';
  const isWait = verdict === 'WAIT';

  return (
    <div className="w-full bg-white rounded-3xl p-5 md:p-6 border border-slate-100 shadow-xl shadow-slate-200/50">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">Spatial Corridor Diagram</h3>
        </div>
        <div className="text-xs font-mono text-slate-500">
          {destination.walkDistanceMeters}m corridor
        </div>
      </div>

      {/* Schematic Route Track */}
      <div className="relative py-4">
        {/* Origin Stop Pin */}
        <div className="flex items-start gap-3">
          <div className="relative flex flex-col items-center">
            <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold ring-4 ring-slate-100 shrink-0">
              A
            </div>
            {/* Vertical connector line */}
            <div className="w-0.5 h-24 bg-gradient-to-b from-slate-300 via-slate-200 to-slate-400 my-1 border-dashed" />
          </div>

          <div className="min-w-0 pt-0.5 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 truncate">
                {currentStop.name}
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                Stop #{currentStop.code}
              </span>
            </div>
            <div className="text-[11px] text-slate-500">{currentStop.road}</div>

            {/* Approaching bus teaser */}
            {activeService && (
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 text-xs font-medium border border-blue-200">
                <Bus className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                <span>
                  Bus {activeService.serviceNo} ~
                  {activeService.etaMinutes <= 0.8
                    ? 'Arr'
                    : `${Math.round(activeService.etaMinutes)}m away`}
                </span>
                <span className="text-[10px] text-blue-600 font-mono">
                  ({activeService.loadLabel})
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Mid-corridor comparison paths */}
        <div className="ml-9 my-2 grid grid-cols-2 gap-2 text-xs">
          {/* Walk Path */}
          <div
            className={`p-2.5 rounded-xl border transition-all ${
              isWalk
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold">
              <Footprints className="w-3.5 h-3.5" />
              <span>Direct Footpath</span>
            </div>
            <div className="mt-1 text-[11px] font-mono">
              ~{Math.round(walkMinutes)} mins · {destination.walkDistanceMeters}m
            </div>
          </div>

          {/* Bus Transit Route */}
          <div
            className={`p-2.5 rounded-xl border transition-all ${
              isWait
                ? 'bg-blue-50 border-blue-300 text-blue-900'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold">
              <Bus className="w-3.5 h-3.5" />
              <span>Feeder Bus</span>
            </div>
            <div className="mt-1 text-[11px] font-mono">
              ~{Math.round(transitMinutes)} mins · {destination.stopsCount} stop{destination.stopsCount > 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Destination Stop Pin */}
        <div className="flex items-start gap-3 mt-1">
          <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold ring-4 ring-emerald-100 shrink-0">
            B
          </div>
          <div className="min-w-0 pt-0.5 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 truncate">
                {destination.targetStopName}
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                Stop #{destination.targetStopCode}
              </span>
            </div>
            <div className="text-[11px] text-slate-500">{destination.targetRoad}</div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Singapore LTA DataMall Standard (30s polling)</span>
        </span>
        <span className="font-mono">1.8m/stop avg</span>
      </div>
    </div>
  );
};
