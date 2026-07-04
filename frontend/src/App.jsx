import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import './App.css';

import ThemeToggle from './components/ThemeToggle';
import StatsBar from './components/StatsBar';
import FloorPlan from './components/FloorPlan';
import DevicePanel from './components/DevicePanel';
import PowerMeter from './components/PowerMeter';
import AlertsPanel from './components/AlertsPanel';

/**
 * Backend URL — in Docker, both containers expose ports to host,
 * so the browser connects to localhost:4000.
 */
const API_BASE = 'http://localhost:4000';

/**
 * App — Main dashboard component.
 *
 * Manages Socket.IO connection and all real-time state:
 * - devices (15 IoT devices across 3 rooms)
 * - power (total watts, per-room breakdown, kWh, cost)
 * - alerts (after-hours, prolonged-use anomalies)
 */
function App() {
  const [devices, setDevices] = useState([]);
  const [power, setPower] = useState({ total: 0, byRoom: {}, kwh: 0, estimatedCost: 0, currency: 'BDT' });
  const [alerts, setAlerts] = useState([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  // ── Fetch initial state from REST API ────────────────────────
  const fetchInitialData = useCallback(async () => {
    try {
      const [devRes, powerRes, alertRes] = await Promise.all([
        fetch(`${API_BASE}/api/devices`),
        fetch(`${API_BASE}/api/power/today`),
        fetch(`${API_BASE}/api/alerts?hours=24`),
      ]);

      if (devRes.ok) {
        const data = await devRes.json();
        setDevices(data.devices || []);
      }

      if (powerRes.ok) {
        const data = await powerRes.json();
        // Also fetch current power for byRoom
        const currentRes = await fetch(`${API_BASE}/api/power/current`);
        const currentData = currentRes.ok ? await currentRes.json() : {};
        setPower(prev => ({
          ...prev,
          total: currentData.total ?? data.currentWatts ?? 0,
          byRoom: currentData.byRoom ?? {},
          kwh: data.kwh ?? 0,
          estimatedCost: data.estimatedCost ?? 0,
          currency: data.currency ?? 'BDT',
        }));
      }

      if (alertRes.ok) {
        const data = await alertRes.json();
        setAlerts(data.alerts || []);
      }
    } catch (err) {
      console.error('[Dashboard] Failed to fetch initial data:', err);
    }
  }, []);

  // ── Socket.IO connection ─────────────────────────────────────
  useEffect(() => {
    fetchInitialData();

    const socket = io(API_BASE, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: Infinity,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket.IO] Connected:', socket.id);
      setConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket.IO] Disconnected:', reason);
      setConnected(false);
    });

    // Real-time device updates (every 5s tick)
    socket.on('devices:update', (data) => {
      setDevices(data);
    });

    // Real-time power updates
    socket.on('power:update', (data) => {
      setPower({
        total: data.total ?? 0,
        byRoom: data.byRoom ?? {},
        kwh: data.kwh ?? 0,
        estimatedCost: data.estimatedCost ?? 0,
        currency: data.currency ?? 'BDT',
      });
    });

    // New alerts (push)
    socket.on('alert:new', (alert) => {
      setAlerts(prev => {
        const updated = [alert, ...prev];
        // Keep at most 50 alerts in UI
        return updated.slice(0, 50);
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchInitialData]);

  // ── Toggle device handler ────────────────────────────────────
  const handleToggle = useCallback(async (deviceId) => {
    try {
      const res = await fetch(`${API_BASE}/api/devices/${deviceId}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        // Optimistic update — the socket will also push the real state
        setDevices(prev =>
          prev.map(d =>
            d.id === deviceId
              ? { ...d, status: data.device.status, wattage: data.device.wattage, lastChanged: data.device.lastChanged }
              : d
          )
        );
      }
    } catch (err) {
      console.error('[Dashboard] Failed to toggle device:', err);
    }
  }, []);

  return (
    <div className="dashboard" id="dashboard">
      {/* ── Header ──────────────────────────────────────── */}
      <header className="header" id="header">
        <div className="header-left">
          <div className="header-logo">🏢</div>
          <div>
            <div className="header-title">Office IoT Dashboard</div>
            <div className="header-subtitle">Real-Time Monitoring</div>
          </div>
        </div>
        <div className="header-right">
          <div className={`connection-badge ${connected ? 'connected' : 'disconnected'}`}>
            <span className="connection-dot" />
            <span>{connected ? 'Live' : 'Offline'}</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* ── Stats Summary ───────────────────────────────── */}
      <StatsBar devices={devices} power={power} alerts={alerts} />

      {/* ── Main Content: Floor Plan + Device Panel ─────── */}
      <div className="main-grid">
        <FloorPlan devices={devices} onToggle={handleToggle} />
        <DevicePanel devices={devices} onToggle={handleToggle} />
      </div>

      {/* ── Bottom: Power Meter + Alerts ────────────────── */}
      <div className="bottom-grid">
        <PowerMeter power={power} />
        <AlertsPanel alerts={alerts} />
      </div>
    </div>
  );
}

export default App;
