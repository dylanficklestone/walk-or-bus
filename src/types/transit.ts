/**
 * Strict TypeScript types for Singapore LTA DataMall BusArrivalv3 API,
 * distance routing, and commuter decision engine.
 */

/**
 * LTA DataMall Bus Load categories:
 * SEA: Seats Available (Green)
 * SDA: Standing Available (Amber)
 * LSD: Limited Standing (Red / Packed)
 */
export type BusLoad = 'SEA' | 'SDA' | 'LSD';

/**
 * LTA DataMall Bus Features:
 * WAB: Wheelchair Accessible Bus
 */
export type BusFeature = 'WAB' | '';

/**
 * LTA DataMall Bus Types:
 * SD: Single Deck
 * DD: Double Deck
 * BD: Bendy Bus
 */
export type BusType = 'SD' | 'DD' | 'BD';

/**
 * Raw NextBus object schema from LTA DataMall BusArrivalv3
 */
export interface LTANextBus {
  OriginCode: string;
  DestinationCode: string;
  EstimatedArrival: string; // ISO 8601 string, e.g. "2026-10-15T06:35:12+08:00"
  Latitude: string;
  Longitude: string;
  VisitNumber: string;
  Load: BusLoad;
  Feature: BusFeature;
  Type: BusType;
}

/**
 * Raw BusService schema from LTA DataMall BusArrivalv3
 */
export interface LTABusService {
  ServiceNo: string;
  Operator: 'SBST' | 'SMRT' | 'TTS' | 'GAS';
  NextBus: LTANextBus;
  NextBus2?: LTANextBus;
  NextBus3?: LTANextBus;
}

/**
 * Root response payload from LTA DataMall BusArrivalv3
 */
export interface LTABusArrivalResponse {
  'odata.metadata': string;
  BusStopCode: string;
  Services: LTABusService[];
}

/**
 * Normalized arrival information for client-side processing
 */
export interface NormalizedBusService {
  serviceNo: string;
  operator: string;
  etaMinutes: number; // minutes from now (can be 0 or negative if arriving/just left)
  etaSeconds: number; // exact seconds from now
  estimatedArrivalTime: string; // ISO string
  load: BusLoad;
  loadLabel: string;
  feature: BusFeature;
  isWheelchairAccessible: boolean;
  busType: BusType;
  busTypeLabel: string;
  subsequentBuses: Array<{
    etaMinutes: number;
    load: BusLoad;
    busType: BusType;
  }>;
}

/**
 * Singapore Bus Stop representation
 */
export interface BusStop {
  code: string; // 5-digit code, e.g. "08057"
  name: string; // e.g. "Dhoby Ghaut Stn Exit B"
  road: string; // e.g. "Orchard Rd"
  lat: number;
  lng: number;
  services: string[];
  destinations?: Array<{
    targetStopCode: string;
    targetStopName: string;
    targetRoad: string;
    stopsCount: number; // 1 to 3 stops
    walkDistanceMeters: number; // 700 - 1100m (approx 9 - 13 mins walk)
    walkDurationMinutes: number;
  }>;
}

/**
 * Weather condition in Singapore
 */
export type WeatherCondition = 'clear' | 'heat' | 'rain';

/**
 * Commuter walk preference configuration
 */
export interface WalkSettings {
  walkingSpeedKmh: number; // 4.0 (relaxed), 4.8 (standard), 5.5 (brisk)
  weather: WeatherCondition;
  isSheltered: boolean;
  hasLuggage: boolean;
}

export type VerdictType = 'WALK' | 'WAIT' | 'TIE';

/**
 * Full output from the Decision Engine
 */
export interface DecisionResult {
  verdict: VerdictType;
  primaryHeadline: string; // e.g., "Walk now — saves 4 mins (bus is crowded)"
  subReason: string; // detailed context
  timeSavedMinutes: number; // absolute minutes saved by following verdict
  
  // Breakdown numbers for inspection
  walkDurationRawMinutes: number;
  walkDurationEffectiveMinutes: number;
  busWaitMinutes: number;
  busInTransitMinutes: number;
  busTotalEffectiveMinutes: number;
  deltaMinutes: number; // T_walk_eff - T_transit_eff (positive means transit is faster, negative means walk is faster)

  // Penalties applied
  busLoadPenaltyMinutes: number;
  weatherPenaltyMinutes: number;
  shelteredBonusMinutes: number;
  luggagePenaltyMinutes: number;
  
  // Active bus details
  selectedBusService?: NormalizedBusService;
  selectedDestinationStopName?: string;
  stopsCount: number;
  walkDistanceMeters: number;
}
