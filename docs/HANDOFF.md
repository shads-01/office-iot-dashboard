# Backend Handoff Document (Member 2 Scope Transfer)

## 📌 Context & Scope
The Express API, Socket.IO server, and Alert Engine inside `backend/src/api.js`, `alerts.js`, and `socket.js` were built ahead of schedule during the initial system integration design. To ensure zero development collisions or duplication of effort, **Member 2 should review this handoff, take full ownership of these files, and continue from here rather than rebuilding the API server from scratch.**

Please confirm with the team before initiating any parallel backend routes or Socket server work.

---

## 🗂️ File Mapping
1. **[api.js](file:///media/arkosaha/Volume1/office-iot-dashboard/backend/src/api.js)**: Configures the Express application, wires CORS, creates the HTTP server, registers all REST endpoints, initializes the Socket.IO listener, and schedules the 5-second simulator tick loop.
2. **[alerts.js](file:///media/arkosaha/Volume1/office-iot-dashboard/backend/src/alerts.js)**: The alert evaluation engine. Iterates through device states on every tick to flag anomalies.
3. **[socket.js](file:///media/arkosaha/Volume1/office-iot-dashboard/backend/src/socket.js)**: Manages client WebSocket connections, tracks connected client metrics, and handles real-time event broadcasting.

---

## 🌐 REST Endpoints Map (`api.js`)

| Method | Endpoint | Description | Response Model |
|---|---|---|---|
| **GET** | `/api/health` | Service health, uptime, and database status check | `{ ok: true, uptime: seconds, deviceCount: 15, connectedClients: N, timestamp: ISO }` |
| **GET** | `/api/devices` | Returns current status array of all 15 simulated devices | `{ devices: [...], count: 15, timestamp: ISO }` |
| **GET** | `/api/rooms` | Returns summary list of all 3 rooms (Drawing Room, Work Room 1, Work Room 2) | `{ rooms: [...], count: 3 }` |
| **GET** | `/api/rooms/:roomId` | Detailed status of devices and power draw in a specific room | `{ room: roomId, name: roomName, devices: [...], power: { watts, onCount, totalCount } }` |
| **GET** | `/api/power/current` | Active real-time power draw totals across all rooms | `{ currentWatts, maxCapacity: 495, timestamp: ISO }` |
| **GET** | `/api/power/today` | Persistent kWh accumulator totals starting from midnight (calls `db.js`) | `{ kwh, estimatedCost, currency: "BDT", rate: 8.0, unit: "BDT/kWh", timestamp: ISO }` |
| **GET** | `/api/power/history` | Historical 24-hour hourly energy log averages | `{ history: [ { hour, avg_watts }, ... ], count: 24 }` |
| **GET** | `/api/alerts` | List of all unresolved active warnings and history logs | `{ alerts: [...], count: N }` |
| **POST** | `/api/devices/:id/toggle` | Manual toggle override. Mutates status, logs history, and broadcasts state. | `{ success: true, device: { id, status, wattage, ... }, power: { ... } }` |
| **POST** | `/api/simulate/after-hours` | Dev Scenario trigger. Forces all devices in a room ON and backdates changes to 3 hours ago. | `{ success: true, roomId, message: "Scenario activated", devices: [...] }` |
| **GET** | `/api/devices/:id/history` | Historical logs of state toggles for a single device | `{ deviceId, history: [ { timestamp, status }, ... ], count: N }` |

---

## 🔌 Socket.IO WebSocket Event Interface (`socket.js`)

All events use wildcard CORS origins for development. The server broadcasts updates to all active clients:
* **`devices:update`** (Outgoing): Broadcasts the updated array of all 15 device states. Triggered on every tick and on manual REST toggles.
* **`power:update`** (Outgoing): Broadcasts the current active power draw (W), cumulative kWh, and estimated cost (BDT). Triggered on every tick.
* **`alert:new`** (Outgoing): Emits a single alert object when a new anomaly is registered (and passes the deduplication filter).

---

## 🚨 Alert Engine & Deduplication Logic (`alerts.js`)

The engine checks two rules every tick:
1. **After-Hours Warning (`after-hours` / Severity: Amber)**
   * **Trigger**: Triggered outside 9:00 AM – 5:00 PM if any device in a room is left in an `"on"` status.
   * **Message**: `⚠️ [Room Name] still has [N] device(s) ON. Did someone forget to leave?`
2. **Prolonged Use Warning (`prolonged-use` / Severity: Red)**
   * **Trigger**: Triggered when all 5 devices in a room are continuously `"on"` for over **2 hours** straight.
   * **Message**: `🔴 [Room Name] has had ALL devices running for over 2 hours straight, drawing [W]W.`

### ⏱️ Cooldown & Deduplication Filter
* **Window**: **30 minutes** (`ALERT_COOLDOWN_MS = 30 * 60 * 1000`).
* **Logic**: A unique key `alertType:roomId` is cached in an in-memory map. When an alert condition triggers, the engine checks if it has fired for that specific room within the last 30 minutes. If yes, it is suppressed; if no, it is written to the database, emitted via `alert:new`, and the timestamp is refreshed in cache.
