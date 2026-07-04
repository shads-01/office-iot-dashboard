import { useState, useEffect } from "react";
import { useDeviceData } from "../hooks/useDeviceData";

const ROOMS_CONFIG = [
  { id: "drawingroom", name: "Drawing Room", icon: "🛋️" },
  { id: "workroom1", name: "Work Room 1", icon: "💻" },
  { id: "workroom2", name: "Work Room 2", icon: "🎨" }
];

const calculateTimeAgo = (isoString) => {
  if (!isoString) return "unknown time";
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);

  if (diffSecs < 10) return "just now";
  if (diffSecs < 60) return `${diffSecs}s ago`;
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return new Date(isoString).toLocaleDateString();
};

// Individual row representing a device
function DeviceRow({ device, onToggle }) {
  const [prevLastChanged, setPrevLastChanged] = useState(device.lastChanged);
  const [timeAgo, setTimeAgo] = useState(() => calculateTimeAgo(device.lastChanged));

  // Update state during render when prop changes
  if (device.lastChanged !== prevLastChanged) {
    setPrevLastChanged(device.lastChanged);
    setTimeAgo(calculateTimeAgo(device.lastChanged));
  }

  useEffect(() => {
    // Only set interval timer in effect
    const timer = setInterval(() => {
      setTimeAgo(calculateTimeAgo(device.lastChanged));
    }, 15000);

    return () => clearInterval(timer);
  }, [device.lastChanged]);

  const isOn = device.status === "on";

  return (
    <div 
      onClick={() => onToggle(device.id)}
      className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200 cursor-pointer select-none group
        ${isOn 
          ? "bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10 dark:bg-amber-500/5 dark:border-amber-500/10 hover:dark:bg-amber-500/10" 
          : "bg-gray-50 border-gray-100 hover:bg-gray-100/50 dark:bg-gray-900/30 dark:border-gray-800/40 hover:dark:bg-gray-900/60"
        }`}
    >
      <div className="flex items-center gap-3">
        {/* Device Icon wrapper */}
        <div className={`p-2 rounded-lg transition-all duration-300
          ${isOn 
            ? "bg-amber-100 dark:bg-amber-950/40 text-amber-500" 
            : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
          }`}
        >
          {device.type === "fan" ? (
            <svg 
              className={`w-5 h-5 ${isOn ? "fan-spin" : ""}`} 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M12 9c0-3.5 1.5-5 3-5s2 1.5 2 3c0 2-2.5 4-5 4" />
              <path d="M15 12c3.5 0 5 1.5 5 3s-1.5 2-3 2c-2 0-4-2.5-4-5" />
              <path d="M12 15c0 3.5-1.5 5-3 5s-2-1.5-2-3c0-2 2.5-4 5-4" />
              <path d="M9 12c-3.5 0-5-1.5-5-3s1.5-2 3-2c2 0 4 2.5 4 5" />
            </svg>
          ) : (
            <svg 
              className="w-5 h-5" 
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
          )}
        </div>

        {/* Name and Last Changed */}
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-gray-900 group-hover:dark:text-white transition-colors">
            {device.name}
          </span>
          <span className="text-[10px] text-gray-400 dark:text-gray-500">
            changed {timeAgo}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Wattage indicator */}
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
          {isOn ? `${device.wattage}W` : "0W"}
        </span>

        {/* Toggle slide switch */}
        <div 
          className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-250
            ${isOn ? "bg-amber-500" : "bg-gray-200 dark:bg-gray-700"}`}
        >
          <div 
            className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-250
              ${isOn ? "translate-x-4" : "translate-x-0"}`}
          />
        </div>
      </div>
    </div>
  );
}

export default function DevicePanel() {
  const { devices, toggleDevice } = useDeviceData();
  const [collapsed, setCollapsed] = useState({
    drawingroom: false,
    workroom1: false,
    workroom2: false
  });

  const toggleCollapse = (roomId) => {
    setCollapsed(prev => ({
      ...prev,
      [roomId]: !prev[roomId]
    }));
  };

  return (
    <div className="glass-panel rounded-3xl p-6 shadow-xl h-full flex flex-col min-h-[460px]">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Live Device Status</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Status cards grouped by room area.</p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto max-h-[500px] pr-1">
        {ROOMS_CONFIG.map((room) => {
          const roomDevices = devices.filter(d => d.room === room.id);
          const activeCount = roomDevices.filter(d => d.status === "on").length;
          const isCollapsed = collapsed[room.id];

          return (
            <div 
              key={room.id} 
              className="border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm bg-white/40 dark:bg-gray-900/10"
            >
              {/* Collapsible Header */}
              <div 
                onClick={() => toggleCollapse(room.id)}
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/20 select-none border-b border-gray-50 dark:border-gray-800 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{room.icon}</span>
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">{room.name}</h3>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">
                      {activeCount} of {roomDevices.length} devices active
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full transition-all duration-300
                    ${activeCount > 0 ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" : "bg-gray-300 dark:bg-gray-700"}`} 
                  />
                  {/* Chevron Icon */}
                  <svg 
                    className={`w-4 h-4 text-gray-400 transform transition-transform duration-250 ${isCollapsed ? "-rotate-90" : "rotate-0"}`} 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2.5" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </div>

              {/* Collapsible Device List */}
              <div 
                className={`transition-all duration-300 ease-in-out ${isCollapsed ? "max-h-0 overflow-hidden opacity-0" : "max-h-[600px] opacity-100"}`}
              >
                <div className="p-3.5 space-y-2 bg-white/20 dark:bg-gray-950/5">
                  {roomDevices.map((device) => (
                    <DeviceRow 
                      key={device.id} 
                      device={device} 
                      onToggle={toggleDevice} 
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
