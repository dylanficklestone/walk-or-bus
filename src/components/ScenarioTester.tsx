import React from 'react';
import { Sparkles, CloudRain, Users, Footprints, ShieldAlert } from 'lucide-react';
import { NormalizedBusService, WalkSettings } from '../types/transit';

interface ScenarioTesterProps {
  onApplyScenario: (scenario: {
    serviceModifier?: Partial<NormalizedBusService>;
    settingsModifier?: Partial<WalkSettings>;
    destinationIndex?: number;
  }) => void;
}

export const ScenarioTester: React.FC<ScenarioTesterProps> = ({ onApplyScenario }) => {
  return (
    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Quick Scenario Presets</span>
        </span>
        <span className="text-[11px] text-slate-500">Test engine reactivity</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* Scenario 1: The Sardine Can (Bus arrives soon but LSD jam packed) */}
        <button
          onClick={() =>
            onApplyScenario({
              serviceModifier: {
                etaMinutes: 2.0,
                etaSeconds: 120,
                load: 'LSD',
                loadLabel: 'Limited Standing',
              },
              settingsModifier: { weather: 'clear', isSheltered: false },
            })
          }
          className="p-2 rounded-xl bg-white border border-slate-200 text-left hover:border-rose-300 hover:bg-rose-50/30 transition-all text-xs"
        >
          <div className="font-bold text-rose-700 flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span>Packed Bus (LSD)</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Arr 2m, packed → Verdict: Walk!
          </div>
        </button>

        {/* Scenario 2: Afternoon Downpour (Heavy Rain) */}
        <button
          onClick={() =>
            onApplyScenario({
              serviceModifier: {
                etaMinutes: 4.0,
                etaSeconds: 240,
                load: 'SEA',
                loadLabel: 'Seats Available',
              },
              settingsModifier: { weather: 'rain', isSheltered: false },
            })
          }
          className="p-2 rounded-xl bg-white border border-slate-200 text-left hover:border-blue-300 hover:bg-blue-50/30 transition-all text-xs"
        >
          <div className="font-bold text-blue-700 flex items-center gap-1">
            <CloudRain className="w-3 h-3" />
            <span>Tropical Rain</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Downpour → Verdict: Wait inside
          </div>
        </button>

        {/* Scenario 3: Ghost Bus (Bus is 10 mins away) */}
        <button
          onClick={() =>
            onApplyScenario({
              serviceModifier: {
                etaMinutes: 9.5,
                etaSeconds: 570,
                load: 'SEA',
                loadLabel: 'Seats Available',
              },
              settingsModifier: { weather: 'clear' },
            })
          }
          className="p-2 rounded-xl bg-white border border-slate-200 text-left hover:border-emerald-300 hover:bg-emerald-50/30 transition-all text-xs"
        >
          <div className="font-bold text-emerald-700 flex items-center gap-1">
            <Footprints className="w-3 h-3" />
            <span>Bus 10m Away</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Long wait → Verdict: Walk now!
          </div>
        </button>

        {/* Scenario 4: Dream Ride (Arriving 1 min, seats available) */}
        <button
          onClick={() =>
            onApplyScenario({
              serviceModifier: {
                etaMinutes: 1.2,
                etaSeconds: 72,
                load: 'SEA',
                loadLabel: 'Seats Available',
              },
              settingsModifier: { weather: 'clear' },
            })
          }
          className="p-2 rounded-xl bg-white border border-slate-200 text-left hover:border-blue-300 hover:bg-blue-50/30 transition-all text-xs"
        >
          <div className="font-bold text-blue-700 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>Seats & Arr 1m</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Immediate bus → Verdict: Wait
          </div>
        </button>
      </div>
    </div>
  );
};
