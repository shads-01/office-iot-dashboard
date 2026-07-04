/**
 * Alert Engine
 * =============
 * Monitors device states and fires alerts for anomalous conditions:
 * 1. After-hours: devices left ON outside 9 AM – 5 PM
 * 2. Prolonged use: all devices in a room ON for 2+ hours continuously
 *
 * Includes a deduplication cache to prevent alert spam — the same alert
 * type+room combination won't re-fire within a 30-minute cooldown window.
 */

/** Cooldown period in ms before the same alert can fire again */
const ALERT_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes

/** Office hours: 9 AM to 5 PM */
const OFFICE_START_HOUR = 9;
const OFFICE_END_HOUR = 17;

/** Prolonged use threshold in milliseconds (2 hours) */
const PROLONGED_USE_THRESHOLD_MS = 2 * 60 * 60 * 1000;

/**
 * In-memory cache to track when each alert type was last fired.
 * Key format: "alertType:roomId" → timestamp of last fire
 */
const lastAlerted = new Map();

/**
 * Check if an alert is in cooldown (was recently fired).
 */
function isInCooldown(alertKey) {
  const lastTime = lastAlerted.get(alertKey);
  if (!lastTime) return false;
  return Date.now() - lastTime < ALERT_COOLDOWN_MS;
}

/**
 * Mark an alert as fired (start cooldown).
 */
function markAlertFired(alertKey) {
  lastAlerted.set(alertKey, Date.now());
}

/**
 * Generate a unique ID for an alert.
 */
let alertCounter = 0;
function generateAlertId() {
  return `alert-${Date.now()}-${++alertCounter}`;
}

/**
 * Check all alert conditions against current device state.
 * Returns an array of new alert objects (empty if nothing fires).
 */
function checkAlerts(devices) {
  const alerts = [];
  const now = new Date();
  const hour = now.getHours();
  const isAfterHours = hour < OFFICE_START_HOUR || hour >= OFFICE_END_HOUR;

  // ─── Rule 1: After-hours devices still ON ───────────────────────
  if (isAfterHours) {
    // Check per room for more granular alerts
    const rooms = [...new Set(devices.map((d) => d.room))];

    for (const room of rooms) {
      const roomDevices = devices.filter((d) => d.room === room);
      const onDevices = roomDevices.filter((d) => d.status === "on");

      if (onDevices.length > 0) {
        const alertKey = `after-hours:${room}`;

        if (!isInCooldown(alertKey)) {
          const roomName = onDevices[0].roomName || room;
          const fanCount = onDevices.filter((d) => d.type === "fan").length;
          const lightCount = onDevices.filter((d) => d.type === "light").length;

          const parts = [];
          if (fanCount > 0) parts.push(`${fanCount} fan${fanCount > 1 ? "s" : ""}`);
          if (lightCount > 0) parts.push(`${lightCount} light${lightCount > 1 ? "s" : ""}`);

          alerts.push({
            id: generateAlertId(),
            type: "after-hours",
            severity: "warning",
            room: room,
            roomName: roomName,
            message: `⚠️ ${roomName} still has ${parts.join(" and ")} ON and it's ${now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}. Did someone forget to leave?`,
            devices: onDevices.map((d) => d.id),
            deviceDetails: onDevices.map((d) => ({ id: d.id, name: d.name, type: d.type })),
            timestamp: now.toISOString(),
          });

          markAlertFired(alertKey);
        }
      }
    }
  }

  // ─── Rule 2: Prolonged use — all devices in a room ON for 2+ hours ──
  const rooms = [...new Set(devices.map((d) => d.room))];

  for (const room of rooms) {
    const roomDevices = devices.filter((d) => d.room === room);
    const allOn = roomDevices.every((d) => d.status === "on");

    if (allOn) {
      const allOnForLong = roomDevices.every((d) => {
        const lastChanged = new Date(d.lastChanged).getTime();
        return Date.now() - lastChanged > PROLONGED_USE_THRESHOLD_MS;
      });

      if (allOnForLong) {
        const alertKey = `prolonged-use:${room}`;

        if (!isInCooldown(alertKey)) {
          const roomName = roomDevices[0].roomName || room;
          const totalWatts = roomDevices.reduce((sum, d) => sum + d.wattage, 0);

          alerts.push({
            id: generateAlertId(),
            type: "prolonged-use",
            severity: "danger",
            room: room,
            roomName: roomName,
            message: `🔴 ${roomName} has had ALL devices (${roomDevices.length}) running for over 2 hours straight, drawing ${totalWatts}W. That's unusual — worth checking!`,
            devices: roomDevices.map((d) => d.id),
            deviceDetails: roomDevices.map((d) => ({ id: d.id, name: d.name, type: d.type })),
            timestamp: now.toISOString(),
          });

          markAlertFired(alertKey);
        }
      }
    }
  }

  return alerts;
}

/**
 * Get the current alert cooldown status (for debugging/admin).
 */
function getCooldownStatus() {
  const status = {};
  for (const [key, time] of lastAlerted) {
    const remaining = ALERT_COOLDOWN_MS - (Date.now() - time);
    status[key] = {
      lastFired: new Date(time).toISOString(),
      cooldownRemaining: remaining > 0 ? `${Math.round(remaining / 1000)}s` : "expired",
      inCooldown: remaining > 0,
    };
  }
  return status;
}

/**
 * Clear all cooldowns (useful for demo/testing).
 */
function clearCooldowns() {
  lastAlerted.clear();
}

module.exports = {
  checkAlerts,
  getCooldownStatus,
  clearCooldowns,
  OFFICE_START_HOUR,
  OFFICE_END_HOUR,
};
