import React, { useState } from 'react';
import {
  Footprints,
  Bus,
  CloudRain,
  Sun,
  Umbrella,
  Briefcase,
  RotateCw,
  MapPin,
  ChevronRight,
  Accessibility,
  ArrowRight,
  HelpCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { DecisionResult, NormalizedBusService, WalkSettings, BusStop } from '../types/transit';

interface WalkOrWaitCardProps {
  decision: DecisionResult;
  currentStop: BusStop;
  currentDestination: {
    targetStopCode: string;
    targetStopName: string;
    targetRoad: string;
    stopsCount: number;
    walkDistanceMeters: number;
    walkDurationMinutes: number;
  };
  services: NormalizedBusService[];
  activeService?: NormalizedBusService;
  onSelectService: (serviceNo: string) => void;
  onSelectDestinationIndex: (index: number) => void;
  selectedDestinationIndex: number;
  walkSettings: WalkSettings;
  onUpdateWalkSettings: (settings: WalkSettings) => void;
  countdownSeconds: number;
  isLoading: boolean;
  onRefresh: () => void;
  cacheStatus: 'HIT' | 'MISS' | 'SIMULATED' | null;
  onOpenArchitectureModal?: () => void;
}

export const WalkOrWaitCard: React.FC<WalkOrWaitCardProps> = ({
  decision,
  currentStop,
  currentDestination,
  services,
  activeService,
  onSelectService,
  onSelectDestinationIndex,
  selectedDestinationIndex,
  walkSettings,
  onUpdateWalkSettings,
  countdownSeconds,
  isLoading,
  onRefresh,
  cacheStatus,
  onOpenArchitectureModal,
}) => {
  const [showFormulaBreakdown, setShowFormulaBreakdown] = useState(false);

  // Verdict theme variables
  const isWalk = decision.verdict === 'WALK';
  const isWait = decision.verdict === 'WAIT';
  const isTie = decision.verdict === 'TIE';

  // Badge background, border, and text colors
  const verdictTheme = isWalk
    ? {
        heroBg: 'bg-emerald-600',
        badgeBg: 'bg-emerald-50 text-emerald-950 border border-emerald-200',
        accentText: 'text-emerald-700',
        cardBorder: 'border-emerald-200',
        winnerTitle: 'WALK NOW',
        icon: Footprints,
      }
    : isWait
    ? {
        heroBg: 'bg-blue-600',
        badgeBg: 'bg-blue-50 text-blue-950 border border-blue-200',
        accentText: 'text-blue-700',
        cardBorder: 'border-blue-200',
        winnerTitle: 'WAIT FOR BUS',
        icon: Bus,
      }
    : {
        heroBg: 'bg-amber-600',
        badgeBg: 'bg-amber-50 text-amber-950 border border-amber-200',
        accentText: 'text-amber-700',
        cardBorder: 'border-amber-200',
        winnerTitle: 'TIE / EITHER WAY',
        icon: Sparkles,
      };

  const VerdictIcon = verdictTheme.icon;

  // Occupancy style mapping
  const getLoadBadgeStyle = (load?: string) => {
    switch (load) {
      case 'SEA':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'SDA':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'LSD':
        return 'text-rose-700 bg-rose-50 border-rose-200';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="w-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
      {/* 1. Header Strip: Stop info & 30s Countdown timer */}
      <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <span>Stop {currentStop.code}</span>
              <span aria-hidden="true">·</span>
              <span className="truncate">{currentStop.road}</span>
            </div>
            <h2 className="text-base font-bold text-slate-900 truncate">
              {currentStop.name}
            </h2>
          </div>
        </div>

        {/* 30-Second Polling Ring & Manual Refresh */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            aria-label="Refresh arrivals now"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors active:scale-95 min-h-[40px]"
          >
            <RotateCw className={`w-3.5 h-3.5 text-slate-500 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
            <span className="font-mono tabular-nums">{countdownSeconds}s</span>
          </button>
        </div>
      </div>

      {/* 2. Destination / Hop Target Selector */}
      {currentStop.destinations && currentStop.destinations.length > 0 && (
        <div className="px-5 pt-4 pb-2 border-b border-slate-100 bg-white">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
            <span>Destination Hop</span>
            <span className="font-mono">{currentDestination.walkDistanceMeters}m · ~{currentDestination.stopsCount} bus stop{currentDestination.stopsCount > 1 ? 's' : ''}</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {currentStop.destinations.map((dest, idx) => {
              const isSelected = selectedDestinationIndex === idx;
              return (
                <button
                  key={dest.targetStopCode}
                  onClick={() => onSelectDestinationIndex(idx)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 min-h-[44px] ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-sm ring-2 ring-slate-900/10'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>{dest.stopsCount} stop{dest.stopsCount > 1 ? 's' : ''}</span>
                  <span className="opacity-60">→</span>
                  <span className="truncate max-w-[140px]">{dest.targetStopName}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Hero Verdict Banner (Zero-Cognitive Load) */}
      <div className="p-5 md:p-6">
        <div
          className={`rounded-2xl p-5 md:p-6 transition-colors duration-300 ${
            isWalk
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
              : isWait
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
              : 'bg-amber-600 text-white shadow-lg shadow-amber-600/20'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-black/20 text-white mb-2">
                <VerdictIcon className="w-3.5 h-3.5" />
                <span>Verdict: {verdictTheme.winnerTitle}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight">
                {decision.primaryHeadline}
              </h1>
              <p className="mt-2 text-sm text-white/90 font-medium leading-relaxed">
                {decision.subReason}
              </p>
            </div>

            {/* Big Minutes Saved Pill */}
            <div className="shrink-0 bg-white/20 backdrop-blur-md px-3.5 py-2.5 rounded-2xl text-center min-w-[72px]">
              <div className="text-2xl md:text-3xl font-extrabold font-mono tabular-nums leading-none">
                {isTie ? '±0' : `${decision.timeSavedMinutes}m`}
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-wider mt-1 text-white/80">
                {isTie ? 'Tie' : 'Saved'}
              </div>
            </div>
          </div>
        </div>

        {/* 4. Side-by-Side Comparison Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
          {/* Walking Card */}
          <div
            className={`rounded-2xl p-4 border transition-all ${
              isWalk
                ? 'bg-emerald-50/60 border-emerald-200 ring-2 ring-emerald-500/10'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    isWalk ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  <Footprints className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold text-slate-900">Walk Option</span>
              </div>

              {isWalk && (
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Fastest
                </span>
              )}
            </div>

            <div className="mt-3 space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-500 font-medium">Door-to-door ETA</span>
                <span className="text-2xl font-extrabold font-mono tabular-nums text-slate-900">
                  {Math.round(decision.walkDurationEffectiveMinutes)} <span className="text-xs font-sans font-normal text-slate-500">mins</span>
                </span>
              </div>

              <div className="text-xs text-slate-600 space-y-1 pt-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Distance</span>
                  <span className="font-mono font-medium">{currentDestination.walkDistanceMeters}m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Base Pace</span>
                  <span className="font-mono font-medium">
                    {Math.round(decision.walkDurationRawMinutes)} mins ({walkSettings.walkingSpeedKmh} km/h)
                  </span>
                </div>
                {(decision.weatherPenaltyMinutes > 0 || decision.shelteredBonusMinutes > 0) && (
                  <div className="flex justify-between text-amber-700 font-medium">
                    <span>Weather adjustment</span>
                    <span className="font-mono">
                      {decision.weatherPenaltyMinutes > 0 && `+${decision.weatherPenaltyMinutes}m `}
                      {decision.shelteredBonusMinutes > 0 && `(-${decision.shelteredBonusMinutes}m sheltered)`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bus Transit Card */}
          <div
            className={`rounded-2xl p-4 border transition-all ${
              isWait
                ? 'bg-blue-50/60 border-blue-200 ring-2 ring-blue-500/10'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    isWait ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  <Bus className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold text-slate-900">
                  Bus {activeService ? activeService.serviceNo : 'Feeder'}
                </span>
              </div>

              {isWait && (
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                  Recommended
                </span>
              )}
            </div>

            <div className="mt-3 space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-500 font-medium">Total Transit ETA</span>
                <span className="text-2xl font-extrabold font-mono tabular-nums text-slate-900">
                  {activeService ? Math.round(decision.busTotalEffectiveMinutes) : '--'}{' '}
                  <span className="text-xs font-sans font-normal text-slate-500">mins</span>
                </span>
              </div>

              <div className="text-xs text-slate-600 space-y-1 pt-1">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Arrival at stop</span>
                  <span className="font-mono font-bold text-slate-900">
                    {activeService
                      ? activeService.etaMinutes <= 0.8
                        ? 'Arr / 1 min'
                        : `${Math.round(activeService.etaMinutes)} mins`
                      : 'No bus'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ride time</span>
                  <span className="font-mono font-medium">
                    ~{Math.round(decision.busInTransitMinutes)} mins ({currentDestination.stopsCount} stops)
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Occupancy load</span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${getLoadBadgeStyle(
                      activeService?.load
                    )}`}
                  >
                    {activeService ? activeService.loadLabel : 'Unknown'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Bus Service Switcher Bar (Feeder Services) */}
        {services.length > 0 && (
          <div className="mt-5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2.5">
              <span>Bus Services at Stop {currentStop.code}</span>
              <span className="text-[11px] text-slate-500 font-normal">Tap to switch service</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {services.map((srv) => {
                const isSelected = activeService?.serviceNo === srv.serviceNo;
                return (
                  <button
                    key={srv.serviceNo}
                    onClick={() => onSelectService(srv.serviceNo)}
                    className={`p-2.5 rounded-xl border text-left transition-all min-h-[48px] ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm tracking-tight">{srv.serviceNo}</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : srv.load === 'SEA'
                            ? 'bg-emerald-100 text-emerald-800'
                            : srv.load === 'SDA'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {srv.load}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] mt-1 opacity-90">
                      <span className="font-mono">
                        {srv.etaMinutes <= 0.8 ? 'Arr' : `${Math.round(srv.etaMinutes)}m`}
                      </span>
                      <span className="text-[10px] opacity-75">{srv.busType}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 6. Contextual Real-World Controls (Weather, Shelter, Speed, Luggage) */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            Real-World Conditions
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Weather condition buttons */}
            <button
              onClick={() => {
                const nextWeather =
                  walkSettings.weather === 'clear'
                    ? 'heat'
                    : walkSettings.weather === 'heat'
                    ? 'rain'
                    : 'clear';
                onUpdateWalkSettings({ ...walkSettings, weather: nextWeather });
              }}
              className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 transition-all min-h-[44px] ${
                walkSettings.weather === 'rain'
                  ? 'bg-blue-50 text-blue-900 border-blue-300'
                  : walkSettings.weather === 'heat'
                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {walkSettings.weather === 'rain' ? (
                <CloudRain className="w-4 h-4 text-blue-600 shrink-0" />
              ) : walkSettings.weather === 'heat' ? (
                <Sun className="w-4 h-4 text-amber-600 shrink-0" />
              ) : (
                <Sun className="w-4 h-4 text-slate-500 shrink-0" />
              )}
              <div className="truncate">
                <div className="text-[10px] text-slate-500">Weather</div>
                <div className="capitalize">{walkSettings.weather} {walkSettings.weather === 'heat' ? '33°C' : ''}</div>
              </div>
            </button>

            {/* Sheltered Linkway toggle */}
            <button
              onClick={() =>
                onUpdateWalkSettings({
                  ...walkSettings,
                  isSheltered: !walkSettings.isSheltered,
                })
              }
              className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 transition-all min-h-[44px] ${
                walkSettings.isSheltered
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Umbrella
                className={`w-4 h-4 shrink-0 ${
                  walkSettings.isSheltered ? 'text-emerald-600' : 'text-slate-400'
                }`}
              />
              <div className="truncate">
                <div className="text-[10px] text-slate-500">Linkway</div>
                <div>{walkSettings.isSheltered ? 'Covered' : 'Exposed'}</div>
              </div>
            </button>

            {/* Walking Pace */}
            <button
              onClick={() => {
                const nextSpeed =
                  walkSettings.walkingSpeedKmh === 4.0
                    ? 4.8
                    : walkSettings.walkingSpeedKmh === 4.8
                    ? 5.5
                    : 4.0;
                onUpdateWalkSettings({ ...walkSettings, walkingSpeedKmh: nextSpeed });
              }}
              className="p-2.5 rounded-xl border border-slate-200 bg-white text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all min-h-[44px]"
            >
              <div className="text-[10px] text-slate-500">Pace</div>
              <div className="font-mono">
                {walkSettings.walkingSpeedKmh === 4.0
                  ? 'Relaxed (4.0)'
                  : walkSettings.walkingSpeedKmh === 4.8
                  ? 'Normal (4.8)'
                  : 'Brisk (5.5)'}
              </div>
            </button>

            {/* Heavy Luggage / Groceries */}
            <button
              onClick={() =>
                onUpdateWalkSettings({
                  ...walkSettings,
                  hasLuggage: !walkSettings.hasLuggage,
                })
              }
              className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 transition-all min-h-[44px] ${
                walkSettings.hasLuggage
                  ? 'bg-purple-50 text-purple-900 border-purple-300'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Briefcase
                className={`w-4 h-4 shrink-0 ${
                  walkSettings.hasLuggage ? 'text-purple-600' : 'text-slate-400'
                }`}
              />
              <div className="truncate">
                <div className="text-[10px] text-slate-500">Bags</div>
                <div>{walkSettings.hasLuggage ? 'Heavy Load' : 'Light'}</div>
              </div>
            </button>
          </div>
        </div>

        {/* 7. Decision Formula / Architectural Inspector Toggle */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => setShowFormulaBreakdown(!showFormulaBreakdown)}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>{showFormulaBreakdown ? 'Hide Math Breakdown' : 'How was this calculated?'}</span>
          </button>

          {onOpenArchitectureModal && (
            <button
              onClick={onOpenArchitectureModal}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
            >
              Architecture & API Spec →
            </button>
          )}
        </div>

        {/* Expandable Mathematical Breakdown */}
        {showFormulaBreakdown && (
          <div className="mt-3 p-4 bg-slate-900 text-slate-100 rounded-2xl text-xs space-y-3 font-mono">
            <div className="font-bold text-slate-300 font-sans text-sm flex items-center justify-between">
              <span>Decision Engine Scoring Logic</span>
              <span className="text-[11px] font-mono text-emerald-400">ΔT = {decision.deltaMinutes.toFixed(1)} mins</span>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-xl space-y-1.5">
              <div className="text-slate-400 text-[11px]">// Walking Model: T_walk_eff = T_raw + P_weather - B_shelter + P_luggage</div>
              <div>
                T_walk_eff = {decision.walkDurationRawMinutes.toFixed(1)}m (raw)
                {decision.weatherPenaltyMinutes > 0 && ` + ${decision.weatherPenaltyMinutes}m (weather)`}
                {decision.shelteredBonusMinutes > 0 && ` - ${decision.shelteredBonusMinutes}m (shelter)`}
                {decision.luggagePenaltyMinutes > 0 && ` + ${decision.luggagePenaltyMinutes}m (bags)`}
                {' = '}
                <span className="text-emerald-400 font-bold">{decision.walkDurationEffectiveMinutes.toFixed(1)} mins</span>
              </div>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-xl space-y-1.5">
              <div className="text-slate-400 text-[11px]">// Transit Model: T_transit_eff = T_wait + T_in_bus + P_load + P_uncertainty</div>
              <div>
                T_transit_eff = {decision.busWaitMinutes.toFixed(1)}m (wait) + {decision.busInTransitMinutes.toFixed(1)}m (dwell & ride)
                {decision.busLoadPenaltyMinutes !== 0 && ` + ${decision.busLoadPenaltyMinutes.toFixed(1)}m (${activeService?.load})`}
                {' = '}
                <span className="text-blue-400 font-bold">{decision.busTotalEffectiveMinutes.toFixed(1)} mins</span>
              </div>
            </div>

            <div className="text-slate-400 text-[11px] leading-relaxed font-sans">
              Formula: ΔT = T_walk_eff - T_transit_eff. If ΔT &gt; 0.8 min, Wait for Bus wins. If ΔT &lt; -0.8 min, Walk Now wins. Comfort penalty weights apply for packed bus (LSD +2.2m) or rain (+5.0m).
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
