/**
 * useDeviceData Custom Hook
 * ==========================
 * Provides centralized context state for devices, power, and alerts.
 * Subscribes to Socket.IO events at the App root and exposes optimistic manual overrides.
 * Written in pure JS (using createElement) to conform to the .js extension spec.
 */

import { createElement, createContext, useContext, useState, useEffect } from "react";
import { getSocket, api } from "../api/socketProvider";

const DeviceDataContext = createContext(null);

export const DeviceDataProvider = ({ children }) => {
  const [devices, setDevices] = useState([]);
  const [power, setPower] = useState({
    total: 0,
    byRoom: {},
    kwh: 0,
    estimatedCost: 0,
    currency: "BDT",
    timestamp: new Date().toISOString()
  });
  const [powerHistory, setPowerHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [newestAlertId, setNewestAlertId] = useState(null);

  // Fetch initial alerts and power history on load
  useEffect(() => {
    let active = true;
    
    api.getAlerts()
      .then(res => {
        if (active && res && res.alerts) {
          setAlerts(res.alerts);
        }
      })
      .catch(err => console.error("Error fetching initial alerts:", err));

    api.getPowerHistory()
      .then(res => {
        if (active && res && res.history) {
          const formatted = res.history.map(item => ({
            time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            watts: item.total
          }));
          setPowerHistory(formatted);
        }
      })
      .catch(err => console.error("Error fetching initial power history:", err));

    return () => {
      active = false;
    };
  }, []);

  // Set up socket subscription
  useEffect(() => {
    const socket = getSocket();

    const handleDevicesUpdate = (updatedDevices) => {
      setDevices(updatedDevices);
    };

    const handlePowerUpdate = (updatedPower) => {
      setPower(updatedPower);
      setPowerHistory((prev) => {
        const timeStr = new Date(updatedPower.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        // Avoid duplicate entries
        if (prev.length > 0 && prev[prev.length - 1].time === timeStr) {
          return prev;
        }

        const next = [...prev, { time: timeStr, watts: updatedPower.total }];
        if (next.length > 30) {
          next.shift();
        }
        return next;
      });
    };

    const handleNewAlert = (newAlert) => {
      setAlerts((prev) => {
        // Prevent duplicate alerts
        if (prev.some(a => a.id === newAlert.id || (a.type === newAlert.type && a.timestamp === newAlert.timestamp))) return prev;
        return [newAlert, ...prev];
      });
      // Track newest alert ID for animations
      setNewestAlertId(newAlert.id);
      // Clear highlight after 4 seconds
      setTimeout(() => {
        setNewestAlertId((currentId) => currentId === newAlert.id ? null : currentId);
      }, 4000);
    };

    socket.on("devices:update", handleDevicesUpdate);
    socket.on("power:update", handlePowerUpdate);
    socket.on("alert:new", handleNewAlert);

    return () => {
      socket.off("devices:update", handleDevicesUpdate);
      socket.off("power:update", handlePowerUpdate);
      socket.off("alert:new", handleNewAlert);
      socket.disconnect();
    };
  }, []);

  // Toggle device state manually (Optimistic override)
  const toggleDevice = async (id) => {
    let revertedDevices = null;
    let revertedPower = null;

    // 1. Optimistic update
    setDevices((prevDevices) => {
      revertedDevices = prevDevices;
      return prevDevices.map((d) => {
        if (d.id === id) {
          const nextStatus = d.status === "on" ? "off" : "on";
          return {
            ...d,
            status: nextStatus,
            wattage: nextStatus === "on" ? d.ratedWattage : 0,
            lastChanged: new Date().toISOString(),
          };
        }
        return d;
      });
    });

    // Recompute power draw optimistically
    setPower((prevPower) => {
      revertedPower = prevPower;
      
      const nextDevices = revertedDevices.map((d) => {
        if (d.id === id) {
          const nextStatus = d.status === "on" ? "off" : "on";
          return { ...d, status: nextStatus, wattage: nextStatus === "on" ? d.ratedWattage : 0 };
        }
        return d;
      });
      
      let total = 0;
      const byRoom = JSON.parse(JSON.stringify(prevPower.byRoom || {}));
      
      const roomIds = ["drawingroom", "workroom1", "workroom2"];
      roomIds.forEach(roomId => {
        if (!byRoom[roomId]) {
          byRoom[roomId] = {
            roomName: roomId === "drawingroom" ? "Drawing Room" : roomId === "workroom1" ? "Work Room 1" : "Work Room 2",
            watts: 0,
            onCount: 0,
            totalCount: 5
          };
        } else {
          byRoom[roomId].watts = 0;
          byRoom[roomId].onCount = 0;
        }
      });
      
      nextDevices.forEach(d => {
        const watts = d.status === "on" ? d.ratedWattage : 0;
        total += watts;
        if (byRoom[d.room]) {
          byRoom[d.room].watts += watts;
          if (d.status === "on") {
            byRoom[d.room].onCount++;
          }
        }
      });
      
      return {
        ...prevPower,
        total,
        byRoom,
      };
    });

    // 2. Call backend / API
    try {
      await api.toggleDevice(id);
    } catch (err) {
      console.error("Failed to toggle device:", err);
      if (revertedDevices) setDevices(revertedDevices);
      if (revertedPower) setPower(revertedPower);
    }
  };

  const triggerTimeTravel = async () => {
    try {
      await api.timeTravel();
    } catch (err) {
      console.error("Failed to trigger time travel:", err);
    }
  };

  // Use pure JavaScript createElement to avoid JSX syntax in .js file
  return createElement(
    DeviceDataContext.Provider,
    { value: { devices, power, powerHistory, alerts, newestAlertId, toggleDevice, triggerTimeTravel } },
    children
  );
};

export const useDeviceData = () => {
  const context = useContext(DeviceDataContext);
  if (!context) {
    throw new Error("useDeviceData must be used within a DeviceDataProvider");
  }
  return context;
};
