/**
 * Socket.IO Real-Time Event Module
 * ==================================
 * Manages WebSocket connections and broadcasts live device state,
 * power consumption, and alert events to all connected dashboard clients.
 */

const { Server } = require("socket.io");

let io;

/**
 * Initialize Socket.IO on the given HTTP server.
 * Configures CORS for development (allows all origins).
 */
function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    socket.on("disconnect", (reason) => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id} (${reason})`);
    });
  });

  console.log("[Socket.IO] Server initialized");
  return io;
}

/**
 * Broadcast device state update to all connected clients.
 * Called every simulator tick.
 */
function emitDevicesUpdate(devices) {
  if (io) {
    io.emit("devices:update", devices);
  }
}

/**
 * Broadcast power consumption update to all connected clients.
 * Called every simulator tick alongside device updates.
 */
function emitPowerUpdate(powerData) {
  if (io) {
    io.emit("power:update", powerData);
  }
}

/**
 * Broadcast a new alert to all connected clients.
 * Called only when the alert engine fires a new (non-deduplicated) alert.
 */
function emitNewAlert(alert) {
  if (io) {
    io.emit("alert:new", alert);
  }
}

/**
 * Get the Socket.IO server instance.
 */
function getIO() {
  return io;
}

/**
 * Get the number of currently connected clients.
 */
function getConnectedClients() {
  if (!io) return 0;
  return io.engine.clientsCount;
}

module.exports = {
  initSocket,
  emitDevicesUpdate,
  emitPowerUpdate,
  emitNewAlert,
  getIO,
  getConnectedClients,
};
