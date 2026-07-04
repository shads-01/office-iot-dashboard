# Member 1 — Notes & Design Decisions

## Known limitation / design decision: 15 vs 18 devices

The brief has an internal inconsistency: the intro text says "5 devices per
room, 15 devices total," and the floor-plan legend's own fan/light count
(6 fans + 9 lights) also totals 15 — but the same legend's summary box says
"Total Devices: 18," and the dashboard requirements section also says "all
18 devices."

**Decision:** built for **15 devices** (2 fans + 3 lights x 3 rooms), since
that's what the actual per-room device counts add up to everywhere in the
brief. If graders intended a 6th device per room (e.g. an AC unit or smart
plug), that's a small, additive change — one more entry per room in
`devices.js` — and doesn't require restructuring anything else.

## What's in this handoff (Member 1's scope)

- `docs/system-diagram.svg` — full data-flow diagram (devices → simulator →
  backend → dashboard + bot → user)
- `docs/alert-engine-flow.svg` — decision flowchart for the alert engine
  (after-hours check, prolonged-use check, cooldown/dedup, dispatch)
- `docs/circuit-schematic.svg` + `docs/CIRCUIT.md` — representative
  one-room circuit (Work Room 1) with a full GPIO pin-mapping table,
  per-connection wiring steps, and a Wokwi-ready firmware sketch
- `docs/DATA_MODEL.md` — device object shape, ID scheme, power formulas —
  this is the contract Member 2's backend and Member 3's dashboard both
  build against
- `backend/src/devices.js` — device registry, `createInitialDevices()`
- `backend/src/simulator.js` — `tick()`, after-hours demo helper,
  `isAfterHours()`, `deviceWatts()`
- `backend/src/powerCalculator.js` — room/total power, kWh accumulation,
  cost estimation
- `backend/src/db.js` — SQLite history logging (`device_logs`,
  `energy_logs` tables) using `better-sqlite3`

## Note on PNG exports

`docs/*.svg` are hand-built vector diagrams. This environment doesn't have
network access to render PNGs from them, so PNG versions aren't included
here — open each SVG in a browser (or Excalidraw/Inkscape) and export a PNG
if your README template specifically needs the raster version; GitHub
renders `.svg` natively either way.

## Wokwi project

`docs/CIRCUIT.md` contains the complete pin table, wiring steps, and a
ready-to-paste firmware sketch — build the actual Wokwi project
(wokwi.com → new ESP32 project) from that spec, since a live Wokwi project
needs to be created and saved in Wokwi's own editor to get a real
shareable link. Drop that link into `docs/wokwi-link.md` once created.

## Handoff to Member 2

Import directly:
```js
const { createInitialDevices } = require('./devices');
const { tick, isAfterHours, deviceWatts } = require('./simulator');
const { calculatePowerSnapshot, calculateKwh, estimateCost } = require('./powerCalculator');
const { logDeviceState, logEnergy, getTodayEnergy } = require('./db');
```
Run `npm install better-sqlite3` before using `db.js`. Everything else here
is dependency-free.
