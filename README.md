# 🏢 Office IoT Dashboard

> A real-time office monitoring system that tracks lights, fans, and power consumption through a web dashboard and Discord bot.

**The Problem:** People keep leaving the office lights and fans running after hours. The electricity bill keeps climbing, and nobody notices.

**The Solution:** A live dashboard + Discord bot that monitors every device in the office, tracks power consumption, estimates costs, and sends alerts when something's left on after hours.

---

## ✨ Features

### Web Dashboard
- **Live Device Status Panel** — Real-time on/off state of all 15 devices, organized by room
- **Interactive Floor Plan** — Top-view office layout with animated lights (glow) and fans (spin)
- **Power Consumption Meter** — Total watts + per-room breakdown, updating live
- **Active Alerts Panel** — Timestamped warnings for after-hours usage and prolonged device activity
- **Manual Device Toggle** — Click to toggle any device on/off (admin override)
- **Cost Estimation** — Today's kWh usage converted to BDT

### Discord Bot
- `/status` — Current status of all devices across all rooms
- `/room <name>` — Detailed status of a specific room (with autocomplete)
- `/usage` — Power consumption, today's kWh, and estimated cost in BDT
- **Proactive Alerts** — Automatically posts to a designated channel when devices are left on after hours
- **Gemini AI Responses** — Warm, conversational replies powered by Google Gemini (not robotic data dumps!)

### Backend
- **Device Simulator** — 15 devices (2 fans + 3 lights × 3 rooms) with dynamic state changes every 5s
- **SQLite History** — Logs every state change for kWh calculation and historical charts
- **Alert Engine** — After-hours detection (outside 9 AM–5 PM) + prolonged-use detection (2+ hours continuous)
- **REST API + Socket.IO** — Single source of truth for both dashboard and bot

---

## 🏗️ Architecture

```
┌─────────────────────┐
│   Device Simulator  │ Generates live state for 15 devices
│   (In-Memory + DB)  │ Tick every 5 seconds
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│   Backend Server    │ Express + Socket.IO + SQLite
│   (Port 4000)       │ REST API + WebSocket events
│   + Alert Engine    │ After-hours & prolonged-use detection
└─────────┬───────────┘
          │
    ┌─────┴─────┐
    │           │
    ▼           ▼
┌────────┐  ┌──────────┐
│  Web   │  │ Discord  │
│  Dash  │  │   Bot    │
│ (5173) │  │          │
└────────┘  └──────────┘
```

Both the web dashboard and the Discord bot read from the **same backend** — there is one source of truth.

---

## 📋 Spec Note: 15 vs 18 Devices

The project brief contains an inconsistency: the intro says "5 devices per room, 15 total" while the dashboard section mentions "18 devices." The math is clear: **2 fans + 3 lights × 3 rooms = 15 devices**. This project builds for 15 devices, matching the actual specification math.

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) v18+ 
- [npm](https://www.npmjs.com/) (comes with Node.js)
- A [Discord Bot](https://discord.com/developers/applications) application
- A [Google Gemini API Key](https://aistudio.google.com/apikey)

### 1. Clone & Install

```bash
git clone https://github.com/your-username/office-iot-dashboard.git
cd office-iot-dashboard
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env   # Edit if you want a custom port
npm run dev
```

The backend starts on `http://localhost:4000`. You should see:
```
╔════════════════════════════════════════════════╗
║  Office IoT Dashboard — Backend Server         ║
║  Running on http://localhost:4000              ║
║  Devices: 15 | Tick: 5s | Rooms: 3            ║
╚════════════════════════════════════════════════╝
```

**Verify:** Open `http://localhost:4000/api/health` — you should see `{"ok": true, ...}`

### 3. Discord Bot Setup

```bash
cd bot
npm install
cp .env.example .env
```

Edit `bot/.env` with your credentials:
```env
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_application_client_id
DISCORD_GUILD_ID=your_test_server_id
BACKEND_URL=http://localhost:4000
GEMINI_API_KEY=your_gemini_api_key
ALERT_CHANNEL_ID=your_alert_channel_id
```

**How to get these values:**
| Variable | Where to find it |
|---|---|
| `DISCORD_TOKEN` | [Discord Developer Portal](https://discord.com/developers/applications) → Bot → Token |
| `DISCORD_CLIENT_ID` | Developer Portal → General Information → Application ID |
| `DISCORD_GUILD_ID` | Enable Developer Mode in Discord → right-click your server → Copy Server ID |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) → Create API Key |
| `ALERT_CHANNEL_ID` | Right-click the channel in Discord → Copy Channel ID |

**Register slash commands** (one-time):
```bash
npm run deploy
```

**Start the bot:**
```bash
npm run dev
```

### 4. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Dashboard opens on `http://localhost:5173`

### 5. (Alternative) Docker Compose

```bash
# From root directory
docker-compose up --build
```

This starts all three services (backend :4000, frontend :5173, bot).  
Note: You still need `bot/.env` configured before running Docker.

---

## 🧪 Verification & Testing Guide

### Step 1: Verify Backend API

After starting the backend (`npm run dev` in `/backend`), test each endpoint:

```bash
# Health check — should return {"ok": true}
curl http://localhost:4000/api/health

# All devices — should return 15 devices with status, wattage, etc.
curl http://localhost:4000/api/devices

# Specific room — try all three
curl http://localhost:4000/api/rooms/drawingroom
curl http://localhost:4000/api/rooms/workroom1
curl http://localhost:4000/api/rooms/workroom2

# Current power — total watts + per-room breakdown
curl http://localhost:4000/api/power/current

# Today's usage — kWh + estimated cost in BDT
curl http://localhost:4000/api/power/today

# Power history (last 1 hour)
curl http://localhost:4000/api/power/history?hours=1

# Alerts (last 24 hours)
curl http://localhost:4000/api/alerts

# Toggle a specific device manually
curl -X POST http://localhost:4000/api/devices/workroom1-fan-1/toggle

# Force after-hours scenario (for demo/testing alerts)
curl -X POST http://localhost:4000/api/simulate/after-hours -H "Content-Type: application/json" -d "{\"roomId\": \"workroom2\"}"
```

**What to check:**
- [ ] `/api/devices` returns exactly 15 devices
- [ ] Each device has `id`, `name`, `type`, `room`, `status`, `wattage`, `lastChanged`
- [ ] `/api/power/current` total matches sum of per-room watts
- [ ] `/api/power/today` returns a `kwh` value that increases over time
- [ ] Hitting the same endpoint 10 seconds apart shows different device states (simulator is ticking)
- [ ] `/api/rooms/invalid` returns a 404 with valid room list
- [ ] Toggle endpoint changes a device and returns updated state

### Step 2: Verify Real-Time WebSocket

Open your browser console on any page and run:

```js
const io = await import("https://cdn.socket.io/4.7.5/socket.io.esm.min.js");
const socket = io.io("http://localhost:4000");
socket.on("devices:update", d => console.log("Devices:", d.length));
socket.on("power:update", p => console.log("Power:", p.total, "W"));
socket.on("alert:new", a => console.log("ALERT:", a.message));
```

**What to check:**
- [ ] `devices:update` fires every ~5 seconds with 15 devices
- [ ] `power:update` fires alongside with current totals
- [ ] Device states change over time (simulator randomness)

### Step 3: Verify Discord Bot

1. **Start backend first** (bot depends on it)
2. **Run deploy script:** `npm run deploy` in `/bot` — should say "Registered 3 commands"
3. **Start bot:** `npm run dev` in `/bot`
4. **In your Discord server, test:**

| Command | What to verify |
|---|---|
| `/status` | Shows all 3 rooms with device counts, has a rich embed |
| `/room` | Autocomplete shows 3 room options, selecting one shows detailed device status |
| `/usage` | Shows total watts, today's kWh, estimated cost in ৳ |

**What to check:**
- [ ] Bot shows as online in your server
- [ ] All 3 slash commands appear in the command picker
- [ ] Responses are conversational (Gemini) or well-formatted (fallback)
- [ ] Data matches what the API returns (run `/status` and `curl /api/devices` simultaneously)
- [ ] Room autocomplete works for `/room` command

### Step 4: Verify Alerts

**Trigger an alert manually:**

```bash
# Force all devices ON with 3-hour-old timestamps
curl -X POST http://localhost:4000/api/simulate/after-hours -H "Content-Type: application/json"
```

**What to check:**
- [ ] Next tick (within 5 seconds), an `alert:new` event fires
- [ ] If `ALERT_CHANNEL_ID` is set, the bot posts an embed to that Discord channel
- [ ] Alert appears in `/api/alerts` endpoint
- [ ] Dashboard shows the alert in the Alerts Panel (if frontend is running)
- [ ] Same alert doesn't fire again for 30 minutes (cooldown)

### Step 5: Verify Data Consistency

The **critical requirement** is that dashboard and bot show the same data:

1. Open the dashboard in a browser
2. Run `/status` in Discord
3. Run `curl http://localhost:4000/api/devices` in terminal
4. **All three should show the same device states at the same moment**

### Step 6: Verify SQLite Persistence

After running the backend for a minute:

```bash
# Check the database file exists
ls backend/office_iot.db

# Optionally inspect with sqlite3 (if installed)
sqlite3 backend/office_iot.db "SELECT COUNT(*) FROM device_history;"
sqlite3 backend/office_iot.db "SELECT COUNT(*) FROM energy_log;"
sqlite3 backend/office_iot.db "SELECT * FROM device_history ORDER BY timestamp DESC LIMIT 5;"
```

---

## 📁 Project Structure

```
office-iot-dashboard/
├── docs/
│   ├── API.md                  # Full API documentation
│   ├── system-diagram.png      # Architecture diagram
│   ├── circuit-schematic.png   # Wokwi circuit screenshot
│   └── wokwi-link.md          # Link to Wokwi simulation
├── backend/
│   ├── src/
│   │   ├── api.js              # Express server + REST routes + tick loop
│   │   ├── simulator.js        # Device simulator engine (15 devices)
│   │   ├── db.js               # SQLite layer (history, energy, alerts)
│   │   ├── alerts.js           # Alert engine (after-hours, prolonged-use)
│   │   └── socket.js           # Socket.IO event emitter
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── FloorPlan.jsx
│   │   │   ├── DevicePanel.jsx
│   │   │   ├── PowerMeter.jsx
│   │   │   └── AlertsPanel.jsx
│   │   └── App.jsx
│   └── package.json
├── bot/
│   ├── src/
│   │   ├── bot.js              # Discord client + command router + alert listener
│   │   ├── gemini.js           # Gemini API integration for humanized responses
│   │   ├── deploy-commands.js  # Slash command registration script
│   │   └── commands/
│   │       ├── status.js       # /status — all device status
│   │       ├── room.js         # /room — specific room details
│   │       └── usage.js        # /usage — power + cost report
│   ├── .env.example
│   └── package.json
├── docker-compose.yml
└── README.md
```

---

## 🔧 Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Backend | Node.js + Express | REST API server |
| Real-time | Socket.IO | WebSocket push to dashboard |
| Database | SQLite (better-sqlite3) | Device history + kWh tracking |
| Frontend | React (Vite) | Web dashboard |
| Discord Bot | discord.js v14 | Slash commands + proactive alerts |
| AI | Google Gemini API | Conversational bot responses |
| Containerization | Docker Compose | One-command setup |

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `4000` | Server port |

### Bot (`bot/.env`)
| Variable | Required | Description |
|---|---|---|
| `DISCORD_TOKEN` | ✅ | Bot token from Discord Developer Portal |
| `DISCORD_CLIENT_ID` | ✅ | Application ID from Developer Portal |
| `DISCORD_GUILD_ID` | No | Guild ID for dev (instant command deploy) |
| `BACKEND_URL` | ✅ | Backend server URL (default: `http://localhost:4000`) |
| `GEMINI_API_KEY` | ✅ | Google Gemini API key |
| `ALERT_CHANNEL_ID` | No | Channel ID for proactive alert notifications |

---

## 📜 License

ISC
