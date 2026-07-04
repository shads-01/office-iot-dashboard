/**
 * Socket and API Provider
 * =========================
 * Provides unified access to REST APIs and Socket instances.
 * Swaps between mock data and real backend server with a single VITE_USE_MOCK config flag.
 */

import { io } from "socket.io-client";
import { mockSocketManager } from "../mock/mockSocket";

// Switch this to false to connect to the real backend (Express server on port 4000)
export const USE_MOCK = true;

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

let socketInstance = null;

/**
 * Returns either the real Socket.IO instance or the mock manager.
 */
export const getSocket = () => {
  if (USE_MOCK) {
    return mockSocketManager;
  }
  
  if (!socketInstance) {
    socketInstance = io(BACKEND_URL, {
      transports: ["websocket"],
      autoConnect: true,
    });
  }
  return socketInstance;
};

/**
 * Unified REST API calls wrapper.
 */
export const api = {
  getDevices: async () => {
    if (USE_MOCK) {
      return mockSocketManager.getDevices();
    }
    const response = await fetch(`${BACKEND_URL}/api/devices`);
    if (!response.ok) throw new Error("Failed to fetch devices");
    return response.json();
  },

  getRooms: async () => {
    if (USE_MOCK) {
      return mockSocketManager.getRooms();
    }
    const response = await fetch(`${BACKEND_URL}/api/rooms`);
    if (!response.ok) throw new Error("Failed to fetch rooms");
    return response.json();
  },

  getRoomById: async (roomId) => {
    if (USE_MOCK) {
      return mockSocketManager.getRoomById(roomId);
    }
    const response = await fetch(`${BACKEND_URL}/api/rooms/${roomId}`);
    if (!response.ok) throw new Error("Failed to fetch room");
    return response.json();
  },

  getPowerCurrent: async () => {
    if (USE_MOCK) {
      return mockSocketManager.getPowerCurrent();
    }
    const response = await fetch(`${BACKEND_URL}/api/power/current`);
    if (!response.ok) throw new Error("Failed to fetch current power");
    return response.json();
  },

  getPowerToday: async () => {
    if (USE_MOCK) {
      return mockSocketManager.getPowerToday();
    }
    const response = await fetch(`${BACKEND_URL}/api/power/today`);
    if (!response.ok) throw new Error("Failed to fetch today's power usage");
    return response.json();
  },

  getPowerHistory: async () => {
    if (USE_MOCK) {
      return mockSocketManager.getPowerHistory();
    }
    const response = await fetch(`${BACKEND_URL}/api/power/history?hours=1`);
    if (!response.ok) throw new Error("Failed to fetch power history");
    return response.json();
  },

  getAlerts: async () => {
    if (USE_MOCK) {
      return mockSocketManager.getAlerts();
    }
    const response = await fetch(`${BACKEND_URL}/api/alerts`);
    if (!response.ok) throw new Error("Failed to fetch alerts");
    return response.json();
  },

  toggleDevice: async (id) => {
    if (USE_MOCK) {
      return mockSocketManager.toggleDevice(id);
    }
    const response = await fetch(`${BACKEND_URL}/api/devices/${id}/toggle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error("Failed to toggle device");
    return response.json();
  },

  timeTravel: async () => {
    if (USE_MOCK) {
      return mockSocketManager.forceTimeTravel();
    }
    const response = await fetch(`${BACKEND_URL}/api/simulate/after-hours`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error("Failed to force after-hours scenario");
    return response.json();
  }
};
