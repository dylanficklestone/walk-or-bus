import { BusStop } from '../types/transit';

/**
 * Curated Singapore bus stops representing popular feeder and short-hop commuter corridors
 * where the "Walk or Wait" dilemma routinely occurs.
 */
export const SINGAPORE_BUS_STOPS: BusStop[] = [
  {
    code: '08057',
    name: 'Dhoby Ghaut Stn Exit B',
    road: 'Orchard Rd',
    lat: 1.2991,
    lng: 103.8458,
    services: ['65', '106', '111', '14', '190', '16'],
    destinations: [
      {
        targetStopCode: '08137',
        targetStopName: 'Opp Somerset Stn',
        targetRoad: 'Orchard Rd',
        stopsCount: 1,
        walkDistanceMeters: 750,
        walkDurationMinutes: 9,
      },
      {
        targetStopCode: '08121',
        targetStopName: 'Midpoint Orchard',
        targetRoad: 'Orchard Rd',
        stopsCount: 2,
        walkDistanceMeters: 980,
        walkDurationMinutes: 12,
      },
      {
        targetStopCode: '09048',
        targetStopName: 'Orchard Stn / Lucky Plaza',
        targetRoad: 'Orchard Rd',
        stopsCount: 3,
        walkDistanceMeters: 1350,
        walkDurationMinutes: 16,
      },
    ],
  },
  {
    code: '09048',
    name: 'Lucky Plaza / Orchard Stn',
    road: 'Orchard Rd',
    lat: 1.3044,
    lng: 103.8340,
    services: ['67', '143', '162', '54', '190', '124'],
    destinations: [
      {
        targetStopCode: '09212',
        targetStopName: 'Royal Plaza On Scotts',
        targetRoad: 'Scotts Rd',
        stopsCount: 1,
        walkDistanceMeters: 720,
        walkDurationMinutes: 9,
      },
      {
        targetStopCode: '40181',
        targetStopName: 'Newton Stn Exit B',
        targetRoad: 'Scotts Rd',
        stopsCount: 2,
        walkDistanceMeters: 1100,
        walkDurationMinutes: 13,
      },
    ],
  },
  {
    code: '75009',
    name: 'Tampines Stn / Int',
    road: 'Tampines Central 1',
    lat: 1.3533,
    lng: 103.9452,
    services: ['291', '293', '3', '27', '21', '67'],
    destinations: [
      {
        targetStopCode: '76051',
        targetStopName: 'Our Tampines Hub',
        targetRoad: 'Tampines Ave 4',
        stopsCount: 1,
        walkDistanceMeters: 620,
        walkDurationMinutes: 8,
      },
      {
        targetStopCode: '76069',
        targetStopName: 'Blk 147 (Tampines Palmwalk)',
        targetRoad: 'Tampines Ave 5',
        stopsCount: 2,
        walkDistanceMeters: 920,
        walkDurationMinutes: 11,
      },
      {
        targetStopCode: '76119',
        targetStopName: 'Blk 237 (Tampines Sun)',
        targetRoad: 'Tampines Ave 2',
        stopsCount: 3,
        walkDistanceMeters: 1250,
        walkDurationMinutes: 15,
      },
    ],
  },
  {
    code: '28009',
    name: 'Jurong East Temp Int',
    road: 'Jurong Gateway Rd',
    lat: 1.3331,
    lng: 103.7423,
    services: ['52', '105', '183', '333', '334', '66'],
    destinations: [
      {
        targetStopCode: '28059',
        targetStopName: 'Ng Teng Fong General Hospital',
        targetRoad: 'Boon Lay Way',
        stopsCount: 1,
        walkDistanceMeters: 550,
        walkDurationMinutes: 7,
      },
      {
        targetStopCode: '28659',
        targetStopName: 'IMM Building / Toh Guan',
        targetRoad: 'Toh Guan Rd',
        stopsCount: 2,
        walkDistanceMeters: 950,
        walkDurationMinutes: 12,
      },
      {
        targetStopCode: '28631',
        targetStopName: 'Blk 288E Toh Guan Park',
        targetRoad: 'Toh Guan Rd',
        stopsCount: 3,
        walkDistanceMeters: 1300,
        walkDurationMinutes: 16,
      },
    ],
  },
  {
    code: '11361',
    name: 'Buona Vista Stn Exit C',
    road: 'Commonwealth Ave West',
    lat: 1.3068,
    lng: 103.7904,
    services: ['95', '106', '147', '196', '200', '74'],
    destinations: [
      {
        targetStopCode: '11389',
        targetStopName: 'The Star Vista / Rochester',
        targetRoad: 'Vista Exchange Green',
        stopsCount: 1,
        walkDistanceMeters: 520,
        walkDurationMinutes: 6,
      },
      {
        targetStopCode: '11261',
        targetStopName: 'Holland Village Stn Exit A',
        targetRoad: 'Holland Ave',
        stopsCount: 2,
        walkDistanceMeters: 890,
        walkDurationMinutes: 11,
      },
    ],
  },
  {
    code: '01012',
    name: 'Ocean Towers / Raffles Place',
    road: 'Collyer Quay',
    lat: 1.2842,
    lng: 103.8524,
    services: ['10', '70', '100', '196', '57', '130'],
    destinations: [
      {
        targetStopCode: '03041',
        targetStopName: 'Telok Ayer Stn Exit A',
        targetRoad: 'Cross St',
        stopsCount: 1,
        walkDistanceMeters: 650,
        walkDurationMinutes: 8,
      },
      {
        targetStopCode: '03071',
        targetStopName: 'Opp AXA Tower / Shenton Way',
        targetRoad: 'Shenton Way',
        stopsCount: 2,
        walkDistanceMeters: 960,
        walkDurationMinutes: 12,
      },
      {
        targetStopCode: '03223',
        targetStopName: 'Tanjong Pagar Stn Exit C',
        targetRoad: 'Anson Rd',
        stopsCount: 3,
        walkDistanceMeters: 1280,
        walkDurationMinutes: 16,
      },
    ],
  },
  {
    code: '53231',
    name: 'Bishan Stn / Interchange',
    road: 'Bishan St 13',
    lat: 1.3508,
    lng: 103.8492,
    services: ['54', '56', '410W', '410G', '53', '58'],
    destinations: [
      {
        targetStopCode: '53249',
        targetStopName: 'Opp Bishan Stadium / Sports Hall',
        targetRoad: 'Bishan St 14',
        stopsCount: 1,
        walkDistanceMeters: 600,
        walkDurationMinutes: 8,
      },
      {
        targetStopCode: '53171',
        targetStopName: 'Blk 510 / Bishan Town Park',
        targetRoad: 'Bishan St 13',
        stopsCount: 2,
        walkDistanceMeters: 880,
        walkDurationMinutes: 11,
      },
    ],
  },
  {
    code: '84039',
    name: 'Bedok Stn Exit B',
    road: 'New Upper Changi Rd',
    lat: 1.3240,
    lng: 103.9300,
    services: ['2', '9', '24', '222', '28', '67'],
    destinations: [
      {
        targetStopCode: '84149',
        targetStopName: 'Bedok Sports Complex',
        targetRoad: 'New Upper Changi Rd',
        stopsCount: 1,
        walkDistanceMeters: 680,
        walkDurationMinutes: 8,
      },
      {
        targetStopCode: '84599',
        targetStopName: 'Chai Chee Technopark',
        targetRoad: 'Chai Chee Dr',
        stopsCount: 2,
        walkDistanceMeters: 950,
        walkDurationMinutes: 12,
      },
    ],
  },
];

/**
 * Calculates straight line (Haversine) distance in meters between two coordinates.
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Finds the closest bus stop to given lat/lng
 */
export function findClosestBusStop(lat: number, lng: number): { stop: BusStop; distanceMeters: number } {
  let closest = SINGAPORE_BUS_STOPS[0];
  let minDistance = Infinity;

  for (const stop of SINGAPORE_BUS_STOPS) {
    const dist = calculateDistanceMeters(lat, lng, stop.lat, stop.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closest = stop;
    }
  }

  return { stop: closest, distanceMeters: minDistance };
}

/**
 * Find stop by 5-digit code or partial name
 */
export function searchBusStops(query: string): BusStop[] {
  const clean = query.trim().toLowerCase();
  if (!clean) return SINGAPORE_BUS_STOPS;

  return SINGAPORE_BUS_STOPS.filter(
    (s) =>
      s.code.includes(clean) ||
      s.name.toLowerCase().includes(clean) ||
      s.road.toLowerCase().includes(clean) ||
      s.services.some((srv) => srv.toLowerCase() === clean)
  );
}
