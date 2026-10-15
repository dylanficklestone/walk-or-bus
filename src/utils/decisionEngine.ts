import {
  DecisionResult,
  NormalizedBusService,
  VerdictType,
  WalkSettings,
} from '../types/transit';

/**
 * Standard bus dwell and travel time per feeder bus stop in Singapore
 * (accounts for boarding, traffic lights, and average speed of ~18 km/h).
 */
const AVERAGE_MINUTES_PER_BUS_STOP = 1.8;

/**
 * Parses LTA DataMall Load code to human readable label
 */
export function getLoadLabel(load: string): string {
  switch (load) {
    case 'SEA':
      return 'Seats Available';
    case 'SDA':
      return 'Standing Available';
    case 'LSD':
      return 'Limited Standing';
    default:
      return 'Unknown Load';
  }
}

/**
 * Parses LTA DataMall Bus Type to human label
 */
export function getBusTypeLabel(type: string): string {
  switch (type) {
    case 'DD':
      return 'Double Deck';
    case 'BD':
      return 'Bendy Bus';
    case 'SD':
    default:
      return 'Single Deck';
  }
}

/**
 * Computes the zero-cognitive-load verdict comparing walking vs taking the feeder bus.
 *
 * Mathematical model:
 * T_walk_eff = T_walk_raw + P_weather - B_shelter + P_luggage
 * T_transit_eff = T_wait + T_in_bus + P_load + P_uncertainty
 * Delta = T_walk_eff - T_transit_eff
 */
export function evaluateWalkOrWait(
  walkDistanceMeters: number,
  stopsCount: number,
  busService: NormalizedBusService | undefined,
  settings: WalkSettings,
  destinationName: string = 'destination'
): DecisionResult {
  // 1. Walking Base Calculation
  const speedMetersPerMinute = (settings.walkingSpeedKmh * 1000) / 60;
  const walkDurationRawMinutes = walkDistanceMeters / speedMetersPerMinute;

  // 2. Walk Penalties & Bonuses
  let weatherPenaltyMinutes = 0;
  if (settings.weather === 'heat') {
    // High noon tropical sun (32°C - 34°C, UV index > 10)
    weatherPenaltyMinutes = 2.5;
  } else if (settings.weather === 'rain') {
    // Tropical monsoon / sudden shower
    weatherPenaltyMinutes = 5.0;
  }

  let shelteredBonusMinutes = 0;
  if (settings.isSheltered) {
    if (settings.weather === 'rain') {
      // Sheltered walkway mitigates 75% of rain friction
      shelteredBonusMinutes = 3.8;
    } else if (settings.weather === 'heat') {
      // Shade eliminates 60% of heat penalty
      shelteredBonusMinutes = 1.5;
    } else {
      shelteredBonusMinutes = 0.5; // Slight comfort bonus
    }
  }

  const luggagePenaltyMinutes = settings.hasLuggage ? 3.0 : 0;

  const walkDurationEffectiveMinutes = Math.max(
    1,
    walkDurationRawMinutes + weatherPenaltyMinutes - shelteredBonusMinutes + luggagePenaltyMinutes
  );

  // 3. Transit Calculation
  // If no bus arrival data is available, commuter must walk
  if (!busService || isNaN(busService.etaMinutes)) {
    return {
      verdict: 'WALK',
      primaryHeadline: 'Walk now — no incoming bus detected',
      subReason: 'No bus arrival schedule available. Walking is the only reliable choice.',
      timeSavedMinutes: Math.round(walkDurationRawMinutes),
      walkDurationRawMinutes,
      walkDurationEffectiveMinutes,
      busWaitMinutes: 999,
      busInTransitMinutes: stopsCount * AVERAGE_MINUTES_PER_BUS_STOP,
      busTotalEffectiveMinutes: 999,
      deltaMinutes: -999,
      busLoadPenaltyMinutes: 0,
      weatherPenaltyMinutes,
      shelteredBonusMinutes,
      luggagePenaltyMinutes,
      selectedBusService: busService,
      selectedDestinationStopName: destinationName,
      stopsCount,
      walkDistanceMeters,
    };
  }

  // Bus Wait Time
  const busWaitMinutes = Math.max(0.5, busService.etaMinutes);

  // In-bus travel time across specified stops
  const busInTransitMinutes = Math.max(1.0, stopsCount * AVERAGE_MINUTES_PER_BUS_STOP);

  // Bus Load Psychological & Boarding Friction Penalty
  let busLoadPenaltyMinutes = 0;
  if (busService.load === 'LSD') {
    // Limited standing: packed crowd, boarding bottleneck, zero personal space
    busLoadPenaltyMinutes = 2.2;
  } else if (busService.load === 'SDA') {
    // Standing available: mild discomfort for short ride
    busLoadPenaltyMinutes = 0.6;
  } else if (busService.load === 'SEA') {
    // Seats available: comfortable air-conditioned ride
    busLoadPenaltyMinutes = -0.4;
  }

  // Headway uncertainty penalty (long waits have higher variance in SG traffic)
  const busUncertaintyPenaltyMinutes = busWaitMinutes > 8 ? 1.0 : 0;

  const busTotalEffectiveMinutes = Math.max(
    1,
    busWaitMinutes + busInTransitMinutes + busLoadPenaltyMinutes + busUncertaintyPenaltyMinutes
  );

  // 4. Decision Delta: Delta = Walk - Transit
  // Positive delta: Walk takes longer -> WAIT for bus
  // Negative delta: Bus takes longer -> WALK
  const deltaMinutes = walkDurationEffectiveMinutes - busTotalEffectiveMinutes;
  const absDeltaRounded = Math.max(1, Math.round(Math.abs(deltaMinutes)));

  let verdict: VerdictType = 'TIE';
  let primaryHeadline = '';
  let subReason = '';

  const THRESHOLD = 0.8; // Tolerance buffer in minutes

  if (deltaMinutes <= -THRESHOLD) {
    // WALKING IS THE CLEAR WINNER
    verdict = 'WALK';

    if (busService.load === 'LSD') {
      primaryHeadline = `Walk now — saves ${absDeltaRounded} min${absDeltaRounded === 1 ? '' : 's'} (bus is packed)`;
      subReason = `Bus ${busService.serviceNo} has limited standing. Save ${absDeltaRounded} mins and skip the crowded bus.`;
    } else if (busWaitMinutes >= 6) {
      primaryHeadline = `Walk now — saves ${absDeltaRounded} min${absDeltaRounded === 1 ? '' : 's'} (bus is ${Math.round(busWaitMinutes)}m away)`;
      subReason = `Waiting ${Math.round(busWaitMinutes)} mins for a ${stopsCount}-stop hop is slower than brisk walking.`;
    } else {
      primaryHeadline = `Walk now — saves ${absDeltaRounded} min${absDeltaRounded === 1 ? '' : 's'}`;
      subReason = `You will arrive at ${destinationName} faster on foot than waiting and boarding.`;
    }
  } else if (deltaMinutes >= THRESHOLD) {
    // BUS IS THE CLEAR WINNER
    verdict = 'WAIT';
    const waitRound = Math.max(1, Math.round(busWaitMinutes));

    if (settings.weather === 'rain' && !settings.isSheltered) {
      primaryHeadline = `Wait ${waitRound} min${waitRound === 1 ? '' : 's'} for Bus ${busService.serviceNo} (stay dry)`;
      subReason = `Heavy rain makes walking miserable. Bus arrives in ${waitRound}m and saves ${absDeltaRounded}m.`;
    } else if (settings.weather === 'heat') {
      primaryHeadline = `Wait ${waitRound} min${waitRound === 1 ? '' : 's'} for Bus ${busService.serviceNo} (air-con beat heat)`;
      subReason = `Bus arrives in ${waitRound} mins with air conditioning. Avoid 33°C tropical heat.`;
    } else if (busService.load === 'SEA') {
      primaryHeadline = `Wait ${waitRound} min${waitRound === 1 ? '' : 's'} for Bus ${busService.serviceNo} (seats available)`;
      subReason = `Guaranteed seats available. Arrives in ${waitRound}m and beats walking by ${absDeltaRounded} mins.`;
    } else {
      primaryHeadline = `Wait ${waitRound} min${waitRound === 1 ? '' : 's'} for Bus ${busService.serviceNo} — saves ${absDeltaRounded} min${absDeltaRounded === 1 ? '' : 's'}`;
      subReason = `Bus ${busService.serviceNo} is pulling up shortly. Faster than walking ${walkDistanceMeters}m.`;
    }
  } else {
    // TIE (within +/- 0.8 minutes)
    verdict = 'TIE';
    const totalEst = Math.round(walkDurationRawMinutes);
    if (settings.weather === 'rain' || settings.weather === 'heat') {
      primaryHeadline = `Tie — wait for Bus ${busService.serviceNo} to beat weather`;
      subReason = `Both choices take ~${totalEst} mins. Feeder bus is recommended to stay dry/cool.`;
    } else if (settings.hasLuggage) {
      primaryHeadline = `Tie — wait for Bus ${busService.serviceNo} (carrying load)`;
      subReason = `Both choices take ~${totalEst} mins. Feeder bus avoids carrying heavy bags.`;
    } else {
      primaryHeadline = `Tie (~${totalEst} mins either way) — Walk for steps!`;
      subReason = `Time is virtually identical (~${totalEst} mins). Walk if you want steps, or wait for Bus ${busService.serviceNo}.`;
    }
  }

  return {
    verdict,
    primaryHeadline,
    subReason,
    timeSavedMinutes: absDeltaRounded,
    walkDurationRawMinutes,
    walkDurationEffectiveMinutes,
    busWaitMinutes,
    busInTransitMinutes,
    busTotalEffectiveMinutes,
    deltaMinutes,
    busLoadPenaltyMinutes,
    weatherPenaltyMinutes,
    shelteredBonusMinutes,
    luggagePenaltyMinutes,
    selectedBusService: busService,
    selectedDestinationStopName: destinationName,
    stopsCount,
    walkDistanceMeters,
  };
}
