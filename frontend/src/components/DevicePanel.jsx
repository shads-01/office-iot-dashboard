/**
 * DevicePanel Component
 * ======================
 * Displays all 15 devices organized by room with tabbed navigation.
 * Each device shows its type, status, wattage, and time since last change.
 * Clicking a device toggles its on/off state via the backend API.
 */

import { useState, useMemo } from 'react';

const ROOMS = [
  { id: 'drawingroom', name: 'Drawing Room', short: 'Drawing' },
  { id: 'workroom1', name: 'Work Room 1', short: 'Work 1' },
  { id: 'workroom2', name: 'Work Room 2', short: 'Work 2' },
];

/**
 * Convert a timestamp to a relative "time ago" string.
 */
function timeAgo(timestamp) {
  if (!timestamp) return '';
  const diff = Date.now() - new Date(timestamp).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function DevicePanel({ devices, onToggle }) {
  const [activeRoom, setActiveRoom] = useState('drawingroom');

  const roomDevices = useMemo(() => {
    return devices.filter((d) => d.room === activeRoom);
  }, [devices, activeRoom]);

  const roomStats = useMemo(() => {
    const on = roomDevices.filter((d) => d.status === 'on');
    const totalWatts = on.reduce((sum, d) => sum + d.wattage, 0);
    return { onCount: on.length, total: roomDevices.length, watts: totalWatts };
  }, [roomDevices]);

  return (
    <div className="card device-panel">
      <div className="card-header">
        <h2>📡 Devices</h2>
        <span className="badge badge-cyan">{devices.filter((d) => d.status === 'on').length} ON</span>
      </div>

      {/* Room tabs */}
      <div className="room-tabs">
        {ROOMS.map((room) => {
          const count = devices.filter((d) => d.room === room.id && d.status === 'on').length;
          return (
            <button
              key={room.id}
              className={`room-tab ${activeRoom === room.id ? 'active' : ''}`}
              onClick={() => setActiveRoom(room.id)}
            >
              {room.short} {count > 0 && <span>({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Device list */}
      <div className="devices-grid">
        {roomDevices.map((device, i) => (
          <div
            key={device.id}
            className={`device-card ${device.status}`}
            onClick={() => onToggle(device.id)}
            style={{ animationDelay: `${i * 50}ms` }}
            title={`Click to toggle ${device.name}`}
          >
            <div className={`device-icon ${device.type} ${device.status}`}>
              {device.type === 'fan' ? (
                <span className={`fan-blade ${device.status === 'on' ? 'on' : ''}`}>🌀</span>
              ) : (
                <span>{device.status === 'on' ? '💡' : '○'}</span>
              )}
            </div>

            <div className="device-info">
              <div className="device-name">{device.name}</div>
              <div className="device-meta">
                {device.type === 'fan' ? 'Ceiling Fan' : 'LED Light'} · {timeAgo(device.lastChanged)}
              </div>
            </div>

            <div className="device-status">
              <span className={`device-status-badge ${device.status}`}>
                {device.status}
              </span>
              <span className="device-wattage">
                {device.status === 'on' ? `${device.ratedWattage}W` : '0W'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Room summary */}
      <div className="room-summary">
        <span className="room-summary-label">
          {ROOMS.find((r) => r.id === activeRoom)?.name} · {roomStats.onCount}/{roomStats.total} active
        </span>
        <span className="room-summary-value">{roomStats.watts}W</span>
      </div>
    </div>
  );
}
