/**
 * Office IoT Dashboard — App Shell
 * ==================================
 * Main application component that orchestrates the entire dashboard.
 * Connects to the backend via Socket.IO for real-time updates and
 * renders the device panel, floor plan, power meter, and alerts.
 */

import './App.css';
import useSocket from './hooks/useSocket';
import DevicePanel from './components/DevicePanel';
import FloorPlan from './components/FloorPlan';
import PowerMeter from './components/PowerMeter';
import AlertsPanel from './components/AlertsPanel';

function App() {
  const {
    connected,
    devices,
    power,
    alerts,
    toggleDevice,
    triggerAfterHours,
  } = useSocket();

  // Total watts for the header
  const totalWatts = power?.total ?? 0;

  // Loading state — show spinner until first data arrives
  if (devices.length === 0) {
    return (
      <div className="loading-state">
        <div className="loading-spinner" />
        <div className="loading-text">Connecting to office sensors...</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
          Make sure the backend is running on port 4000
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* ─── Header ────────────────────────────────────────── */}
      <header className="header">
        <div className="header-left">
          <div className="header-logo">🏢</div>
          <div>
            <div className="header-title">Office IoT Dashboard</div>
            <div className="header-subtitle">Real-time monitoring · 3 rooms · 15 devices</div>
          </div>
        </div>

        <div className="header-right">
          {/* Demo: Force after-hours scenario */}
          <button
            className="demo-trigger-btn"
            onClick={() => triggerAfterHours()}
            title="Force all devices ON with old timestamps to trigger alerts"
          >
            ⚡ Trigger Demo Alert
          </button>

          {/* Connection indicator */}
          <div className="connection-status">
            <div className={`status-dot ${connected ? 'connected' : ''}`} />
            <span>{connected ? 'Live' : 'Reconnecting...'}</span>
          </div>

          {/* Total power in header */}
          <div className="header-power">
            <span className="header-power-value">{totalWatts}</span>
            <span className="header-power-unit">W</span>
          </div>
        </div>
      </header>

      {/* ─── Main Grid ─────────────────────────────────────── */}
      <main className="main-grid">
        {/* Left column: Device Panel */}
        <div className="column">
          <DevicePanel devices={devices} onToggle={toggleDevice} />
        </div>

        {/* Center column: Floor Plan */}
        <div className="column">
          <FloorPlan devices={devices} onToggle={toggleDevice} />
          <AlertsPanel alerts={alerts} />
        </div>

        {/* Right column: Power Meter */}
        <div className="column">
          <PowerMeter power={power} />
        </div>
      </main>

      {/* ─── Footer ────────────────────────────────────────── */}
      <footer className="dashboard-footer">
        <span>Office IoT Dashboard · Techathon Nationals</span>
        <span>Updates every 5s · Socket.IO + React</span>
      </footer>
    </div>
  );
}

export default App;
