# Data Model

## Rooms

| Room ID | Label | Room code (used in device IDs) |
|---|---|---|
| `drawingroom` | Drawing Room | `dr` |
| `workroom1` | Work Room 1 | `wr1` |
| `workroom2` | Work Room 2 | `wr2` |

## Devices (15 total: 6 fans + 9 lights)

Each room has 2 fans + 3 lights. Device ID pattern: `<room-code>-<type>-<index>`.

| Device ID | Name | Type | Room | Wattage (ON) |
|---|---|---|---|---|
| dr-fan-1 | Fan 1 | fan | drawingroom | 60W |
| dr-fan-2 | Fan 2 | fan | drawingroom | 60W |
| dr-light-1 | Light 1 | light | drawingroom | 15W |
| dr-light-2 | Light 2 | light | drawingroom | 15W |
| dr-light-3 | Light 3 | light | drawingroom | 15W |
| wr1-fan-1 | Fan 1 | fan | workroom1 | 60W |
| wr1-fan-2 | Fan 2 | fan | workroom1 | 60W |
| wr1-light-1 | Light 1 | light | workroom1 | 15W |
| wr1-light-2 | Light 2 | light | workroom1 | 15W |
| wr1-light-3 | Light 3 | light | workroom1 | 15W |
| wr2-fan-1 | Fan 1 | fan | workroom2 | 60W |
| wr2-fan-2 | Fan 2 | fan | workroom2 | 60W |
| wr2-light-1 | Light 1 | light | workroom2 | 15W |
| wr2-light-2 | Light 2 | light | workroom2 | 15W |
| wr2-light-3 | Light 3 | light | workroom2 | 15W |

## Device object shape

```js
{
  id: "wr1-fan-1",
  name: "Fan 1",
  type: "fan",              // "fan" | "light"
  room: "workroom1",         // "drawingroom" | "workroom1" | "workroom2"
  status: "on",               // "on" | "off"
  wattage: 60,                 // fixed rated wattage; deviceWatts() returns this if ON, else 0
  lastChanged: "2026-07-04T14:32:00Z"
}
```

**Contract note for Member 2:** this exact shape is what `createInitialDevices()`
returns and what `tick()` mutates in place. Build the REST/Socket.IO layer
against this shape from day 1 — don't add or rename fields without updating
this doc, since both the dashboard and bot are built against it.

## Power formulas

- **Instantaneous device wattage:** `status === "on" ? wattage : 0`
- **Room power:** sum of instantaneous wattage for devices in that room
- **Total power:** sum of instantaneous wattage across all 15 devices
- **kWh per tick:** `(totalWatts / 1000) * tickIntervalHours`
- **Running "today" kWh:** sum of every tick's kWh contribution since local midnight (reset at midnight or on server restart for demo purposes)
- **Estimated cost:** `kwh * ratePerKwh` (default rate: 8.5 BDT/kWh — a placeholder, swap for your local tariff)

## History logging

Every *status change* (not every tick) is written to the `device_logs` SQLite
table (`device_id, status, timestamp`). Every tick's total wattage and the
kWh it added are written to `energy_logs` (`total_watts, kwh_delta,
timestamp`). This unlocks, for near-zero extra work:
- Historical usage charts (query `energy_logs` since a given time)
- "Time since last change" alert logic (query `device_logs` per device)
- A CSV/PDF export bonus feature
