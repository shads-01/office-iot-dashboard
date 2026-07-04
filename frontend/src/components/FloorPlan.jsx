import { useDeviceData } from "../hooks/useDeviceData";

// Device coordinate mapping relative to each room (percentage values)
const ROOM_LAYOUTS = {
  drawingroom: {
    color: "border-teal-500/30 dark:border-teal-400/20",
    bg: "bg-teal-500/5 dark:bg-teal-400/5",
    accent: "text-teal-600 dark:text-teal-400",
    devices: [
      { id: "drawingroom-fan-1", name: "Fan 1", x: 25, y: 35, type: "fan" },
      { id: "drawingroom-fan-2", name: "Fan 2", x: 75, y: 35, type: "fan" },
      { id: "drawingroom-light-1", name: "Light 1", x: 20, y: 70, type: "light" },
      { id: "drawingroom-light-2", name: "Light 2", x: 50, y: 70, type: "light" },
      { id: "drawingroom-light-3", name: "Light 3", x: 80, y: 70, type: "light" },
    ]
  },
  workroom1: {
    color: "border-indigo-500/30 dark:border-indigo-400/20",
    bg: "bg-indigo-500/5 dark:bg-indigo-400/5",
    accent: "text-indigo-600 dark:text-indigo-400",
    devices: [
      { id: "workroom1-fan-1", name: "Fan 1", x: 30, y: 30, type: "fan" },
      { id: "workroom1-fan-2", name: "Fan 2", x: 70, y: 30, type: "fan" },
      { id: "workroom1-light-1", name: "Light 1", x: 20, y: 70, type: "light" },
      { id: "workroom1-light-2", name: "Light 2", x: 50, y: 70, type: "light" },
      { id: "workroom1-light-3", name: "Light 3", x: 80, y: 70, type: "light" },
    ]
  },
  workroom2: {
    color: "border-violet-500/30 dark:border-violet-400/20",
    bg: "bg-violet-500/5 dark:bg-violet-400/5",
    accent: "text-violet-600 dark:text-violet-400",
    devices: [
      { id: "workroom2-fan-1", name: "Fan 1", x: 30, y: 30, type: "fan" },
      { id: "workroom2-fan-2", name: "Fan 2", x: 70, y: 30, type: "fan" },
      { id: "workroom2-light-1", name: "Light 1", x: 20, y: 70, type: "light" },
      { id: "workroom2-light-2", name: "Light 2", x: 50, y: 70, type: "light" },
      { id: "workroom2-light-3", name: "Light 3", x: 80, y: 70, type: "light" },
    ]
  }
};

export default function FloorPlan() {
  const { devices, toggleDevice } = useDeviceData();

  // Helper to find a device state from the live context list
  const getDeviceState = (id) => {
    return devices.find(d => d.id === id) || { status: "off", wattage: 0 };
  };

  // Renders the fan SVG icon
  const renderFanIcon = (isOn) => (
    <svg 
      className={`w-6 h-6 ${isOn ? "fan-spin text-amber-500" : "text-gray-400 dark:text-gray-600"}`} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
      <path d="M12 9c0-3.5 1.5-5 3-5s2 1.5 2 3c0 2-2.5 4-5 4" />
      <path d="M15 12c3.5 0 5 1.5 5 3s-1.5 2-3 2c-2 0-4-2.5-4-5" />
      <path d="M12 15c0 3.5-1.5 5-3 5s-2-1.5-2-3c0-2 2.5-4 5-4" />
      <path d="M9 12c-3.5 0-5-1.5-5-3s1.5-2 3-2c2 0 4 2.5 4 5" />
    </svg>
  );

  // Renders the light SVG icon
  const renderLightIcon = (isOn) => (
    <svg 
      className={`w-6 h-6 transition-all duration-300 ${isOn ? "text-amber-300 scale-110 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" : "text-gray-400 dark:text-gray-600"}`} 
      viewBox="0 0 24 24" 
      fill={isOn ? "currentColor" : "none"} 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A5 5 0 0 0 8 8c0 1 .4 2.5 1.5 3.5.7.8 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" />
      <path d="M10 22h4" />
    </svg>
  );

  return (
    <div className="glass-panel rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col h-full min-h-[460px]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Office Interactive Layout</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Real-time room layout. Click any device to toggle.</p>
        </div>
        <div className="flex gap-4 text-xs font-semibold text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 light-glow inline-block"></span>
            <span>Active Light</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-amber-500 fan-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /><path d="M12 9c0-3.5 1.5-5 3-5s2 1.5 2 3c0 2-2.5 4-5 4" /></svg>
            <span>Active Fan</span>
          </div>
        </div>
      </div>

      {/* Grid Floor Plan Wrapper */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4 min-h-[300px]">
        {/* Drawing Room (Col span 2) */}
        <div className={`relative md:col-span-2 border-2 rounded-2xl p-4 transition-all duration-300 ${ROOM_LAYOUTS.drawingroom.color} ${ROOM_LAYOUTS.drawingroom.bg}`}>
          {/* Room Title */}
          <div className="absolute top-3 left-4 flex flex-col z-10">
            <span className={`text-sm font-bold uppercase tracking-wider ${ROOM_LAYOUTS.drawingroom.accent}`}>Drawing Room</span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500">Waiting Area</span>
          </div>

          {/* Render devices inside Drawing Room */}
          {ROOM_LAYOUTS.drawingroom.devices.map((device) => {
            const state = getDeviceState(device.id);
            const isOn = state.status === "on";
            
            return (
              <button
                key={device.id}
                onClick={() => toggleDevice(device.id)}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 p-2.5 rounded-full transition-all duration-300 cursor-pointer outline-none border focus:ring-2 focus:ring-amber-400/50 group
                  ${isOn 
                    ? "bg-amber-100/80 border-amber-300 dark:bg-amber-950/40 dark:border-amber-700/60 light-glow" 
                    : "bg-white/80 border-gray-200 hover:border-gray-300 dark:bg-gray-800/80 dark:border-gray-700 hover:dark:border-gray-600"
                  }`}
                style={{ left: `${device.x}%`, top: `${device.y}%` }}
                title={`${device.name} (${state.status.toUpperCase()})`}
              >
                {device.type === "fan" ? renderFanIcon(isOn) : renderLightIcon(isOn)}
                {/* Tooltip */}
                <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-[10px] font-medium text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap shadow-md z-30">
                  {device.name} - {isOn ? `${state.wattage}W` : "Off"}
                </span>
              </button>
            );
          })}
        </div>

        {/* Work Rooms wrapper (Col span 3, stacked vertically to form L-shape layout feel) */}
        <div className="md:col-span-3 flex flex-col gap-4">
          {/* Work Room 1 */}
          <div className={`relative flex-1 border-2 rounded-2xl p-4 transition-all duration-300 ${ROOM_LAYOUTS.workroom1.color} ${ROOM_LAYOUTS.workroom1.bg}`}>
            <div className="absolute top-3 left-4 flex flex-col z-10">
              <span className={`text-sm font-bold uppercase tracking-wider ${ROOM_LAYOUTS.workroom1.accent}`}>Work Room 1</span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500">Developer bay</span>
            </div>

            {ROOM_LAYOUTS.workroom1.devices.map((device) => {
              const state = getDeviceState(device.id);
              const isOn = state.status === "on";
              
              return (
                <button
                  key={device.id}
                  onClick={() => toggleDevice(device.id)}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 p-2.5 rounded-full transition-all duration-300 cursor-pointer outline-none border focus:ring-2 focus:ring-amber-400/50 group
                    ${isOn 
                      ? "bg-amber-100/80 border-amber-300 dark:bg-amber-950/40 dark:border-amber-700/60 light-glow" 
                      : "bg-white/80 border-gray-200 hover:border-gray-300 dark:bg-gray-800/80 dark:border-gray-700 hover:dark:border-gray-600"
                    }`}
                  style={{ left: `${device.x}%`, top: `${device.y}%` }}
                  title={`${device.name} (${state.status.toUpperCase()})`}
                >
                  {device.type === "fan" ? renderFanIcon(isOn) : renderLightIcon(isOn)}
                  <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-[10px] font-medium text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap shadow-md z-30">
                    {device.name} - {isOn ? `${state.wattage}W` : "Off"}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Work Room 2 */}
          <div className={`relative flex-1 border-2 rounded-2xl p-4 transition-all duration-300 ${ROOM_LAYOUTS.workroom2.color} ${ROOM_LAYOUTS.workroom2.bg}`}>
            <div className="absolute top-3 left-4 flex flex-col z-10">
              <span className={`text-sm font-bold uppercase tracking-wider ${ROOM_LAYOUTS.workroom2.accent}`}>Work Room 2</span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500">Design bay</span>
            </div>

            {ROOM_LAYOUTS.workroom2.devices.map((device) => {
              const state = getDeviceState(device.id);
              const isOn = state.status === "on";
              
              return (
                <button
                  key={device.id}
                  onClick={() => toggleDevice(device.id)}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 p-2.5 rounded-full transition-all duration-300 cursor-pointer outline-none border focus:ring-2 focus:ring-amber-400/50 group
                    ${isOn 
                      ? "bg-amber-100/80 border-amber-300 dark:bg-amber-950/40 dark:border-amber-700/60 light-glow" 
                      : "bg-white/80 border-gray-200 hover:border-gray-300 dark:bg-gray-800/80 dark:border-gray-700 hover:dark:border-gray-600"
                    }`}
                  style={{ left: `${device.x}%`, top: `${device.y}%` }}
                  title={`${device.name} (${state.status.toUpperCase()})`}
                >
                  {device.type === "fan" ? renderFanIcon(isOn) : renderLightIcon(isOn)}
                  <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-[10px] font-medium text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap shadow-md z-30">
                    {device.name} - {isOn ? `${state.wattage}W` : "Off"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
