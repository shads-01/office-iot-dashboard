/**
 * Office IoT Dashboard — Backend API Server
 * ============================================
 * Central server that wires together:
 * - Device simulator (generates live device state)
 * - SQLite database (persists history for kWh + alerts)
 * - REST API (consumed by dashboard + Discord bot)
 * - Socket.IO (real-time push to dashboard clients)
 * - Alert engine (detects after-hours / prolonged-use anomalies)
 *
 * Single source of truth for both web dashboard and Discord bot.
 */

require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");

const {
  initializeDevices,
  tick,
  calculatePower,
  forceAfterHoursScenario,
  getDevicesByRoom,
  getDeviceById,
  toggleDevice,
  ROOMS,
  TICK_INTERVAL_MS,
} = require("./simulator");

const {
  initDB,
  logDeviceChanges,
  logEnergySnapshot,
  getTodayKwh,
  getEnergyHistory,
  logAlert,
  getRecentAlerts,
  getDeviceHistory,
  cleanup,
  closeDB,
} = require("./db");

const { checkAlerts, clearCooldowns } = require("./alerts");

const {
  initSocket,
  emitDevicesUpdate,
  emitPowerUpdate,
  emitNewAlert,
  getConnectedClients,
} = require("./socket");

// ─── Initialize ─────────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

// Initialize subsystems
initDB();
const io = initSocket(server);
let devices = initializeDevices();

// In-memory alert store (recent alerts, also backed by SQLite)
let recentAlerts = [];

// Electricity cost rate imported from config
const { ELECTRICITY_RATE_BDT } = require("./config");

console.log(`[Server] Initialized ${devices.length} devices across ${ROOMS.length} rooms`);

// ─── Simulator Tick Loop ────────────────────────────────────────────
let tickInterval = setInterval(() => {
  // 1. Run simulator tick
  const { changes } = tick(devices);

  // 2. Calculate current power
  const power = calculatePower(devices);

  // 3. Log to database
  if (changes.length > 0) {
    logDeviceChanges(devices, changes);
  }
  logEnergySnapshot(power.total);

  // 4. Check for alerts
  const newAlerts = checkAlerts(devices);
  if (newAlerts.length > 0) {
    newAlerts.forEach((alert) => {
      logAlert(alert);
      recentAlerts.unshift(alert);
      emitNewAlert(alert);
    });
    // Keep only last 100 alerts in memory
    if (recentAlerts.length > 100) {
      recentAlerts = recentAlerts.slice(0, 100);
    }
  }

  // 5. Broadcast updates to all connected dashboard clients
  emitDevicesUpdate(devices);
  emitPowerUpdate({
    ...power,
    kwh: getTodayKwh(TICK_INTERVAL_MS),
    estimatedCost: Math.round(getTodayKwh(TICK_INTERVAL_MS) * ELECTRICITY_RATE_BDT * 100) / 100,
    currency: "BDT",
    connectedClients: getConnectedClients(),
    timestamp: new Date().toISOString(),
  });
}, TICK_INTERVAL_MS);

// ─── REST API Endpoints ─────────────────────────────────────────────

/**
 * GET /api/health
 * Health check endpoint.
 */
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    uptime: process.uptime(),
    deviceCount: devices.length,
    connectedClients: getConnectedClients(),
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/devices
 * Returns all 15 devices with their current state.
 */
app.get("/api/devices", (req, res) => {
  res.json({
    devices,
    count: devices.length,
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/rooms
 * Returns list of all rooms with metadata.
 */
app.get("/api/rooms", (req, res) => {
  const roomData = ROOMS.map((room) => {
    const roomDevices = getDevicesByRoom(devices, room.id);
    const onDevices = roomDevices.filter((d) => d.status === "on");
    const totalWatts = onDevices.reduce((sum, d) => sum + d.wattage, 0);

    return {
      ...room,
      deviceCount: roomDevices.length,
      onCount: onDevices.length,
      totalWatts,
    };
  });

  res.json({ rooms: roomData });
});

/**
 * GET /api/rooms/:roomId
 * Returns devices for a specific room.
 * Valid roomIds: drawingroom, workroom1, workroom2
 */
app.get("/api/rooms/:roomId", (req, res) => {
  const { roomId } = req.params;
  const roomDevices = getDevicesByRoom(devices, roomId);

  if (roomDevices.length === 0) {
    return res.status(404).json({
      error: "Room not found",
      validRooms: ROOMS.map((r) => r.id),
    });
  }

  const onDevices = roomDevices.filter((d) => d.status === "on");
  const totalWatts = onDevices.reduce((sum, d) => sum + d.wattage, 0);
  const room = ROOMS.find((r) => r.id === roomId);

  res.json({
    room: room.name,
    roomId,
    description: room.description,
    devices: roomDevices,
    summary: {
      total: roomDevices.length,
      on: onDevices.length,
      off: roomDevices.length - onDevices.length,
      watts: totalWatts,
      fans: {
        on: roomDevices.filter((d) => d.type === "fan" && d.status === "on").length,
        total: roomDevices.filter((d) => d.type === "fan").length,
      },
      lights: {
        on: roomDevices.filter((d) => d.type === "light" && d.status === "on").length,
        total: roomDevices.filter((d) => d.type === "light").length,
      },
    },
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/power/current
 * Returns current total power draw + per-room breakdown.
 */
app.get("/api/power/current", (req, res) => {
  const power = calculatePower(devices);

  res.json({
    total: power.total,
    unit: "W",
    byRoom: power.byRoom,
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/power/today
 * Returns today's estimated energy usage in kWh and cost.
 */
app.get("/api/power/today", (req, res) => {
  const kwh = getTodayKwh(TICK_INTERVAL_MS);
  const estimatedCost = Math.round(kwh * ELECTRICITY_RATE_BDT * 100) / 100;
  const power = calculatePower(devices);

  res.json({
    kwh,
    estimatedCost,
    currency: "BDT",
    currentWatts: power.total,
    rate: ELECTRICITY_RATE_BDT,
    unit: "BDT/kWh",
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/power/history
 * Returns energy consumption history for charting.
 * Query param: hours (default 1)
 */
app.get("/api/power/history", (req, res) => {
  const hours = parseInt(req.query.hours) || 1;
  const history = getEnergyHistory(hours);

  res.json({
    history,
    hours,
    count: history.length,
  });
});

/**
 * GET /api/alerts
 * Returns active and recent alerts.
 * Query param: hours (default 24)
 */
app.get("/api/alerts", (req, res) => {
  const hours = parseInt(req.query.hours) || 24;
  const dbAlerts = getRecentAlerts(hours);

  // Merge in-memory (newest) with DB (historical), dedupe by ID
  const seen = new Set();
  const merged = [];

  for (const alert of [...recentAlerts, ...dbAlerts]) {
    const type = alert.alert_type || alert.type;
    const key = `${type}:${alert.room || "all"}:${alert.timestamp}`;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push({
        id: alert.id,
        type: alert.alert_type || alert.type,
        severity: alert.severity,
        message: alert.message,
        room: alert.room,
        devices: alert.devices || [],
        timestamp: alert.timestamp,
      });
    }
  }

  // Sort by timestamp descending
  merged.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  res.json({
    alerts: merged.slice(0, 50),
    count: merged.length,
    timestamp: new Date().toISOString(),
  });
});

/**
 * POST /api/devices/:id/toggle
 * Manually toggle a device's state (admin override).
 */
app.post("/api/devices/:id/toggle", (req, res) => {
  const { id } = req.params;
  const device = toggleDevice(devices, id);

  if (!device) {
    return res.status(404).json({
      error: "Device not found",
      validDevices: devices.map((d) => d.id),
    });
  }

  // Log the manual change
  logDeviceChanges(devices, [device.id]);

  // Broadcast update immediately
  const power = calculatePower(devices);
  emitDevicesUpdate(devices);
  emitPowerUpdate({
    ...power,
    kwh: getTodayKwh(TICK_INTERVAL_MS),
    estimatedCost: Math.round(getTodayKwh(TICK_INTERVAL_MS) * ELECTRICITY_RATE_BDT * 100) / 100,
    currency: "BDT",
    timestamp: new Date().toISOString(),
  });

  res.json({
    message: `${device.name} in ${device.roomName} toggled to ${device.status.toUpperCase()}`,
    device,
  });
});

/**
 * POST /api/simulate/after-hours
 * Demo helper: force an after-hours scenario for testing alerts.
 * Body: { roomId?: string } — if omitted, forces all rooms.
 */
app.post("/api/simulate/after-hours", (req, res) => {
  const { roomId } = req.body || {};
  forceAfterHoursScenario(devices, roomId);
  clearCooldowns(); // Reset alert cooldowns so they fire immediately

  const power = calculatePower(devices);
  emitDevicesUpdate(devices);
  emitPowerUpdate({
    ...power,
    kwh: getTodayKwh(TICK_INTERVAL_MS),
    estimatedCost: Math.round(getTodayKwh(TICK_INTERVAL_MS) * ELECTRICITY_RATE_BDT * 100) / 100,
    currency: "BDT",
    timestamp: new Date().toISOString(),
  });

  res.json({
    message: `After-hours scenario forced${roomId ? ` for ${roomId}` : " for all rooms"}. Alerts will fire on next tick.`,
    devices,
  });
});

/**
 * GET /api/devices/:id/history
 * Returns state change history for a specific device.
 */
app.get("/api/devices/:id/history", (req, res) => {
  const { id } = req.params;
  const device = getDeviceById(devices, id);

  if (!device) {
    return res.status(404).json({ error: "Device not found" });
  }

  const history = getDeviceHistory(id);

  res.json({
    device: { id: device.id, name: device.name, room: device.roomName },
    history,
    count: history.length,
  });
});

// ─── Periodic Cleanup (every 6 hours) ───────────────────────────────
setInterval(() => {
  cleanup(7);
}, 6 * 3600000);

// ─── Graceful Shutdown ──────────────────────────────────────────────
function shutdown() {
  console.log("\n[Server] Shutting down gracefully...");
  clearInterval(tickInterval);
  closeDB();
  server.close(() => {
    console.log("[Server] HTTP server closed");
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// ─── Start Server ───────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`\n╔════════════════════════════════════════════════╗`);
  console.log(`║  Office IoT Dashboard — Backend Server         ║`);
  console.log(`║  Running on http://localhost:${PORT}              ║`);
  console.log(`║  Devices: ${devices.length} | Tick: ${TICK_INTERVAL_MS / 1000}s | Rooms: ${ROOMS.length}        ║`);
  console.log(`╚════════════════════════════════════════════════╝\n`);
});

module.exports = { app, server };
