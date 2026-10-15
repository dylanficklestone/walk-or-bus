import { useState, useEffect, useCallback, useRef } from 'react';
import {
  BusStop,
  DecisionResult,
  LTABusArrivalResponse,
  LTABusService,
  NormalizedBusService,
  WalkSettings,
} from '../types/transit';
import {
  ALL_SINGAPORE_BUS_STOPS,
  resolveAnySingaporeBusStop,
} from '../data/singaporeBusStopsFull';
import {
  SINGAPORE_BUS_STOPS,
  findClosestBusStop,
} from '../data/singaporeBusData';
import {
  evaluateWalkOrWait,
  getBusTypeLabel,
  getLoadLabel,
} from '../utils/decisionEngine';

const REFRESH_INTERVAL_SECONDS = 30;

export function useWalkOrWait(initialStopCode: string = '09048') {
  // Current bus stop (resolves any 5-digit code in Singapore)
  const [currentStop, setCurrentStop] = useState<BusStop>(() => {
    return resolveAnySingaporeBusStop(initialStopCode);
  });

  const selectStopByCode = useCallback((code: string) => {
    const resolved = resolveAnySingaporeBusStop(code);
    setCurrentStop(resolved);
    setSelectedDestinationIndex(0);
    setSelectedServiceNo('');
  }, []);

  // Destination / hop target index (e.g. 0 = 1 stop away, 1 = 2 stops away)
  const [selectedDestinationIndex, setSelectedDestinationIndex] = useState<number>(0);

  // Selected bus service number (or empty string for auto-pick earliest arrival)
  const [selectedServiceNo, setSelectedServiceNo] = useState<string>('');

  // Commuter preferences
  const [walkSettings, setWalkSettings] = useState<WalkSettings>({
    walkingSpeedKmh: 4.8, // Singapore average brisk walking speed
    weather: 'clear',
    isSheltered: false,
    hasLuggage: false,
  });

  // Normalized bus services
  const [services, setServices] = useState<NormalizedBusService[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cacheStatus, setCacheStatus] = useState<'HIT' | 'MISS' | 'SIMULATED' | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [countdownSeconds, setCountdownSeconds] = useState<number>(REFRESH_INTERVAL_SECONDS);

  // Geolocation states
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [geoNotice, setGeoNotice] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Normalizes raw LTA arrival response into clean minutes and seconds
   */
  const processArrivalData = useCallback(
    (rawData: LTABusArrivalResponse): NormalizedBusService[] => {
      const now = Date.now();

      const normalizedList: NormalizedBusService[] = (rawData.Services || []).map(
        (srv: LTABusService) => {
          const nextBus = srv.NextBus;
          let etaMinutes = 0;
          let etaSeconds = 0;

          if (nextBus?.EstimatedArrival) {
            const arrivalMs = new Date(nextBus.EstimatedArrival).getTime();
            const diffSeconds = Math.max(0, Math.floor((arrivalMs - now) / 1000));
            etaSeconds = diffSeconds;
            etaMinutes = +(diffSeconds / 60).toFixed(1);
          }

          const subsequentBuses = [];
          if (srv.NextBus2?.EstimatedArrival) {
            const arr2 = new Date(srv.NextBus2.EstimatedArrival).getTime();
            subsequentBuses.push({
              etaMinutes: +(Math.max(0, Math.floor((arr2 - now) / 1000)) / 60).toFixed(1),
              load: srv.NextBus2.Load,
              busType: srv.NextBus2.Type,
            });
          }
          if (srv.NextBus3?.EstimatedArrival) {
            const arr3 = new Date(srv.NextBus3.EstimatedArrival).getTime();
            subsequentBuses.push({
              etaMinutes: +(Math.max(0, Math.floor((arr3 - now) / 1000)) / 60).toFixed(1),
              load: srv.NextBus3.Load,
              busType: srv.NextBus3.Type,
            });
          }

          return {
            serviceNo: srv.ServiceNo,
            operator: srv.Operator,
            etaMinutes,
            etaSeconds,
            estimatedArrivalTime: nextBus?.EstimatedArrival || '',
            load: nextBus?.Load || 'SEA',
            loadLabel: getLoadLabel(nextBus?.Load || 'SEA'),
            feature: nextBus?.Feature || '',
            isWheelchairAccessible: nextBus?.Feature === 'WAB',
            busType: nextBus?.Type || 'SD',
            busTypeLabel: getBusTypeLabel(nextBus?.Type || 'SD'),
            subsequentBuses,
          };
        }
      );

      // Sort by earliest arriving bus
      return normalizedList.sort((a, b) => a.etaSeconds - b.etaSeconds);
    },
    []
  );

  /**
   * Fetches bus arrivals from the backend reverse proxy
   */
  const fetchArrivals = useCallback(async (stopCode: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/bus-arrival?BusStopCode=${encodeURIComponent(stopCode)}`, {
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`Failed to load arrivals (HTTP ${res.status})`);
      }

      const cacheHeader = res.headers.get('X-Cache') as any;
      setCacheStatus(cacheHeader || 'MISS');

      const data: LTABusArrivalResponse = await res.json();
      const processed = processArrivalData(data);
      setServices(processed);
      setLastUpdated(new Date());
      setCountdownSeconds(REFRESH_INTERVAL_SECONDS);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Unable to load real-time bus arrivals');
      }
    } finally {
      setIsLoading(false);
    }
  }, [processArrivalData]);

  // Initial fetch on stop change
  useEffect(() => {
    fetchArrivals(currentStop.code);
    setSelectedDestinationIndex(0);
  }, [currentStop.code, fetchArrivals]);

  // 30-Second Polling Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          fetchArrivals(currentStop.code);
          return REFRESH_INTERVAL_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentStop.code, fetchArrivals]);

  // Auto-refresh hook trigger
  const refresh = useCallback(() => {
    fetchArrivals(currentStop.code);
  }, [currentStop.code, fetchArrivals]);

  /**
   * Geolocation auto-detection with fallback
   */
  const detectNearestStop = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setGeoNotice('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setGeoNotice(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const { latitude, longitude } = position.coords;
        const { stop, distanceMeters } = findClosestBusStop(latitude, longitude);

        setCurrentStop(stop);
        const kmStr = (distanceMeters / 1000).toFixed(1);
        setGeoNotice(`Located nearest stop: ${stop.name} (${distanceMeters < 1000 ? `${distanceMeters}m` : `${kmStr}km`} away)`);
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation error:', err);
        setGeoNotice('Location access denied. Pick a Singapore transit hub from the list.');
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  }, []);

  // Determine active destination and distance
  const currentDestination =
    currentStop.destinations && currentStop.destinations[selectedDestinationIndex]
      ? currentStop.destinations[selectedDestinationIndex]
      : {
          targetStopCode: '00000',
          targetStopName: 'Next Hub',
          targetRoad: currentStop.road,
          stopsCount: 2,
          walkDistanceMeters: 850,
          walkDurationMinutes: 11,
        };

  // Determine active bus service
  const activeService =
    services.find((s) => s.serviceNo === selectedServiceNo) || services[0];

  // Run the decision engine
  const decision: DecisionResult = evaluateWalkOrWait(
    currentDestination.walkDistanceMeters,
    currentDestination.stopsCount,
    activeService,
    walkSettings,
    currentDestination.targetStopName
  );

  return {
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
  };
}
