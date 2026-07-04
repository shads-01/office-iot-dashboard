/**
 * PowerMeter Component
 * =====================
 * Displays total office power draw, per-room breakdown bars,
 * today's kWh usage, and estimated cost in BDT.
 */

const MAX_ROOM_WATTS = 165; // 2×60 + 3×15 per room
const MAX_TOTAL_WATTS = 495; // 3 rooms × 165W

export default function PowerMeter({ power }) {
  if (!power) {
    return (
      <div className="card power-meter">
        <div className="card-header">
          <h2>⚡ Power</h2>
        </div>
        <div className="loading-text" style={{ textAlign: 'center', padding: '24px 0' }}>
          Waiting for data...
        </div>
      </div>
    );
  }

  const totalWatts = power.total ?? 0;
  const kwh = power.kwh ?? 0;
  const cost = power.estimatedCost ?? 0;

  // Color based on power usage level
  const level = totalWatts / MAX_TOTAL_WATTS;
  const levelClass = level > 0.7 ? 'high' : level > 0.35 ? 'medium' : 'low';

  return (
    <div className="card power-meter">
      <div className="card-header">
        <h2>⚡ Power</h2>
        <span className={`badge ${levelClass === 'high' ? 'badge-red' : levelClass === 'medium' ? 'badge-amber' : 'badge-green'}`}>
          {Math.round(level * 100)}% capacity
        </span>
      </div>

      {/* Big total watts */}
      <div className="power-total">
        <div className={`power-total-value ${levelClass}`}>
          {totalWatts}
        </div>
        <div className="power-total-label">watts total draw</div>
      </div>

      {/* Per-room breakdown */}
      <div className="power-rooms">
        {power.byRoom && Object.entries(power.byRoom).map(([roomId, room]) => (
          <div className="power-room" key={roomId}>
            <div className="power-room-header">
              <span className="power-room-name">{room.roomName}</span>
              <span className="power-room-value">
                {room.watts}W
                <span style={{ color: 'var(--text-dim)', fontWeight: 400, fontSize: '0.72rem', marginLeft: '4px' }}>
                  ({room.onCount}/{room.totalCount})
                </span>
              </span>
            </div>
            <div className="power-bar-track">
              <div
                className="power-bar-fill"
                style={{ width: `${Math.min((room.watts / MAX_ROOM_WATTS) * 100, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Stats grid */}
      <div className="power-stats">
        <div className="power-stat">
          <div className="power-stat-value">{kwh} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>kWh</span></div>
          <div className="power-stat-label">Today's usage</div>
        </div>
        <div className="power-stat">
          <div className="power-stat-value">৳{cost}</div>
          <div className="power-stat-label">Est. cost ({power.rate ?? 8} ৳/kWh)</div>
        </div>
      </div>
    </div>
  );
}
