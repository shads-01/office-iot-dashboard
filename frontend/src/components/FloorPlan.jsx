/**
 * FloorPlan — Interactive SVG top-view office layout.
 *
 * Shows 3 rooms (Drawing Room, Work Room 1, Work Room 2) with
 * positioned furniture (tables, chairs) and device icons.
 * - Lights glow with animated box-shadow when ON
 * - Fans spin when ON
 * - Click any device to toggle it
 */
export default function FloorPlan({ devices, onToggle }) {
  // Group devices by room for easy lookup
  const byId = {};
  devices.forEach(d => { byId[d.id] = d; });

  const getDevice = (id) => byId[id] || { status: 'off', type: 'light', name: id };

  /**
   * Render a light bulb icon at (cx, cy).
   * Glows yellow when ON, dim when OFF.
   */
  const renderLight = (deviceId, cx, cy) => {
    const dev = getDevice(deviceId);
    const isOn = dev.status === 'on';

    return (
      <g
        key={deviceId}
        className="fp-device"
        onClick={() => onToggle(deviceId)}
        role="button"
        aria-label={`${dev.name}: ${isOn ? 'ON' : 'OFF'}. Click to toggle.`}
      >
        {/* Glow aura */}
        {isOn && (
          <circle cx={cx} cy={cy} r="14"
            fill="rgba(255, 214, 51, 0.12)"
            style={{ animation: 'pulse-glow 2.5s ease-in-out infinite' }}
          />
        )}
        {isOn && (
          <circle cx={cx} cy={cy} r="9"
            fill="rgba(255, 214, 51, 0.25)"
          />
        )}
        {/* Bulb body */}
        <circle cx={cx} cy={cy} r="6"
          className={isOn ? 'fp-light-on' : 'fp-light-off'}
        />
        {/* Filament lines when ON */}
        {isOn && (
          <>
            <line x1={cx} y1={cy - 3} x2={cx} y2={cy + 3}
              stroke="rgba(255,180,0,0.7)" strokeWidth="1" />
            <line x1={cx - 2.5} y1={cy - 1.5} x2={cx + 2.5} y2={cy + 1.5}
              stroke="rgba(255,180,0,0.5)" strokeWidth="0.8" />
          </>
        )}
        {/* Label */}
        <text x={cx} y={cy + 16} className="fp-device-label">
          {dev.name}
        </text>
      </g>
    );
  };

  /**
   * Render a ceiling fan icon at (cx, cy).
   * Blades spin when ON, static when OFF.
   */
  const renderFan = (deviceId, cx, cy) => {
    const dev = getDevice(deviceId);
    const isOn = dev.status === 'on';

    const bladeLength = 10;
    const bladeWidth = 3;

    return (
      <g
        key={deviceId}
        className="fp-device"
        onClick={() => onToggle(deviceId)}
        role="button"
        aria-label={`${dev.name}: ${isOn ? 'ON' : 'OFF'}. Click to toggle.`}
      >
        {/* Spinning blade group */}
        <g
          className={isOn ? 'fp-fan-spinning' : ''}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        >
          {/* 4 blades */}
          {[0, 90, 180, 270].map(angle => (
            <rect
              key={angle}
              x={cx - bladeWidth / 2}
              y={cy - bladeLength}
              width={bladeWidth}
              height={bladeLength}
              rx="1.5"
              className={isOn ? '' : 'fp-fan-off'}
              fill={isOn ? 'var(--fan-color)' : 'var(--text-muted)'}
              opacity={isOn ? 0.8 : 0.3}
              transform={`rotate(${angle} ${cx} ${cy})`}
            />
          ))}
        </g>
        {/* Center hub */}
        <circle cx={cx} cy={cy} r="3.5"
          className="fp-fan-center"
          fill={isOn ? 'var(--fan-color)' : 'var(--bg-elevated)'}
          stroke={isOn ? 'var(--fan-color)' : 'var(--border-color)'}
          strokeWidth="1"
          opacity={isOn ? 1 : 0.5}
        />
        {/* Label */}
        <text x={cx} y={cy + 18} className="fp-device-label">
          {dev.name}
        </text>
      </g>
    );
  };

  /**
   * Render a desk/table as a rounded rectangle.
   */
  const renderTable = (x, y, w, h, key) => (
    <rect key={key} x={x} y={y} width={w} height={h}
      className="furniture-table"
    />
  );

  /**
   * Render a chair as a small circle.
   */
  const renderChair = (cx, cy, key) => (
    <circle key={key} cx={cx} cy={cy} r="4"
      className="furniture-chair"
    />
  );

  return (
    <div className="panel" id="floor-plan">
      <div className="panel-header">
        <span className="panel-title">
          <span className="panel-title-icon">🏢</span>
          Office Floor Plan
        </span>
        <span className="panel-badge" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
          INTERACTIVE
        </span>
      </div>
      <div className="floor-plan-container">
        <svg className="floor-plan-svg" viewBox="0 0 600 380" xmlns="http://www.w3.org/2000/svg">
          {/* Background */}
          <rect x="0" y="0" width="600" height="380" rx="8" fill="var(--bg-secondary)" />

          {/* ── Drawing Room (Left) ─────────────────────── */}
          <rect x="10" y="10" width="185" height="360" rx="6"
            fill="var(--room-drawing-bg)" stroke="var(--room-drawing)" strokeWidth="1.5"
            strokeDasharray="4 2" opacity="0.7"
          />
          <text x="102" y="32" textAnchor="middle" fontSize="11" fontWeight="600"
            fill="var(--room-drawing)">Drawing Room</text>

          {/* Sofa / waiting bench */}
          {renderTable(30, 60, 50, 16, 'dr-sofa1')}
          {renderTable(30, 100, 50, 16, 'dr-sofa2')}

          {/* Coffee table */}
          {renderTable(100, 72, 30, 30, 'dr-table')}

          {/* Chairs around coffee table */}
          {renderChair(95, 87, 'dr-ch1')}
          {renderChair(135, 87, 'dr-ch2')}

          {/* Reception desk */}
          {renderTable(40, 250, 70, 22, 'dr-reception')}
          {renderChair(60, 240, 'dr-rch1')}
          {renderChair(90, 240, 'dr-rch2')}
          {renderChair(75, 282, 'dr-rch3')}

          {/* Devices */}
          {renderFan('drawingroom-fan-1', 60, 165)}
          {renderFan('drawingroom-fan-2', 140, 310)}
          {renderLight('drawingroom-light-1', 105, 55)}
          {renderLight('drawingroom-light-2', 50, 200)}
          {renderLight('drawingroom-light-3', 145, 200)}

          {/* ── Work Room 1 (Top Right) ────────────────── */}
          <rect x="207" y="10" width="383" height="172" rx="6"
            fill="var(--room-work1-bg)" stroke="var(--room-work1)" strokeWidth="1.5"
            strokeDasharray="4 2" opacity="0.7"
          />
          <text x="398" y="32" textAnchor="middle" fontSize="11" fontWeight="600"
            fill="var(--room-work1)">Work Room 1</text>

          {/* Desks — row of 3 */}
          {renderTable(230, 55, 50, 24, 'wr1-desk1')}
          {renderTable(300, 55, 50, 24, 'wr1-desk2')}
          {renderTable(370, 55, 50, 24, 'wr1-desk3')}

          {/* Chairs for desks */}
          {renderChair(255, 50, 'wr1-ch1')}
          {renderChair(325, 50, 'wr1-ch2')}
          {renderChair(395, 50, 'wr1-ch3')}
          {renderChair(255, 84, 'wr1-ch4')}
          {renderChair(325, 84, 'wr1-ch5')}
          {renderChair(395, 84, 'wr1-ch6')}

          {/* Shared table */}
          {renderTable(460, 60, 40, 50, 'wr1-shared')}
          {renderChair(455, 85, 'wr1-sch1')}
          {renderChair(505, 85, 'wr1-sch2')}

          {/* Bookshelf */}
          <rect x="530" y="50" width="12" height="60" rx="2"
            fill="var(--bg-elevated)" stroke="var(--border-color)" strokeWidth="0.8" />

          {/* Devices */}
          {renderFan('workroom1-fan-1', 290, 130)}
          {renderFan('workroom1-fan-2', 460, 140)}
          {renderLight('workroom1-light-1', 240, 105)}
          {renderLight('workroom1-light-2', 370, 130)}
          {renderLight('workroom1-light-3', 530, 130)}

          {/* ── Work Room 2 (Bottom Right) ─────────────── */}
          <rect x="207" y="194" width="383" height="176" rx="6"
            fill="var(--room-work2-bg)" stroke="var(--room-work2)" strokeWidth="1.5"
            strokeDasharray="4 2" opacity="0.7"
          />
          <text x="398" y="216" textAnchor="middle" fontSize="11" fontWeight="600"
            fill="var(--room-work2)">Work Room 2</text>

          {/* Conference table */}
          {renderTable(280, 250, 100, 35, 'wr2-conf')}

          {/* Chairs around conference table */}
          {renderChair(290, 245, 'wr2-cc1')}
          {renderChair(320, 245, 'wr2-cc2')}
          {renderChair(350, 245, 'wr2-cc3')}
          {renderChair(370, 245, 'wr2-cc4')}
          {renderChair(290, 290, 'wr2-cc5')}
          {renderChair(320, 290, 'wr2-cc6')}
          {renderChair(350, 290, 'wr2-cc7')}
          {renderChair(370, 290, 'wr2-cc8')}

          {/* Side desks */}
          {renderTable(440, 240, 44, 20, 'wr2-sd1')}
          {renderTable(440, 280, 44, 20, 'wr2-sd2')}
          {renderChair(435, 250, 'wr2-sdc1')}
          {renderChair(435, 290, 'wr2-sdc2')}

          {/* Whiteboard */}
          <rect x="520" y="230" width="8" height="50" rx="2"
            fill="var(--bg-elevated)" stroke="var(--border-color)" strokeWidth="0.8" />
          <text x="540" y="258" fontSize="6" fill="var(--text-muted)" textAnchor="start" opacity="0.6">Board</text>

          {/* Devices */}
          {renderFan('workroom2-fan-1', 260, 330)}
          {renderFan('workroom2-fan-2', 500, 320)}
          {renderLight('workroom2-light-1', 310, 225)}
          {renderLight('workroom2-light-2', 450, 330)}
          {renderLight('workroom2-light-3', 550, 240)}

          {/* ── Room divider walls ──────────────────────── */}
          <line x1="202" y1="10" x2="202" y2="370" stroke="var(--border-color)" strokeWidth="2" />
          <line x1="207" y1="188" x2="590" y2="188" stroke="var(--border-color)" strokeWidth="2" />

          {/* Door gaps */}
          <line x1="202" y1="140" x2="202" y2="170" stroke="var(--bg-secondary)" strokeWidth="3" />
          <line x1="202" y1="280" x2="202" y2="310" stroke="var(--bg-secondary)" strokeWidth="3" />
          <line x1="360" y1="188" x2="400" y2="188" stroke="var(--bg-secondary)" strokeWidth="3" />

          {/* Door indicators */}
          <text x="202" y="158" textAnchor="middle" fontSize="8" fill="var(--text-muted)" opacity="0.6">🚪</text>
          <text x="202" y="298" textAnchor="middle" fontSize="8" fill="var(--text-muted)" opacity="0.6">🚪</text>
          <text x="380" y="191" textAnchor="middle" fontSize="8" fill="var(--text-muted)" opacity="0.6">🚪</text>
        </svg>
      </div>
    </div>
  );
}
