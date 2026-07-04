/**
 * useSocket Hook
 * ===============
 * Manages the Socket.IO connection lifecycle for the dashboard.
 * Connects to the backend, listens for real-time events, and
 * provides connection status to the UI.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

export default function useSocket() {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [devices, setDevices] = useState([]);
  const [power, setPower] = useState(null);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    // Always connect to same origin — Vite proxy handles routing
    // to the actual backend. This works both in dev and Docker.
    const socket = io('', {
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: Infinity,
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
      setConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
      setConnected(false);
    });

    // Real-time device updates (every tick)
    socket.on('devices:update', (updatedDevices) => {
      setDevices(updatedDevices);
    });

    // Real-time power updates (every tick)
    socket.on('power:update', (powerData) => {
      setPower(powerData);
    });

    // New alert pushed from backend
    socket.on('alert:new', (alert) => {
      setAlerts((prev) => [alert, ...prev].slice(0, 50));
    });

    // Fetch initial data via REST
    fetchInitialData();

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchInitialData = async () => {
    try {
      const [devRes, powRes, todayRes, alertRes] = await Promise.all([
        fetch('/api/devices'),
        fetch('/api/power/current'),
        fetch('/api/power/today'),
        fetch('/api/alerts'),
      ]);

      if (devRes.ok) {
        const data = await devRes.json();
        setDevices(data.devices);
      }

      if (powRes.ok && todayRes.ok) {
        const powData = await powRes.json();
        const todayData = await todayRes.json();
        setPower({
          ...powData,
          kwh: todayData.kwh,
          estimatedCost: todayData.estimatedCost,
          currency: todayData.currency,
          rate: todayData.rate,
        });
      }

      if (alertRes.ok) {
        const alertData = await alertRes.json();
        setAlerts(alertData.alerts);
      }
    } catch (err) {
      console.error('[Socket] Failed to fetch initial data:', err);
    }
  };

  /**
   * Toggle a device via REST API.
   * Applies optimistic UI update immediately, then confirms with server.
   */
  const toggleDevice = useCallback(async (deviceId) => {
    // Optimistic update — flip the device locally for instant feedback
    setDevices((prev) =>
      prev.map((d) => {
        if (d.id !== deviceId) return d;
        const newStatus = d.status === 'on' ? 'off' : 'on';
        return {
          ...d,
          status: newStatus,
          wattage: newStatus === 'on' ? d.ratedWattage : 0,
          lastChanged: new Date().toISOString(),
        };
      })
    );

    try {
      const res = await fetch(`/api/devices/${deviceId}/toggle`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error(`Toggle failed: ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('[Toggle] Error:', err);
      // On failure, re-fetch to correct the state
      const devRes = await fetch('/api/devices');
      if (devRes.ok) {
        const data = await devRes.json();
        setDevices(data.devices);
      }
      return null;
    }
  }, []);

  /**
   * Trigger after-hours demo scenario.
   */
  const triggerAfterHours = useCallback(async (roomId) => {
    try {
      const res = await fetch('/api/simulate/after-hours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roomId ? { roomId } : {}),
      });
      if (!res.ok) throw new Error(`Simulate failed: ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('[Simulate] Error:', err);
      return null;
    }
  }, []);

  return {
    connected,
    devices,
    power,
    alerts,
    toggleDevice,
    triggerAfterHours,
  };
}

