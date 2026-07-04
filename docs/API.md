# Backend API — Office IoT Dashboard

Base URL: `http://localhost:4000`

Endpoints overview:

- `GET /api/health` — health check
- `GET /api/devices` — all devices and current state
- `GET /api/rooms` — summary data for all rooms
- `GET /api/rooms/:roomId` — devices in a specific room
- `POST /api/devices/:id/toggle` — manually toggle a device (admin)
- `GET /api/power/current` — current total watts and per-room breakdown
- `GET /api/power/today` — today's kWh estimate and estimated cost
- `GET /api/power/history?hours=1` — recent energy snapshots for charting
- `GET /api/alerts?hours=24` — recent alerts
- `POST /api/simulate/after-hours` — demo helper to force after-hours on (body: { roomId?: string })

Socket.IO events (connect to the server and listen):

- `devices:update` — full devices array pushed every tick
- `power:update` — aggregated power + kWh + client count pushed every tick
- `alert:new` — sent when a new alert fires

See `backend/src/api.js` for implementation details and `backend/src/simulator.js` for the device model.
# Office IoT Dashboard — API Documentation

Base URL: `http://localhost:4000`

## REST Endpoints

### Health Check

```
GET /api/health
```

**Response:**
```json
{
  "ok": true,
  "uptime": 123.456,
  "deviceCount": 15,
  "connectedClients": 2,
  "timestamp": "2026-07-04T12:00:00.000Z"
}
```

---

### Get All Devices

```
GET /api/devices
```

Returns all 15 devices with their current state.

**Response:**
```json
{
  "devices": [
    {
      "id": "drawingroom-fan-1",
      "name": "Fan 1",
      "type": "fan",
      "room": "drawingroom",
      "roomName": "Drawing Room",
      "status": "on",
      "wattage": 60,
      "ratedWattage": 60,
      "lastChanged": "2026-07-04T12:00:00.000Z"
    }
  ],
  "count": 15,
  "timestamp": "2026-07-04T12:00:00.000Z"
}
```

---

### Get All Rooms

```
GET /api/rooms
```

**Response:**
```json
{
  "rooms": [
    {
      "id": "drawingroom",
      "name": "Drawing Room",
      "description": "Waiting area",
      "deviceCount": 5,
      "onCount": 3,
      "totalWatts": 135
    }
  ]
}
```

---

### Get Room Details

```
GET /api/rooms/:roomId
```

**Parameters:**
| Param    | Type   | Valid Values                              |
|----------|--------|-------------------------------------------|
| `roomId` | string | `drawingroom`, `workroom1`, `workroom2`   |

**Response:**
```json
{
  "room": "Drawing Room",
  "roomId": "drawingroom",
  "description": "Waiting area",
  "devices": [ /* device objects */ ],
  "summary": {
    "total": 5,
    "on": 3,
    "off": 2,
    "watts": 135,
    "fans": { "on": 1, "total": 2 },
    "lights": { "on": 2, "total": 3 }
  },
  "timestamp": "2026-07-04T12:00:00.000Z"
}
```

**Error (404):**
```json
{
  "error": "Room not found",
  "validRooms": ["drawingroom", "workroom1", "workroom2"]
}
```

---

### Get Current Power

```
GET /api/power/current
```

**Response:**
```json
{
  "total": 450,
  "unit": "W",
  "byRoom": {
    "drawingroom": { "roomName": "Drawing Room", "watts": 135, "onCount": 3, "totalCount": 5 },
    "workroom1": { "roomName": "Work Room 1", "watts": 165, "onCount": 5, "totalCount": 5 },
    "workroom2": { "roomName": "Work Room 2", "watts": 150, "onCount": 4, "totalCount": 5 }
  },
  "timestamp": "2026-07-04T12:00:00.000Z"
}
```

---

### Get Today's Usage

```
GET /api/power/today
```

**Response:**
```json
{
  "kwh": 4.2,
  "estimatedCost": 33.6,
  "currency": "BDT",
  "currentWatts": 450,
  "rate": 8,
  "unit": "BDT/kWh",
  "timestamp": "2026-07-04T12:00:00.000Z"
}
```

---

### Get Power History

```
GET /api/power/history?hours=1
```

**Query Parameters:**
| Param   | Type   | Default | Description                        |
|---------|--------|---------|------------------------------------|
| `hours` | number | 1       | How many hours of history to fetch |

**Response:**
```json
{
  "history": [
    { "total_watts": 450, "timestamp": "2026-07-04T11:00:00.000Z" },
    { "total_watts": 390, "timestamp": "2026-07-04T11:00:05.000Z" }
  ],
  "hours": 1,
  "count": 720
}
```

---

### Get Alerts

```
GET /api/alerts?hours=24
```

**Query Parameters:**
| Param   | Type   | Default | Description                          |
|---------|--------|---------|--------------------------------------|
| `hours` | number | 24      | How many hours of alerts to retrieve |

**Response:**
```json
{
  "alerts": [
    {
      "id": "alert-1720094400000-1",
      "type": "after-hours",
      "severity": "warning",
      "message": "⚠️ Drawing Room still has 2 fans and 3 lights ON and it's 10:00 PM. Did someone forget to leave?",
      "room": "drawingroom",
      "devices": ["drawingroom-fan-1", "drawingroom-fan-2"],
      "timestamp": "2026-07-04T22:00:00.000Z"
    }
  ],
  "count": 1,
  "timestamp": "2026-07-04T22:00:05.000Z"
}
```

---

### Toggle Device

```
POST /api/devices/:id/toggle
```

**Parameters:**
| Param | Type   | Example             |
|-------|--------|---------------------|
| `id`  | string | `workroom1-fan-1`   |

**Response:**
```json
{
  "message": "Fan 1 in Work Room 1 toggled to ON",
  "device": { /* updated device object */ }
}
```

---

### Get Device History

```
GET /api/devices/:id/history
```

**Response:**
```json
{
  "device": { "id": "workroom1-fan-1", "name": "Fan 1", "room": "Work Room 1" },
  "history": [
    { "id": 1, "device_id": "workroom1-fan-1", "status": "on", "wattage": 60, "room": "workroom1", "timestamp": "..." }
  ],
  "count": 25
}
```

---

### Simulate After-Hours Scenario (Demo)

```
POST /api/simulate/after-hours
Content-Type: application/json

{ "roomId": "workroom2" }   // optional — omit to force all rooms
```

**Response:**
```json
{
  "message": "After-hours scenario forced for workroom2. Alerts will fire on next tick.",
  "devices": [ /* all devices */ ]
}
```

---

## WebSocket Events (Socket.IO)

Connect to `http://localhost:4000` via Socket.IO client.

### Events Emitted by Server

| Event            | Frequency    | Payload                                          |
|------------------|--------------|--------------------------------------------------|
| `devices:update` | Every 5s     | `Device[]` — full array of 15 device objects      |
| `power:update`   | Every 5s     | `{ total, byRoom, kwh, estimatedCost, ... }`     |
| `alert:new`      | On new alert | `Alert` object (only when not in cooldown)        |

### Client Connection Example

```js
import { io } from "socket.io-client";

const socket = io("http://localhost:4000");

socket.on("devices:update", (devices) => {
  console.log("Devices updated:", devices);
});

socket.on("power:update", (power) => {
  console.log("Power:", power.total, "W");
});

socket.on("alert:new", (alert) => {
  console.log("ALERT:", alert.message);
});
```

---

## Device ID Format

Device IDs follow the pattern: `{roomId}-{type}-{number}`

| Room          | Fans                                | Lights                                                    |
|---------------|-------------------------------------|-----------------------------------------------------------|
| Drawing Room  | `drawingroom-fan-1`, `drawingroom-fan-2` | `drawingroom-light-1`, `drawingroom-light-2`, `drawingroom-light-3` |
| Work Room 1   | `workroom1-fan-1`, `workroom1-fan-2`     | `workroom1-light-1`, `workroom1-light-2`, `workroom1-light-3`       |
| Work Room 2   | `workroom2-fan-1`, `workroom2-fan-2`     | `workroom2-light-1`, `workroom2-light-2`, `workroom2-light-3`       |

---

## Alert Types

| Type             | Severity  | Trigger Condition                                |
|------------------|-----------|--------------------------------------------------|
| `after-hours`    | `warning` | Any device ON outside 9 AM – 5 PM               |
| `prolonged-use`  | `danger`  | All devices in a room ON for 2+ hours continuous |

Alerts have a 30-minute cooldown per type+room to prevent spam.
