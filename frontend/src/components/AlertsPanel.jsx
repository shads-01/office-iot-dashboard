/**
 * AlertsPanel Component
 * ======================
 * Shows a scrollable feed of timestamped alerts.
 * After-hours alerts (yellow) and prolonged-use alerts (red)
 * are pushed in real-time via Socket.IO.
 */

/**
 * Convert a timestamp to a human-friendly relative time.
 */
function timeAgo(timestamp) {
  if (!timestamp) return '';
  const diff = Date.now() - new Date(timestamp).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/**
 * Format an ISO timestamp to a readable date/time string.
 */
function formatTimestamp(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export default function AlertsPanel({ alerts }) {
  const severityIcon = {
    warning: '⚠️',
    danger: '🔴',
    info: 'ℹ️',
  };

  return (
    <div className="card alerts-panel">
      <div className="card-header">
        <h2>🔔 Alerts</h2>
        {alerts.length > 0 && (
          <span className="badge badge-red">{alerts.length}</span>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="alerts-empty">
          <div className="alerts-empty-icon">✅</div>
          <p>All clear — no active alerts</p>
          <p style={{ fontSize: '0.72rem', marginTop: '4px', color: 'var(--text-dim)' }}>
            Alerts fire when devices are left on after 5 PM or all devices in a room run for 2+ hours
          </p>
        </div>
      ) : (
        <div className="alerts-list">
          {alerts.map((alert, index) => {
            const type = alert.type || alert.alert_type || 'warning';
            const severity = alert.severity || 'warning';

            return (
              <div
                key={alert.id || index}
                className={`alert-item ${severity}`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <span className="alert-icon">
                  {severityIcon[severity] || '⚠️'}
                </span>
                <div className="alert-content">
                  <div className="alert-message">
                    {cleanMessage(alert.message)}
                  </div>
                  <div className="alert-time">
                    {timeAgo(alert.timestamp)} · {formatTimestamp(alert.timestamp)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Clean up emoji that may have been garbled in transit.
 */
function cleanMessage(msg) {
  if (!msg) return 'Unknown alert';
  // Replace garbled emoji sequences with proper ones
  return msg
    .replace(/\?\?/g, '⚠️')
    .replace(/^⚠️\s*/, '')  // Remove leading emoji since we show it separately
    .replace(/^🔴\s*/, '');
}
