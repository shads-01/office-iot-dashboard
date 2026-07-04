/**
 * Device Simulator Engine
 * ========================
 * Generates and manages simulated state for 15 office IoT devices
 * (2 fans + 3 lights × 3 rooms). Runs a tick loop that randomly toggles
 * devices to create dynamic, realistic data for the dashboard and bot.
 */

const ROOMS = [
  { id: "drawingroom", name: "Drawing Room", description: "Waiting area" },
  { id: "workroom1", name: "Work Room 1", description: "Employees" },
  { id: "workroom2", name: "Work Room 2", description: "Employees" },
];

const DEVICE_TEMPLATES = [
  { suffix: "fan-1", name: "Fan 1", type: "fan", wattage: 60 },
  { suffix: "fan-2", name: "Fan 2", type: "fan", wattage: 60 },
  { suffix: "light-1", name: "Light 1", type: "light", wattage: 15 },
  { suffix: "light-2", name: "Light 2", type: "light", wattage: 15 },
  { suffix: "light-3", name: "Light 3", type: "light", wattage: 15 },
];

/** Wattage lookup by device type */
const WATTAGE = { fan: 60, light: 15 };

/** Toggle probability per device per tick (8%) */
const TOGGLE_CHANCE = 0.08;

/** Tick interval in milliseconds */
const TICK_INTERVAL_MS = 5000;

/**
 * Initialize all 15 devices with random starting states.
 * During office hours (9–17), ~60% of devices start ON.
 * Outside office hours, ~20% start ON (simulating forgotten devices).
 */
function initializeDevices() {
  const now = new Date();
  const hour = now.getHours();
  const isOfficeHours = hour >= 9 && hour < 17;
  const onProbability = isOfficeHours ? 0.6 : 0.2;

  const devices = [];

  for (const room of ROOMS) {
    for (const template of DEVICE_TEMPLATES) {
      const isOn = Math.random() < onProbability;
      devices.push({
        id: `${room.id}-${template.suffix}`,
        name: template.name,
        type: template.type,
        room: room.id,
        roomName: room.name,
        status: isOn ? "on" : "off",
        wattage: isOn ? template.wattage : 0,
        ratedWattage: template.wattage,
        lastChanged: new Date(
          Date.now() - Math.floor(Math.random() * 3600000)
        ).toISOString(),
      });
    }
  }

  return devices;
}

/**
 * Run one simulation tick — randomly toggles a subset of devices.
 * Returns an object with { devices, changes } where changes is an
 * array of device IDs that changed state this tick.
 */
function tick(devices) {
  const changes = [];

  devices.forEach((device) => {
    if (Math.random() < TOGGLE_CHANCE) {
      device.status = device.status === "on" ? "off" : "on";
      device.wattage = device.status === "on" ? device.ratedWattage : 0;
      device.lastChanged = new Date().toISOString();
      changes.push(device.id);
    }
  });

  return { devices, changes };
}

/**
 * Calculate total power draw across all devices.
 * Returns { total, byRoom: { roomId: watts, ... } }
 */
function calculatePower(devices) {
  const byRoom = {};

  for (const room of ROOMS) {
    byRoom[room.id] = {
      roomName: room.name,
      watts: 0,
      onCount: 0,
      totalCount: 0,
    };
  }

  let total = 0;

  devices.forEach((device) => {
    const watts = device.status === "on" ? device.ratedWattage : 0;
    total += watts;
    if (byRoom[device.room]) {
      byRoom[device.room].watts += watts;
      byRoom[device.room].totalCount++;
      if (device.status === "on") {
        byRoom[device.room].onCount++;
      }
    }
  });

  return { total, byRoom };
}

/**
 * Demo helper: force an after-hours "forgot to turn off" scenario
 * in a specific room (or all rooms if no roomId given).
 * Sets all devices ON with lastChanged set to 3 hours ago.
 */
function forceAfterHoursScenario(devices, roomId) {
  const threeHoursAgo = new Date(Date.now() - 3 * 3600000).toISOString();
  const targets = roomId
    ? devices.filter((d) => d.room === roomId)
    : devices;

  targets.forEach((d) => {
    d.status = "on";
    d.wattage = d.ratedWattage;
    d.lastChanged = threeHoursAgo;
  });

  return devices;
}

/**
 * Get devices filtered by room ID.
 */
function getDevicesByRoom(devices, roomId) {
  return devices.filter((d) => d.room === roomId);
}

/**
 * Get a single device by ID.
 */
// eslint-disable-next-line no-unused-vars
function getDeviceById(devices, deviceId) {
  return devices.find((d) => d.id === deviceId);
}

/**
 * Toggle a specific device by ID.
 * Returns the updated device or null if not found.
 */
function toggleDevice(devices, deviceId) {
  const device = devices.find((d) => d.id === deviceId);
  if (!device) return null;

  device.status = device.status === "on" ? "off" : "on";
  device.wattage = device.status === "on" ? device.ratedWattage : 0;
  device.lastChanged = new Date().toISOString();

  return device;
}

module.exports = {
  ROOMS,
  WATTAGE,
  TICK_INTERVAL_MS,
  initializeDevices,
  tick,
  calculatePower,
  forceAfterHoursScenario,
  getDevicesByRoom,
  getDeviceById,
  toggleDevice,
};
