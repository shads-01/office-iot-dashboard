/**
 * Mock Socket Manager
 * ====================
 * Simulates Socket.IO client connection and REST endpoints.
 * Operates standalone in memory when VITE_USE_MOCK config is enabled.
 */

const ROOMS = [
  { id: "drawingroom", name: "Drawing Room", description: "Waiting area" },
  { id: "workroom1", name: "Work Room 1", description: "Employees" },
  { id: "workroom2", name: "Work Room 2", description: "Employees" },
];

const DEVICE_TEMPLATES = [
  { suffix: "fan-1", name: "Fan 1", type: "fan", ratedWattage: 60 },
  { suffix: "fan-2", name: "Fan 2", type: "fan", ratedWattage: 60 },
  { suffix: "light-1", name: "Light 1", type: "light", ratedWattage: 15 },
  { suffix: "light-2", name: "Light 2", type: "light", ratedWattage: 15 },
  { suffix: "light-3", name: "Light 3", type: "light", ratedWattage: 15 },
];

// Mirrors ELECTRICITY_RATE_BDT in backend/src/config.js — keep these two values in sync manually until mock layer is retired
const ELECTRICITY_RATE_BDT = 8.0;

class MockSocketManager {
  constructor() {
    this.listeners = {};
    this.devices = [];
    this.alerts = [];
    this.powerHistory = [];
    this.isTimeTravelActive = false;
    this.tickInterval = null;
    this.kwhCounter = 0.28; // initial starting kWh
    
    this.init();
  }

  init() {
    const now = new Date();
    const hour = now.getHours();
    const isOfficeHours = hour >= 9 && hour < 17;
    const onProbability = isOfficeHours ? 0.6 : 0.2;

    this.devices = [];
    for (const room of ROOMS) {
      for (const temp of DEVICE_TEMPLATES) {
        const isOn = Math.random() < onProbability;
        this.devices.push({
          id: `${room.id}-${temp.suffix}`,
          name: temp.name,
          type: temp.type,
          room: room.id,
          roomName: room.name,
          status: isOn ? "on" : "off",
          wattage: isOn ? temp.ratedWattage : 0,
          ratedWattage: temp.ratedWattage,
          lastChanged: new Date(Date.now() - Math.floor(Math.random() * 3600000 * 2)).toISOString(),
        });
      }
    }

    // Seed some initial power history for the line chart (last 30 readings)
    let runningKwh = 0.05;
    const nowMs = Date.now();
    for (let i = 30; i >= 0; i--) {
      const timestamp = new Date(nowMs - i * 60000 * 2).toISOString();
      const activeCount = Math.floor(Math.random() * 6) + 3; // 3-8 devices on
      const totalPower = activeCount * 15 + Math.floor(Math.random() * 3) * 60;
      
      runningKwh += (totalPower / 1000) * (2 / 60); // 2 minutes worth of power
      this.powerHistory.push({
        timestamp,
        total: totalPower,
        kwh: runningKwh,
      });
    }
    this.kwhCounter = runningKwh;

    // Start simulation tick every 2 seconds
    this.tickInterval = setInterval(() => this.tick(), 2000);
  }

  // Socket.io standard interface
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);

    // Immediately push initial data to the subscriber
    if (event === "devices:update") {
      setTimeout(() => callback([...this.devices]), 50);
    } else if (event === "power:update") {
      const power = this.calculatePower();
      setTimeout(() => callback({
        total: power.total,
        byRoom: power.byRoom,
        kwh: this.kwhCounter,
        estimatedCost: Math.round(this.kwhCounter * ELECTRICITY_RATE_BDT * 100) / 100,
        currency: "BDT",
        connectedClients: 1,
        timestamp: new Date().toISOString(),
      }), 50);
    }
  }

  off(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  disconnect() {
    // Keep it active or clean up if needed
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }

  // Simulator loop
  tick() {
    // 1. Randomly toggle 1 device with 25% chance
    if (Math.random() < 0.25) {
      const randomIndex = Math.floor(Math.random() * this.devices.length);
      const dev = this.devices[randomIndex];
      dev.status = dev.status === "on" ? "off" : "on";
      dev.wattage = dev.status === "on" ? dev.ratedWattage : 0;
      dev.lastChanged = new Date().toISOString();
      this.emit("devices:update", [...this.devices]);
    }

    // 2. Increment kWh slightly and recalculate power
    const power = this.calculatePower();
    // Increment kWh based on active draw for a 2s tick
    const tickKwh = (power.total * 2) / (1000 * 3600);
    this.kwhCounter += tickKwh;

    const powerUpdate = {
      total: power.total,
      byRoom: power.byRoom,
      kwh: this.kwhCounter,
      estimatedCost: Math.round(this.kwhCounter * ELECTRICITY_RATE_BDT * 100) / 100,
      currency: "BDT",
      connectedClients: 1,
      timestamp: new Date().toISOString(),
    };

    // Store in history
    this.powerHistory.push({
      timestamp: powerUpdate.timestamp,
      total: powerUpdate.total,
      kwh: powerUpdate.kwh,
    });
    if (this.powerHistory.length > 50) {
      this.powerHistory.shift();
    }

    this.emit("power:update", powerUpdate);

    // 3. Check for prolonged-use alerts randomly
    this.checkMockAlerts();
  }

  calculatePower() {
    const byRoom = {};
    for (const r of ROOMS) {
      byRoom[r.id] = {
        roomName: r.name,
        watts: 0,
        onCount: 0,
        totalCount: 0,
      };
    }
    let total = 0;
    this.devices.forEach(dev => {
      const watts = dev.status === "on" ? dev.ratedWattage : 0;
      total += watts;
      if (byRoom[dev.room]) {
        byRoom[dev.room].watts += watts;
        byRoom[dev.room].totalCount++;
        if (dev.status === "on") {
          byRoom[dev.room].onCount++;
        }
      }
    });
    return { total, byRoom };
  }

  checkMockAlerts() {
    // Generate prolonged use alert with 3% chance if something is ON
    if (!this.isTimeTravelActive && Math.random() < 0.03) {
      const activeDevices = this.devices.filter(d => d.status === "on");
      if (activeDevices.length > 0) {
        const randomDev = activeDevices[Math.floor(Math.random() * activeDevices.length)];
        const alert = {
          id: `alert-${Date.now()}`,
          type: "prolonged-use",
          severity: "red",
          message: `Device ${randomDev.name} in ${randomDev.roomName} has been running continuously for over 2 hours`,
          room: randomDev.room,
          devices: [randomDev.id],
          timestamp: new Date().toISOString(),
        };
        // Avoid duplicate alerts of same device in close time
        if (!this.alerts.some(a => a.devices && a.devices.includes(randomDev.id))) {
          this.alerts.unshift(alert);
          this.emit("alert:new", alert);
        }
      }
    }
  }

  // REST API simulation
  getDevices() {
    return Promise.resolve({ devices: this.devices, count: this.devices.length, timestamp: new Date().toISOString() });
  }

  getRooms() {
    const roomData = ROOMS.map(room => {
      const roomDevices = this.devices.filter(d => d.room === room.id);
      const onDevices = roomDevices.filter(d => d.status === "on");
      const totalWatts = onDevices.reduce((sum, d) => sum + d.wattage, 0);
      return {
        ...room,
        deviceCount: roomDevices.length,
        onCount: onDevices.length,
        totalWatts,
      };
    });
    return Promise.resolve({ rooms: roomData });
  }

  getRoomById(roomId) {
    const roomDevices = this.devices.filter(d => d.room === roomId);
    if (roomDevices.length === 0) {
      return Promise.reject(new Error("Room not found"));
    }
    const onDevices = roomDevices.filter(d => d.status === "on");
    const totalWatts = onDevices.reduce((sum, d) => sum + d.wattage, 0);
    const room = ROOMS.find(r => r.id === roomId);
    return Promise.resolve({
      room: room.name,
      roomId,
      description: room.description,
      devices: roomDevices,
      summary: {
        total: roomDevices.length,
        on: onDevices.length,
        off: roomDevices.length - onDevices.length,
        watts: totalWatts,
      },
      timestamp: new Date().toISOString(),
    });
  }

  getPowerCurrent() {
    const power = this.calculatePower();
    return Promise.resolve({
      total: power.total,
      unit: "W",
      byRoom: power.byRoom,
      timestamp: new Date().toISOString(),
    });
  }

  getPowerToday() {
    const power = this.calculatePower();
    return Promise.resolve({
      kwh: this.kwhCounter,
      estimatedCost: Math.round(this.kwhCounter * ELECTRICITY_RATE_BDT * 100) / 100,
      currency: "BDT",
      currentWatts: power.total,
      rate: ELECTRICITY_RATE_BDT,
      unit: "BDT/kWh",
      timestamp: new Date().toISOString(),
    });
  }

  getPowerHistory() {
    return Promise.resolve({
      history: this.powerHistory,
      hours: 1,
      count: this.powerHistory.length,
    });
  }

  getAlerts() {
    return Promise.resolve({
      alerts: this.alerts,
      count: this.alerts.length,
      timestamp: new Date().toISOString(),
    });
  }

  toggleDevice(id) {
    const dev = this.devices.find(d => d.id === id);
    if (!dev) return Promise.reject(new Error("Device not found"));

    dev.status = dev.status === "on" ? "off" : "on";
    dev.wattage = dev.status === "on" ? dev.ratedWattage : 0;
    dev.lastChanged = new Date().toISOString();

    // Trigger update pushes immediately
    this.emit("devices:update", [...this.devices]);
    
    const power = this.calculatePower();
    this.emit("power:update", {
      total: power.total,
      byRoom: power.byRoom,
      kwh: this.kwhCounter,
      estimatedCost: Math.round(this.kwhCounter * ELECTRICITY_RATE_BDT * 100) / 100,
      currency: "BDT",
      connectedClients: 1,
      timestamp: new Date().toISOString(),
    });

    return Promise.resolve({
      message: `${dev.name} toggled to ${dev.status.toUpperCase()}`,
      device: dev,
    });
  }

  // Developer scenario trigger: Time travel
  forceTimeTravel() {
    this.isTimeTravelActive = true;
    
    // Set internal clock simulations to 10:00 PM (22:00)
    // Force multiple devices ON, and backdate their lastChanged to 3 hours ago
    const threeHoursAgo = new Date(Date.now() - 3 * 3600000).toISOString();
    
    // Turn ON most lights and fans in Work Room 1 and Work Room 2
    let forcedCount = 0;
    this.devices.forEach(dev => {
      if (dev.room === "workroom1" || dev.room === "workroom2") {
        dev.status = "on";
        dev.wattage = dev.ratedWattage;
        dev.lastChanged = threeHoursAgo;
        forcedCount++;
      }
    });

    // Broadcast device update
    this.emit("devices:update", [...this.devices]);

    // Update power
    const power = this.calculatePower();
    this.emit("power:update", {
      total: power.total,
      byRoom: power.byRoom,
      kwh: this.kwhCounter,
      estimatedCost: Math.round(this.kwhCounter * ELECTRICITY_RATE_BDT * 100) / 100,
      currency: "BDT",
      connectedClients: 1,
      timestamp: new Date().toISOString(),
    });

    // Immediately generate alerts!
    // 1. After-hours alert: 22:10 (10 PM)
    const afterHoursAlert = {
      id: `alert-ah-${Date.now()}`,
      type: "after-hours",
      severity: "amber",
      message: `${forcedCount} device(s) still on after office hours (forced time travel)`,
      devices: this.devices.filter(d => d.status === "on" && d.room !== "drawingroom").map(d => d.id),
      timestamp: new Date().toISOString(),
    };

    // 2. Prolonged use alert
    const prolongedAlert = {
      id: `alert-pu-${Date.now()}`,
      type: "prolonged-use",
      severity: "red",
      message: `${forcedCount} device(s) running continuously for over 3 hours`,
      devices: this.devices.filter(d => d.status === "on" && d.room !== "drawingroom").map(d => d.id),
      timestamp: new Date().toISOString(),
    };

    this.alerts.unshift(afterHoursAlert);
    this.emit("alert:new", afterHoursAlert);

    // Wait a brief half-second to push the second one so both fire and animate
    setTimeout(() => {
      this.alerts.unshift(prolongedAlert);
      this.emit("alert:new", prolongedAlert);
    }, 500);

    return Promise.resolve({
      message: "Time travel initiated. Simulated clock set to 10 PM. Alerts triggered.",
      devices: this.devices,
    });
  }
}

export const mockSocketManager = new MockSocketManager();
