import React, { useState } from 'react';
import {
  Navigation,
  Search,
  MapPin,
  Compass,
  Bus,
  Footprints,
  Info,
  Clock,
  Radio,
  CheckCircle,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { useWalkOrWait } from './hooks/useWalkOrWait';
import { WalkOrWaitCard } from './components/WalkOrWaitCard';
import { BusRouteVisualizer } from './components/BusRouteVisualizer';
import { ArchitectureModal } from './components/ArchitectureModal';
import { ApiHealthChecker } from './components/ApiHealthChecker';
import { AllBusStopsModal } from './components/AllBusStopsModal';
import { ScenarioTester } from './components/ScenarioTester';
import { BusStop, NormalizedBusService, WalkSettings } from './types/transit';

export default function App() {
  const {
    currentStop,
    setCurrentStop,
    selectStopByCode,
    selectedDestinationIndex,
    setSelectedDestinationIndex,
    currentDestination,
    selectedServiceNo,
    setSelectedServiceNo,
    activeService,
    services,
    walkSettings,
    setWalkSettings,
    decision,
    isLoading,
    error,
    cacheStatus,
    countdownSeconds,
    lastUpdated,
    refresh,
    detectNearestStop,
    isLocating,
    geoNotice,
  } = useWalkOrWait('09048'); // Default: Orchard Stn / Lucky Plaza

  const [isStopsModalOpen, setIsStopsModalOpen] = useState(false);
  const [isArchitectureModalOpen, setIsArchitectureModalOpen] = useState(false);
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
  const [customOverriddenService, setCustomOverriddenService] = useState<NormalizedBusService | null>(null);

  // Apply scenario preset
  const handleApplyScenario = (scenario: {
    serviceModifier?: Partial<NormalizedBusService>;
    settingsModifier?: Partial<WalkSettings>;
    destinationIndex?: number;
  }) => {
    if (scenario.destinationIndex !== undefined) {
      setSelectedDestinationIndex(scenario.destinationIndex);
    }
    if (scenario.settingsModifier) {
      setWalkSettings((prev) => ({ ...prev, ...scenario.settingsModifier }));
    }
    if (scenario.serviceModifier && activeService) {
      setCustomOverriddenService({
        ...activeService,
        ...scenario.serviceModifier,
      });
    }
  };

  const effectiveActiveService = customOverriddenService || activeService;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans antialiased selection:bg-blue-500 selection:text-white pb-16">
      {/* 1. Universal Top Bar Contract */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 h-16">
          {/* Zone 1: Brand Wordmark (Single element) */}
          <a
            href="/"
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
              SG
            </div>
            <span>Walk or Wait</span>
          </a>

          {/* Zone 2: Nav links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              onClick={() => setIsStopsModalOpen(true)}
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <span>Bus Stops Directory</span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                01xxx-99xxx
              </span>
            </button>
            <button
              onClick={() => setIsArchitectureModalOpen(true)}
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Decision Formula
            </button>
            <a
              href="#live-feed"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Arrival Monitor
            </a>
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsArchitectureModalOpen(true)}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 shadow-sm min-h-[40px]"
            >
              Architecture & Specs
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {/* Sub-Header & Stop Selector Toolbar */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span>Singapore Feeder Bus vs Foot Dilemma</span>
              <span aria-hidden="true">·</span>
              <span>LTA BusArrivalv3</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-slate-500">30s TTL Cache</span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              Real-Time Commuter Verdict
            </h1>
          </div>

          {/* Location & Stop Quick Selector */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              onClick={detectNearestStop}
              disabled={isLocating}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all shadow-sm active:scale-95 min-h-[44px]"
            >
              <Compass className={`w-3.5 h-3.5 text-blue-600 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Locating...' : 'Locate Nearest'}</span>
            </button>

            <button
              onClick={() => setIsStopsModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all shadow-sm min-h-[44px]"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Bus Stops Directory ({currentStop.code})</span>
            </button>
          </div>
        </div>

        {/* Geolocation feedback notice */}
        {geoNotice && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-800 flex items-center justify-between">
            <span>{geoNotice}</span>
            <button
              onClick={() => {}}
              className="text-blue-600 font-bold hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800">
            {error}
          </div>
        )}

        {/* 3. Core Two-Column Layout (Responsive Ergonomics) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Primary Decision Widget (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <WalkOrWaitCard
              decision={decision}
              currentStop={currentStop}
              currentDestination={currentDestination}
              services={services}
              activeService={effectiveActiveService}
              onSelectService={(srv) => {
                setCustomOverriddenService(null);
                setSelectedServiceNo(srv);
              }}
              onSelectDestinationIndex={(idx) => {
                setCustomOverriddenService(null);
                setSelectedDestinationIndex(idx);
              }}
              selectedDestinationIndex={selectedDestinationIndex}
              walkSettings={walkSettings}
              onUpdateWalkSettings={(newSettings) => {
                setCustomOverriddenService(null);
                setWalkSettings(newSettings);
              }}
              countdownSeconds={countdownSeconds}
              isLoading={isLoading}
              onRefresh={() => {
                setCustomOverriddenService(null);
                refresh();
              }}
              cacheStatus={cacheStatus}
              onOpenArchitectureModal={() => setIsArchitectureModalOpen(true)}
            />

            {/* Scenario Preset Switcher */}
            <ScenarioTester onApplyScenario={handleApplyScenario} />
          </div>

          {/* Right Column: Spatial Diagram & Live Bus Queue (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Spatial Corridor Diagram */}
            <BusRouteVisualizer
              currentStop={currentStop}
              destination={currentDestination}
              activeService={effectiveActiveService}
              verdict={decision.verdict}
              walkMinutes={decision.walkDurationEffectiveMinutes}
              transitMinutes={decision.busTotalEffectiveMinutes}
            />

            {/* Live Feed Monitor */}
            <div id="live-feed" className="bg-white rounded-3xl p-5 md:p-6 border border-slate-100 shadow-xl shadow-slate-200/50">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    LTA DataMall Incoming Queue
                  </h3>
                </div>
                <div className="text-[11px] font-mono text-slate-500">
                  {lastUpdated.toLocaleTimeString()}
                </div>
              </div>

              {/* Service rows */}
              <div className="space-y-3">
                {services.map((srv) => (
                  <div
                    key={srv.serviceNo}
                    onClick={() => {
                      setCustomOverriddenService(null);
                      setSelectedServiceNo(srv.serviceNo);
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                      effectiveActiveService?.serviceNo === srv.serviceNo
                        ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-500/10'
                        : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-base text-slate-900">
                          {srv.serviceNo}
                        </span>
                        <span className="text-[11px] font-medium text-slate-500">
                          {srv.operator} · {srv.busTypeLabel}
                        </span>
                      </div>

                      {/* Primary NextBus ETA */}
                      <div className="text-right">
                        <span className="font-mono font-bold text-sm text-slate-900">
                          {srv.etaMinutes <= 0.8 ? 'Arriving' : `${Math.round(srv.etaMinutes)} mins`}
                        </span>
                      </div>
                    </div>

                    {/* Subsequent Arrivals */}
                    <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">Load:</span>
                        <span
                          className={`font-semibold px-1.5 py-0.2 rounded text-[10px] ${
                            srv.load === 'SEA'
                              ? 'bg-emerald-100 text-emerald-800'
                              : srv.load === 'SDA'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {srv.loadLabel}
                        </span>
                      </div>

                      {/* Subsequent buses if available */}
                      {srv.subsequentBuses && srv.subsequentBuses.length > 0 && (
                        <div className="flex items-center gap-2 text-slate-500 font-mono">
                          <span>Next:</span>
                          {srv.subsequentBuses.map((sub, i) => (
                            <span key={i} className="text-slate-700">
                              +{Math.round(sub.etaMinutes)}m
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Data source transparency */}
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Cache: {cacheStatus || 'HIT'} (30s)</span>
                <span className="font-medium text-slate-600">LTA BusArrivalv3</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Minimalist Footnote */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-200/80 mt-12">
        <div>Singapore Land Transport Authority (LTA) DataMall v3 Compliant</div>
        <div className="flex items-center gap-3 text-slate-400">
          <button
            onClick={() => setIsArchitectureModalOpen(true)}
            className="hover:text-slate-700 transition-colors"
          >
            Algorithm & Specs
          </button>
          <span aria-hidden="true">·</span>
          <button
            onClick={() => setIsHealthModalOpen(true)}
            className="hover:text-slate-700 transition-colors"
          >
            Diagnostics
          </button>
        </div>
      </footer>

      {/* 4. Singapore All Bus Stops Directory Modal */}
      <AllBusStopsModal
        isOpen={isStopsModalOpen}
        onClose={() => setIsStopsModalOpen(false)}
        currentStopCode={currentStop.code}
        onSelectStop={(stop) => {
          setCurrentStop(stop);
          setSelectedDestinationIndex(0);
          setCustomOverriddenService(null);
        }}
        onSelectStopByCode={(code) => {
          selectStopByCode(code);
        }}
      />

      {/* 5. API Health Diagnostics Modal */}
      <ApiHealthChecker
        isOpen={isHealthModalOpen}
        onClose={() => setIsHealthModalOpen(false)}
      />

      {/* 6. Architectural & Formula Modal */}
      <ArchitectureModal
        isOpen={isArchitectureModalOpen}
        onClose={() => setIsArchitectureModalOpen(false)}
      />
    </div>
  );
}
