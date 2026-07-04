import { useState, useCallback } from 'react';

const ROOM_META = {
  drawingroom: { name: 'Drawing Room', color: 'var(--room-drawing)', bg: 'var(--room-drawing-bg)' },
  workroom1: { name: 'Work Room 1', color: 'var(--room-work1)', bg: 'var(--room-work1-bg)' },
  workroom2: { name: 'Work Room 2', color: 'var(--room-work2)', bg: 'var(--room-work2-bg)' },
};

/**
 * DevicePanel — Live device status organized by room.
 * Shows all 15 devices with toggle switches for manual control.
 */
export default function DevicePanel({ devices, onToggle }) {
  const [expandedRooms, setExpandedRooms] = useState({
    drawingroom: true,
    workroom1: true,
    workroom2: true,
  });

  const toggleRoom = useCallback((roomId) => {
    setExpandedRooms(prev => ({ ...prev, [roomId]: !prev[roomId] }));
  }, []);

  // Group devices by room
  const rooms = ['drawingroom', 'workroom1', 'workroom2'];
  const grouped = {};
  rooms.forEach(r => { grouped[r] = []; });
  devices.forEach(d => {
    if (grouped[d.room]) grouped[d.room].push(d);
  });

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  return (
    <div className="panel" id="device-panel">
      <div className="panel-header">
        <span className="panel-title">
          <span className="panel-title-icon">📱</span>
          Device Status
        </span>
        <span className="panel-badge" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
          {devices.filter(d => d.status === 'on').length} ON
        </span>
      </div>
      <div className="device-panel-body">
        {rooms.map(roomId => {
          const meta = ROOM_META[roomId];
          const roomDevices = grouped[roomId] || [];
          const onCount = roomDevices.filter(d => d.status === 'on').length;
          const expanded = expandedRooms[roomId];

          return (
            <div className="room-section" key={roomId} id={`room-${roomId}`}>
              <div className="room-header" onClick={() => toggleRoom(roomId)}>
                <div className="room-header-left">
                  <div className="room-color-dot" style={{ background: meta.color }} />
                  <span className="room-name">{meta.name}</span>
                  <span className="room-device-count">{onCount}/{roomDevices.length}</span>
                </div>
                <span className={`room-chevron ${expanded ? 'expanded' : ''}`}>▸</span>
              </div>

              {expanded && (
                <div className="device-list">
                  {roomDevices.map(device => (
                    <div className="device-row" key={device.id} id={`device-${device.id}`}>
                      <div className="device-info">
                        <div className={`device-type-icon ${device.type}-${device.status}`}>
                          {device.type === 'light'
                            ? (device.status === 'on' ? '💡' : '🔅')
                            : (device.status === 'on'
                              ? <span className="fan-icon-spinning">🌀</span>
                              : '🌀')
                          }
                        </div>
                        <div>
                          <div className="device-name">{device.name}</div>
                          <div className="device-meta">
                            {device.status === 'on' ? `${device.ratedWattage || device.wattage}W` : 'OFF'}
                            {' · '}
                            {formatTime(device.lastChanged)}
                          </div>
                        </div>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={device.status === 'on'}
                          onChange={() => onToggle(device.id)}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
