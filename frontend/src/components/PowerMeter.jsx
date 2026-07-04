/**
 * PowerMeter — Live power consumption display.
 * Shows a gauge arc for total wattage, per-room breakdown bars,
 * and today's energy summary (kWh + estimated cost).
 */
export default function PowerMeter({ power }) {
  const total = power?.total ?? 0;
  const byRoom = power?.byRoom ?? {};
  const kwh = power?.kwh ?? 0;
  const estimatedCost = power?.estimatedCost ?? 0;
  const currency = power?.currency ?? 'BDT';

  // Max possible watts: 15 devices × 60W (fans are 60W each, worst case)
  // Actual max: 3 rooms × (2×60 + 3×15) = 3 × 165 = 495W
  const maxWatts = 495;
  const percentage = Math.min((total / maxWatts) * 100, 100);

  // SVG arc gauge params
  const radius = 70;
  const strokeWidth = 10;
  const circumference = Math.PI * radius; // half circle
  const dashOffset = circumference - (percentage / 100) * circumference;

  // Color based on usage level
  const getGaugeColor = (pct) => {
    if (pct < 33) return 'var(--on-color)';
    if (pct < 66) return 'var(--warning-color)';
    return 'var(--danger-color)';
  };

  const roomOrder = [
    { id: 'drawingroom', name: 'Drawing Room', color: 'var(--room-drawing)' },
    { id: 'workroom1', name: 'Work Room 1', color: 'var(--room-work1)' },
    { id: 'workroom2', name: 'Work Room 2', color: 'var(--room-work2)' },
  ];

  // Find max room watts for bar scaling
  const maxRoomWatts = Math.max(
    ...roomOrder.map(r => byRoom[r.id]?.watts ?? 0),
    1
  );

  return (
    <div className="panel" id="power-meter">
      <div className="panel-header">
        <span className="panel-title">
          <span className="panel-title-icon">⚡</span>
          Power Consumption
        </span>
        <span className="panel-badge" style={{
          background: percentage > 66 ? 'var(--danger-bg)' : 'var(--on-bg)',
          color: percentage > 66 ? 'var(--danger-color)' : 'var(--on-color)',
        }}>
          LIVE
        </span>
      </div>
      <div className="power-meter-body">
        {/* Gauge */}
        <div className="power-gauge">
          <svg width="180" height="100" viewBox="0 0 180 100">
            {/* Background arc */}
            <path
              d="M 20 90 A 70 70 0 0 1 160 90"
              className="gauge-bg"
            />
            {/* Filled arc */}
            <path
              d="M 20 90 A 70 70 0 0 1 160 90"
              className="gauge-fill"
              stroke={getGaugeColor(percentage)}
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
            />
            {/* Center text */}
            <text x="90" y="72" className="gauge-text" fontSize="28">
              {total}
            </text>
            <text x="90" y="92" className="gauge-label">
              WATTS
            </text>
          </svg>
        </div>

        {/* Per-room breakdown */}
        <div className="room-power-list">
          {roomOrder.map(room => {
            const data = byRoom[room.id];
            const watts = data?.watts ?? 0;
            const onCount = data?.onCount ?? 0;
            const totalCount = data?.totalCount ?? 0;
            const barPct = maxRoomWatts > 0 ? (watts / maxRoomWatts) * 100 : 0;

            return (
              <div className="room-power-row" key={room.id}>
                <div className="room-power-header">
                  <span className="room-power-name">
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: room.color, display: 'inline-block'
                    }} />
                    {room.name}
                    <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>
                      ({onCount}/{totalCount})
                    </span>
                  </span>
                  <span className="room-power-value">{watts}W</span>
                </div>
                <div className="room-power-bar-track">
                  <div
                    className="room-power-bar-fill"
                    style={{ width: `${barPct}%`, background: room.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Energy summary */}
        <div className="energy-row">
          <span className="energy-label">Today's Energy</span>
          <span className="energy-value">{kwh.toFixed(4)} kWh</span>
        </div>
        <div className="energy-row">
          <span className="energy-label">Est. Cost</span>
          <span className="energy-value">৳{estimatedCost.toFixed(2)} {currency}</span>
        </div>
      </div>
    </div>
  );
}
