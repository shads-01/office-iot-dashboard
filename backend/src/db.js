/**
 * SQLite Database Layer
 * ======================
 * Provides persistent storage for device state change history
 * and energy consumption tracking. Uses better-sqlite3 for
 * synchronous, fast local storage.
 */

const Database = require("better-sqlite3");
const path = require("path");

const DB_PATH = path.join(__dirname, "..", "office_iot.db");

let db;

/**
 * Initialize the database and create tables if they don't exist.
 */
function initDB() {
  db = new Database(DB_PATH);

  // Enable WAL mode for better concurrent read performance
  db.pragma("journal_mode = WAL");

  // Device state change history — every toggle is logged here
  db.exec(`
    CREATE TABLE IF NOT EXISTS device_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT NOT NULL,
      status TEXT NOT NULL,
      wattage REAL NOT NULL,
      room TEXT NOT NULL,
      timestamp TEXT NOT NULL
    )
  `);

  // Energy snapshots — logged every tick for kWh calculation
  db.exec(`
    CREATE TABLE IF NOT EXISTS energy_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      total_watts REAL NOT NULL,
      timestamp TEXT NOT NULL
    )
  `);

  // Alerts history — for dashboard display and deduplication
  db.exec(`
    CREATE TABLE IF NOT EXISTS alerts_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      alert_type TEXT NOT NULL,
      severity TEXT NOT NULL,
      message TEXT NOT NULL,
      room TEXT,
      devices TEXT,
      timestamp TEXT NOT NULL
    )
  `);

  // Create indices for common queries
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_device_history_device ON device_history(device_id);
    CREATE INDEX IF NOT EXISTS idx_device_history_timestamp ON device_history(timestamp);
    CREATE INDEX IF NOT EXISTS idx_energy_log_timestamp ON energy_log(timestamp);
    CREATE INDEX IF NOT EXISTS idx_alerts_history_timestamp ON alerts_history(timestamp);
  `);

  console.log("[DB] SQLite database initialized at", DB_PATH);
  return db;
}

/**
 * Log a device state change to history.
 */
function logDeviceChange(device) {
  const stmt = db.prepare(`
    INSERT INTO device_history (device_id, status, wattage, room, timestamp)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(device.id, device.status, device.wattage, device.room, device.lastChanged);
}

/**
 * Log multiple device state changes in a single transaction (batch).
 */
function logDeviceChanges(devices, changedIds) {
  const stmt = db.prepare(`
    INSERT INTO device_history (device_id, status, wattage, room, timestamp)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((changedDevices) => {
    for (const device of changedDevices) {
      stmt.run(device.id, device.status, device.wattage, device.room, device.lastChanged);
    }
  });

  const changedDevices = devices.filter((d) => changedIds.includes(d.id));
  if (changedDevices.length > 0) {
    insertMany(changedDevices);
  }
}

/**
 * Log an energy snapshot (total watts at this moment).
 */
function logEnergySnapshot(totalWatts) {
  const stmt = db.prepare(`
    INSERT INTO energy_log (total_watts, timestamp)
    VALUES (?, ?)
  `);
  stmt.run(totalWatts, new Date().toISOString());
}

/**
 * Calculate today's estimated kWh usage.
 * Sums energy snapshots from midnight today, converting W → kWh
 * based on the tick interval.
 */
function getTodayKwh(tickIntervalMs) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString();

  const rows = db.prepare(`
    SELECT total_watts FROM energy_log
    WHERE timestamp >= ?
    ORDER BY timestamp ASC
  `).all(todayStr);

  if (rows.length === 0) return 0;

  // Each snapshot represents tickIntervalMs worth of energy at that wattage
  const tickIntervalHours = tickIntervalMs / (1000 * 3600);
  let totalKwh = 0;

  for (const row of rows) {
    totalKwh += (row.total_watts / 1000) * tickIntervalHours;
  }

  return Math.round(totalKwh * 1000) / 1000; // Round to 3 decimal places
}

/**
 * Get energy history for charts (last N hours).
 */
function getEnergyHistory(hours = 1) {
  const since = new Date(Date.now() - hours * 3600000).toISOString();

  return db.prepare(`
    SELECT total_watts, timestamp FROM energy_log
    WHERE timestamp >= ?
    ORDER BY timestamp ASC
  `).all(since);
}

/**
 * Log an alert to history.
 */
function logAlert(alert) {
  const stmt = db.prepare(`
    INSERT INTO alerts_history (alert_type, severity, message, room, devices, timestamp)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    alert.type,
    alert.severity,
    alert.message,
    alert.room || null,
    alert.devices ? JSON.stringify(alert.devices) : null,
    alert.timestamp
  );
}

/**
 * Get recent alerts (last N hours, default 24).
 */
function getRecentAlerts(hours = 24) {
  const since = new Date(Date.now() - hours * 3600000).toISOString();

  const rows = db.prepare(`
    SELECT * FROM alerts_history
    WHERE timestamp >= ?
    ORDER BY timestamp DESC
    LIMIT 50
  `).all(since);

  return rows.map((row) => ({
    ...row,
    devices: row.devices ? JSON.parse(row.devices) : [],
  }));
}

/**
 * Get device change history for a specific device.
 */
function getDeviceHistory(deviceId, limit = 50) {
  return db.prepare(`
    SELECT * FROM device_history
    WHERE device_id = ?
    ORDER BY timestamp DESC
    LIMIT ?
  `).all(deviceId, limit);
}

/**
 * Clean up old data (older than 7 days) to prevent unbounded DB growth.
 */
function cleanup(daysToKeep = 7) {
  const cutoff = new Date(Date.now() - daysToKeep * 86400000).toISOString();

  const result1 = db.prepare("DELETE FROM device_history WHERE timestamp < ?").run(cutoff);
  const result2 = db.prepare("DELETE FROM energy_log WHERE timestamp < ?").run(cutoff);
  const result3 = db.prepare("DELETE FROM alerts_history WHERE timestamp < ?").run(cutoff);

  console.log(
    `[DB] Cleanup: removed ${result1.changes} device_history, ${result2.changes} energy_log, ${result3.changes} alerts_history rows`
  );
}

/**
 * Close the database connection gracefully.
 */
function closeDB() {
  if (db) {
    db.close();
    console.log("[DB] Database connection closed");
  }
}

module.exports = {
  initDB,
  logDeviceChange,
  logDeviceChanges,
  logEnergySnapshot,
  getTodayKwh,
  getEnergyHistory,
  logAlert,
  getRecentAlerts,
  getDeviceHistory,
  cleanup,
  closeDB,
};
