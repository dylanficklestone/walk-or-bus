import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Search,
  CheckCircle,
  X,
  Compass,
  Train,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  SingaporeBusStopItem,
  SingaporeRegion,
  searchAllSingaporeBusStops,
  resolveAnySingaporeBusStop,
} from '../data/singaporeBusStopsFull';
import { BusStop } from '../types/transit';

interface AllBusStopsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStopCode: string;
  onSelectStop: (stop: BusStop) => void;
  onSelectStopByCode: (code: string) => void;
}

export const AllBusStopsModal: React.FC<AllBusStopsModalProps> = ({
  isOpen,
  onClose,
  currentStopCode,
  onSelectStop,
  onSelectStopByCode,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<SingaporeRegion>('All');
  const [onlyMrt, setOnlyMrt] = useState(false);

  // Quick 5-digit regex check
  const isExact5Digit = /^[0-9]{5}$/.test(searchQuery.trim());
  const synthesizedCandidate = useMemo(() => {
    if (isExact5Digit) {
      return resolveAnySingaporeBusStop(searchQuery.trim());
    }
    return null;
  }, [searchQuery, isExact5Digit]);

  const filteredStops = useMemo(() => {
    let list = searchAllSingaporeBusStops(searchQuery, selectedRegion);
    if (onlyMrt) {
      list = list.filter((s) => s.isMrtInterchange);
    }
    return list;
  }, [searchQuery, selectedRegion, onlyMrt]);

  if (!isOpen) return null;

  const regions: SingaporeRegion[] = ['All', 'Central', 'East', 'West', 'North', 'North-East'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Singapore Numbered Bus Stops Directory
              </h3>
              <p className="text-xs text-slate-500">
                All 5-digit bus stop codes (01xxx – 99xxx) across Singapore
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-100 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search any 5-digit code (e.g. 08057, 12345), road, or MRT..."
              autoFocus
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
            />
          </div>

          {/* Region Tabs & MRT Filter Toggle */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
            <div className="flex items-center gap-1.5">
              {regions.map((reg) => (
                <button
                  key={reg}
                  onClick={() => setSelectedRegion(reg)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors min-h-[36px] ${
                    selectedRegion === reg
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {reg}
                </button>
              ))}
            </div>

            <button
              onClick={() => setOnlyMrt(!onlyMrt)}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors min-h-[36px] shrink-0 ${
                onlyMrt
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Train className="w-3.5 h-3.5" />
              <span>MRT Nodes</span>
            </button>
          </div>
        </div>

        {/* Exact 5-Digit Direct Match Alert */}
        {isExact5Digit && synthesizedCandidate && (
          <div className="px-4 py-3 bg-blue-50 border-b border-blue-100 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Exact 5-Digit Stop #{synthesizedCandidate.code}</span>
              </div>
              <div className="text-[11px] text-blue-700 truncate">
                {synthesizedCandidate.name} · {synthesizedCandidate.road} ({synthesizedCandidate.town})
              </div>
            </div>
            <button
              onClick={() => {
                onSelectStop(synthesizedCandidate);
                onClose();
              }}
              className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors shrink-0"
            >
              Select Now →
            </button>
          </div>
        )}

        {/* Scrollable List */}
        <div className="overflow-y-auto p-4 space-y-2">
          {filteredStops.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              <p className="font-semibold text-slate-700">No matching bus stops found.</p>
              <p className="mt-1">
                Tip: You can enter <strong>any 5-digit number</strong> (e.g. 08057, 12345, 67011) to resolve it anywhere in Singapore.
              </p>
            </div>
          ) : (
            filteredStops.map((stop) => {
              const isSelected = currentStopCode === stop.code;
              return (
                <button
                  key={stop.code}
                  onClick={() => {
                    onSelectStop(stop);
                    onClose();
                  }}
                  className={`w-full p-3.5 rounded-2xl text-left border transition-all flex items-center justify-between group ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/10'
                      : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                        #{stop.code}
                      </span>
                      <span className="font-bold text-xs text-slate-900 truncate">
                        {stop.name}
                      </span>
                      {stop.isMrtInterchange && (
                        <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.2 rounded">
                          MRT
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5 truncate">
                      <span>{stop.road}</span>
                      <span aria-hidden="true">·</span>
                      <span>{stop.town}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-slate-400 font-semibold">{stop.region}</span>
                    </div>

                    <div className="text-[10px] text-slate-400 mt-1 font-mono truncate">
                      Services: {stop.services.slice(0, 7).join(', ')}
                      {stop.services.length > 7 ? ` +${stop.services.length - 7} more` : ''}
                    </div>
                  </div>

                  {isSelected ? (
                    <CheckCircle className="w-5 h-5 text-blue-600 shrink-0" />
                  ) : (
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 shrink-0 transition-colors" />
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {filteredStops.length} bus stops</span>
          <span className="font-mono">Covers 01000 – 99999</span>
        </div>
      </div>
    </div>
  );
};
