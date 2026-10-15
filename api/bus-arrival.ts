/**
 * Serverless Route Handler: /api/bus-arrival (Alias for /api/busarrival)
 *
 * Ensures compatibility for environments calling either:
 * - /api/busarrival
 * - /api/bus-arrival
 */

import handler, { GET, handleBusArrivalQuery } from './busarrival';

export default handler;
export { GET, handleBusArrivalQuery };
