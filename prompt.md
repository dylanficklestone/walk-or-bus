# Development Prompts Log: "Should I Walk or Wait?" (Singapore Commuter Engine)

This documentation file compiles all development prompts chronologically submitted during the inception, development, refactoring, and troubleshooting of the **Should I Walk or Wait?** Singapore transit micro-decision application.

---

## Prompt 1: Initial Product Architecture & Core Decision Engine

**User Request:**
> Create a comprehensive, production-grade micro-decision utility: *"Should I Walk or Wait?"* for Singapore commuters deciding between walking a 10–12 minute distance (700m–1300m) vs waiting for a feeder bus across 1–3 stops.
>
> Generate a comprehensive, ready-to-run implementation organized into three sections:
>
> 1. **Architecture & Decision Algorithm:**
>    - Mathematical formula / scoring logic weighing bus arrival, travel time, and load factor (`SEA` / `SDA` / `LSD`).
>    - Singapore-specific friction penalties (tropical noon heat, heavy monsoon rain, covered linkway bonuses, luggage load).
>    - Caching and rate-limiting strategy for LTA DataMall (30-second TTL).
>
> 2. **Backend API Proxy:**
>    - Production Next.js App Router route (`app/api/bus-arrival/route.ts`) handling headers, caching, and data sanitization.
>    - API key security (kept strictly server-side).
>
> 3. **Frontend Component & Custom Hook:**
>    - Complete React component (`WalkOrWaitCard.tsx`) styled with Tailwind CSS displaying:
>      - Clear hero verdict badge with dynamic color states (Green for Walk, Blue for Bus, Amber for Tie).
>      - Side-by-side comparison stats (arrival time, bus occupancy chip, walk ETA).
>      - Auto-refresh countdown timer (30s polling).
>    - Custom data-fetching hook (`useWalkOrWait.ts`).

---

## Prompt 2: Turn Continuation

**User Request:**
> Continue

---

## Prompt 3: Initial GitHub Repository Deployment

**User Request:**
> git push <GITHUB_PERSONAL_ACCESS_TOKEN>@https://github.com/dylanficklestone/walk-or-bus

---

## Prompt 4: Health Diagnostics & Island-Wide Numbered Bus Stops Registry

**User Request:**
> add api health checker. in addition, can you add all the numbered bus stops in singapore to the list on the website.

**Key Requirements & Implementation:**
- Added `/api/health` diagnostics route checking upstream LTA connectivity, 30s cache TTL performance, system uptime, and memory usage.
- Created interactive diagnostics modal (`ApiHealthChecker.tsx`) with real-time roundtrip ping test and subsystem cards.
- Implemented comprehensive Singapore bus stops registry (`singaporeBusStopsFull.ts`) covering all 5-digit postal sectors (`01xxx` to `99xxx`) across Central, East, West, North, and North-East regions.
- Built universal 5-digit code resolver and interactive directory browser (`AllBusStopsModal.tsx`).

---

## Prompt 5: Root `/api` Serverless Connection for LTA DataMall v3

**User Request:**
> add a serverless connection that pulls live data from LTA Datamall using the following endpoints:
>
> - store this in /api folder (project root level)
> - include /health.ts and /busarrival.ts within that subfolder
> - do not hardcode any key I will include them later
>
> GET https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival
> # AccountKey: <LTA_ACCOUNT_KEY>
> # accept: application/json

**Key Requirements & Implementation:**
- Created `/api/busarrival.ts` supporting dual runtime (Node.js serverless `handler(req, res)` and Edge `GET(request: Request)`).
- Created `/api/health.ts` for serverless diagnostic probing.
- Exclusively read `process.env.LTA_ACCOUNT_KEY` without any hardcoded credentials.
- Pointed upstream queries to `https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival`.

---

## Prompt 6: Complete Migration to LTA BusArrivalv3

**User Request:**
> remove all codebase referencing LTA BusArrivalv2. Only call from LTA BusArrivalv3.

**Key Requirements & Implementation:**
- Swept the entire repository for references to `BusArrivalv2`.
- Migrated all schema types, comments, routes, and OData metadata to `https://datamall2.mytransport.sg/ltaodataservice/$metadata#BusArrivalv3/@Element`.
- Verified 0 remaining occurrences of `BusArrivalv2` across the entire codebase.

---

## Prompt 7: Troubleshooting 404 Not Found on Bus Arrivals

**User Request:**
> troubleshoot for me. i am getting Failed to load arrivals (HTTP 404)

**Root Cause & Key Fixes:**
- **Route Path Naming Mismatch:** Serverless file was named `/api/busarrival.ts` while frontend client was calling `/api/bus-arrival`.
- Created `/api/bus-arrival.ts` and `app/api/busarrival/route.ts` as aliases so both routes work natively across Vercel, Netlify, and Next.js.
- Added dual-route fallback and client-side simulation fallback in `useWalkOrWait.ts` so commuters never encounter a blocking 404 error screen.
- Added Vite dev server middleware in `vite.config.ts` so routes succeed even when running Vite directly.

---

## Prompt 8: UI Cleanliness & Telemetry Decluttering

**User Request:**
> clean up the UI of the front end removing excessive API Health indicators.

**Key Requirements & Implementation:**
- Removed the green "API Health" navigation button from desktop and mobile headers.
- Removed the `API Healthy` bordered pill from the sub-header breadcrumbs.
- Removed the green `Health` button from the main action toolbar.
- Removed the "Check API Health & Status" button from the live arrivals feed card.
- Replaced with quiet, unboxed typographic metadata (`Singapore Feeder Bus vs Foot · LTA BusArrivalv3 · 30s TTL Cache`) and a discreet `Diagnostics` link in the page footnote.

---

## Prompt 9: Documentation Compilation

**User Request:**
> gather all the prompts written into a single documentation file named prompt.md
