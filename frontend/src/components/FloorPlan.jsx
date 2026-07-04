/**
 * FloorPlan Component
 * =====================
 * Interactive SVG top-view office layout showing 3 rooms with
 * animated fans (spin when ON) and glowing lights (glow when ON).
 * Clicking a device on the floor plan toggles its state.
 *
 * Layout matches the problem set diagram:
 * ┌─────────────┬─────────────┐
 * │             │ Work Room 1 │
 * │  Drawing    ├─────────────┤
 * │  Room       │ Work Room 2 │
 * └─────────────┴─────────────┘
 *        ENTRY
 */

import { useMemo } from 'react';

/** Room layout definitions (SVG coordinates) */
const LAYOUT = {
  drawingroom: { x: 20, y: 20, w: 230, h: 260, label: 'Drawing Room', sub: 'Waiting Area' },
  workroom1:   { x: 260, y: 20, w: 220, h: 125, label: 'Work Room 1', sub: 'Employees' },
  workroom2:   { x: 260, y: 155, w: 220, h: 125, label: 'Work Room 2', sub: 'Employees' },
};

/** Device positions within each room (relative to room origin) */
const DEVICE_POSITIONS = {
  drawingroom: {
    'fan-1':   { x: 70,  y: 80 },
    'fan-2':   { x: 170, y: 180 },
    'light-1': { x: 40,  y: 50 },
    'light-2': { x: 190, y: 50 },
    'light-3': { x: 115, y: 220 },
  },
  workroom1: {
    'fan-1':   { x: 70,  y: 55 },
    'fan-2':   { x: 160, y: 55 },
    'light-1': { x: 40,  y: 25 },
    'light-2': { x: 110, y: 95 },
    'light-3': { x: 185, y: 25 },
  },
  workroom2: {
    'fan-1':   { x: 70,  y: 55 },
    'fan-2':   { x: 160, y: 55 },
    'light-1': { x: 40,  y: 25 },
    'light-2': { x: 110, y: 95 },
    'light-3': { x: 185, y: 25 },
  },
};

/** Furniture positions (tables, chairs) — decorative only */
const FURNITURE = {
  drawingroom: [
    // Sofa (horizontal rectangle)
    { type: 'rect', x: 50, y: 115, w: 60, h: 20 },
    { type: 'rect', x: 140, y: 115, w: 60, h: 20 },
    // Coffee table
    { type: 'rect', x: 85, y: 140, w: 60, h: 25 },
  ],
  workroom1: [
    // Desk row
    { type: 'rect', x: 35, y: 60, w: 70, h: 28 },
    { type: 'rect', x: 120, y: 60, w: 70, h: 28 },
  ],
  workroom2: [
    // Desk row
    { type: 'rect', x: 35, y: 60, w: 70, h: 28 },
    { type: 'rect', x: 120, y: 60, w: 70, h: 28 },
  ],
};

export default function FloorPlan({ devices, onToggle }) {
  /** Map devices by their suffix within each room for quick lookup */
  const deviceMap = useMemo(() => {
    const map = {};
    devices.forEach((d) => {
      map[d.id] = d;
    });
    return map;
  }, [devices]);

  return (
    <div className="card floor-plan">
      <div className="card-header">
        <h2>🏢 Office Layout</h2>
        <span className="badge badge-cyan">Top View</span>
      </div>

      <div className="floor-plan-svg-container">
        <svg viewBox="0 0 500 320" xmlns="http://www.w3.org/2000/svg">
          {/* Background */}
          <rect x="0" y="0" width="500" height="320" fill="#080c16" />

          {/* Grid lines (subtle) */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.015)" strokeWidth="0.5" />
            </pattern>
            {/* Light glow filter */}
            <filter id="light-glow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Fan glow filter */}
            <filter id="fan-glow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <rect x="0" y="0" width="500" height="320" fill="url(#grid)" />

          {/* Render rooms */}
          {Object.entries(LAYOUT).map(([roomId, room]) => (
            <g key={roomId} className="fp-room">
              {/* Room fill */}
              <rect
                x={room.x} y={room.y}
                width={room.w} height={room.h}
                className="fp-room-fill"
                rx="3"
              />
              {/* Room label */}
              <text
                x={room.x + room.w / 2}
                y={room.y + 16}
                className="fp-room-label"
              >
                {room.label}
              </text>
              <text
                x={room.x + room.w / 2}
                y={room.y + 27}
                className="fp-room-sub"
              >
                {room.sub}
              </text>

              {/* Furniture */}
              {FURNITURE[roomId]?.map((f, i) => (
                <rect
                  key={i}
                  x={room.x + f.x}
                  y={room.y + f.y}
                  width={f.w}
                  height={f.h}
                  rx="2"
                  className="fp-furniture"
                />
              ))}

              {/* Devices */}
              {DEVICE_POSITIONS[roomId] && Object.entries(DEVICE_POSITIONS[roomId]).map(([suffix, pos]) => {
                const deviceId = `${roomId}-${suffix}`;
                const device = deviceMap[deviceId];
                if (!device) return null;

                const absX = room.x + pos.x;
                const absY = room.y + pos.y;
                const isOn = device.status === 'on';

                if (device.type === 'fan') {
                  return (
                    <g
                      key={deviceId}
                      className="fp-device"
                      onClick={() => onToggle(deviceId)}
                    >
                      <title>{`${device.name} (${isOn ? 'ON' : 'OFF'}) — Click to toggle`}</title>
                      {/* Invisible hit area for easier clicking */}
                      <circle cx={absX} cy={absY} r="20" fill="transparent" />
                      {/* Fan housing */}
                      <circle
                        cx={absX} cy={absY} r="14"
                        className={`fp-fan-body ${isOn ? 'on' : ''}`}
                        filter={isOn ? 'url(#fan-glow)' : undefined}
                      />
                      {/* Fan blades */}
                      <g className={`fp-fan-blade ${isOn ? 'on' : ''}`} style={{ transformOrigin: `${absX}px ${absY}px` }}>
                        <line x1={absX} y1={absY - 9} x2={absX} y2={absY + 9} stroke={isOn ? '#22d3ee' : '#475569'} strokeWidth="2" strokeLinecap="round" />
                        <line x1={absX - 9} y1={absY} x2={absX + 9} y2={absY} stroke={isOn ? '#22d3ee' : '#475569'} strokeWidth="2" strokeLinecap="round" />
                        <line x1={absX - 6} y1={absY - 6} x2={absX + 6} y2={absY + 6} stroke={isOn ? '#22d3ee' : '#475569'} strokeWidth="1.5" strokeLinecap="round" />
                        <line x1={absX + 6} y1={absY - 6} x2={absX - 6} y2={absY + 6} stroke={isOn ? '#22d3ee' : '#475569'} strokeWidth="1.5" strokeLinecap="round" />
                      </g>
                      {/* Center dot */}
                      <circle cx={absX} cy={absY} r="2.5" fill={isOn ? '#22d3ee' : '#334155'} />
                    </g>
                  );
                }

                // Light
                return (
                  <g
                    key={deviceId}
                    className="fp-device"
                    onClick={() => onToggle(deviceId)}
                  >
                    <title>{`${device.name} (${isOn ? 'ON' : 'OFF'}) — Click to toggle`}</title>
                    {/* Invisible hit area for easier clicking */}
                    <circle cx={absX} cy={absY} r="20" fill="transparent" />
                    {/* Light glow area */}
                    {isOn && (
                      <circle
                        cx={absX} cy={absY} r="18"
                        fill="rgba(251, 191, 36, 0.08)"
                        className={`fp-light-rays ${isOn ? 'on' : ''}`}
                      />
                    )}
                    {/* Light body */}
                    <circle
                      cx={absX} cy={absY} r="7"
                      className={`fp-light-body ${isOn ? 'on' : ''}`}
                      filter={isOn ? 'url(#light-glow)' : undefined}
                    />
                    {/* Inner dot */}
                    <circle
                      cx={absX} cy={absY} r="2.5"
                      fill={isOn ? '#fbbf24' : '#334155'}
                    />
                  </g>
                );
              })}
            </g>
          ))}

          {/* Doors */}
          {/* Drawing Room door (bottom) */}
          <line x1="100" y1="280" x2="150" y2="280" className="fp-door" />
          {/* Work Room 1 door */}
          <line x1="260" y1="80" x2="260" y2="110" className="fp-door" />
          {/* Work Room 2 door */}
          <line x1="260" y1="200" x2="260" y2="230" className="fp-door" />

          {/* Windows */}
          {/* Drawing Room windows (left wall) */}
          <line x1="20" y1="80" x2="20" y2="130" className="fp-window" />
          <line x1="20" y1="170" x2="20" y2="220" className="fp-window" />
          {/* Work Room 1 window (top) */}
          <line x1="320" y1="20" x2="400" y2="20" className="fp-window" />
          {/* Work Room 2 window (bottom) */}
          <line x1="320" y1="280" x2="400" y2="280" className="fp-window" />

          {/* Entry label */}
          <text x="125" y="302" fill="#475569" fontSize="9" fontFamily="Inter, sans-serif" textAnchor="middle" fontWeight="500">
            ENTRY ↑
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="fp-legend">
        <div className="fp-legend-item">
          <div className="fp-legend-dot" style={{ background: 'var(--cyan)' }} />
          <span>Fan</span>
        </div>
        <div className="fp-legend-item">
          <div className="fp-legend-dot" style={{ background: 'var(--amber)' }} />
          <span>Light</span>
        </div>
        <div className="fp-legend-item">
          <div className="fp-legend-dot" style={{ background: 'var(--amber)', opacity: 0.4 }} />
          <span>Door</span>
        </div>
        <div className="fp-legend-item">
          <div className="fp-legend-dot" style={{ background: 'var(--cyan)', opacity: 0.25 }} />
          <span>Window</span>
        </div>
      </div>
    </div>
  );
}
