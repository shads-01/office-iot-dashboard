/**
 * StatsBar — Top summary metrics row.
 * Shows quick-glance numbers: devices ON, total watts, kWh today, active alerts.
 */
export default function StatsBar({ devices, power, alerts }) {
  const onCount = devices.filter(d => d.status === 'on').length;
  const totalDevices = devices.length;
  const totalWatts = power?.total ?? 0;
  const kwh = power?.kwh ?? 0;
  const alertCount = alerts.length;

  return (
    <div className="stats-bar" id="stats-bar">
      <div className="stat-card">
        <div className="stat-icon devices">⚡</div>
        <div className="stat-info">
          <div className="stat-value">{onCount}<span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-muted)' }}>/{totalDevices}</span></div>
          <div className="stat-label">Devices Online</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon power">🔌</div>
        <div className="stat-info">
          <div className="stat-value">{totalWatts}<span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-muted)' }}>W</span></div>
          <div className="stat-label">Power Draw</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon energy">📊</div>
        <div className="stat-info">
          <div className="stat-value">{kwh.toFixed(3)}<span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-muted)' }}> kWh</span></div>
          <div className="stat-label">Today's Usage</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon alerts">🔔</div>
        <div className="stat-info">
          <div className="stat-value">{alertCount}</div>
          <div className="stat-label">Active Alerts</div>
        </div>
      </div>
    </div>
  );
}
