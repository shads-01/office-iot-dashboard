/**
 * AlertsPanel — Active alerts with timestamps.
 * Displays after-hours and prolonged-use anomaly warnings,
 * color-coded by severity.
 */
export default function AlertsPanel({ alerts }) {
  const formatTimestamp = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMin / 60);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  const getSeverityIcon = (severity, type) => {
    if (type === 'after-hours') return '⚠️';
    if (severity === 'danger') return '🔴';
    return '⚠️';
  };

  const getRoomTagStyle = (room) => {
    const colors = {
      drawingroom: { bg: 'var(--room-drawing-bg)', color: 'var(--room-drawing)' },
      workroom1: { bg: 'var(--room-work1-bg)', color: 'var(--room-work1)' },
      workroom2: { bg: 'var(--room-work2-bg)', color: 'var(--room-work2)' },
    };
    return colors[room] || { bg: 'var(--bg-elevated)', color: 'var(--text-muted)' };
  };

  const getRoomLabel = (room) => {
    const labels = {
      drawingroom: 'Drawing',
      workroom1: 'WR 1',
      workroom2: 'WR 2',
    };
    return labels[room] || room;
  };

  // Clean message: strip emoji prefixes that come from backend
  const cleanMessage = (msg) => {
    return msg.replace(/^[⚠️🔴🟡\s]+/, '').trim();
  };

  return (
    <div className="panel" id="alerts-panel">
      <div className="panel-header">
        <span className="panel-title">
          <span className="panel-title-icon">🚨</span>
          Active Alerts
        </span>
        {alerts.length > 0 && (
          <span className="panel-badge" style={{ background: 'var(--danger-bg)', color: 'var(--danger-color)' }}>
            {alerts.length}
          </span>
        )}
      </div>
      <div className="alerts-body">
        {alerts.length === 0 ? (
          <div className="alerts-empty">
            <div className="alerts-empty-icon">✅</div>
            <div className="alerts-empty-text">No active alerts — all clear!</div>
          </div>
        ) : (
          alerts.map((alert, idx) => {
            const severity = alert.severity || (alert.type === 'prolonged-use' ? 'danger' : 'warning');
            const roomTag = getRoomTagStyle(alert.room);

            return (
              <div
                className={`alert-item ${severity}`}
                key={alert.id || idx}
                id={`alert-${alert.id || idx}`}
              >
                <span className="alert-icon">
                  {getSeverityIcon(severity, alert.type)}
                </span>
                <div className="alert-content">
                  <div className="alert-message">
                    {cleanMessage(alert.message)}
                    {alert.room && (
                      <span
                        className="alert-room-tag"
                        style={{ background: roomTag.bg, color: roomTag.color }}
                      >
                        {getRoomLabel(alert.room)}
                      </span>
                    )}
                  </div>
                  <div className="alert-timestamp">
                    {formatTimestamp(alert.timestamp)}
                    {' · '}
                    {alert.type === 'after-hours' ? 'After Hours' : 'Prolonged Use'}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
