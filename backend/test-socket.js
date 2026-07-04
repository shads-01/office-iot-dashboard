/**
 * Quick Socket.IO test script — run from terminal:
 *   node test-socket.js
 *
 * Connects to the backend and logs real-time events for 30 seconds.
 */

const { io } = require("socket.io-client");

const socket = io("http://localhost:4000");

socket.on("connect", () => {
  console.log("✅ Connected to backend (id:", socket.id + ")");
});

socket.on("devices:update", (devices) => {
  const onCount = devices.filter((d) => d.status === "on").length;
  console.log(
    `📡 Devices update: ${devices.length} devices, ${onCount} ON, ${devices.length - onCount} OFF`
  );
});

socket.on("power:update", (power) => {
  console.log(
    `⚡ Power: ${power.total}W | kWh today: ${power.kwh} | Cost: ৳${power.estimatedCost}`
  );
});

socket.on("alert:new", (alert) => {
  console.log(`🚨 ALERT: ${alert.message}`);
});

socket.on("disconnect", (reason) => {
  console.log("❌ Disconnected:", reason);
});

// Auto-close after 30 seconds
setTimeout(() => {
  console.log("\n⏱️ 30s elapsed — closing connection.");
  socket.disconnect();
  process.exit(0);
}, 30000);

console.log("🔌 Connecting to http://localhost:4000 ...");
console.log("   Listening for events for 30 seconds. Press Ctrl+C to stop.\n");
