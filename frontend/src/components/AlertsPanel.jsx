import { useState, useEffect } from "react";
import { useDeviceData } from "../hooks/useDeviceData";

const calculateRelativeTime = (isoString) => {
  if (!isoString) return "";
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);

  if (diffSecs < 10) return "just now";
  if (diffSecs < 60) return `${diffSecs}s ago`;
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return new Date(isoString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

function AlertItem({ alert, isNewest }) {
  const [prevTimestamp, setPrevTimestamp] = useState(alert.timestamp);
  const [relativeTime, setRelativeTime] = useState(() => calculateRelativeTime(alert.timestamp));

  // Sync state in render when prop updates
  if (alert.timestamp !== prevTimestamp) {
    setPrevTimestamp(alert.timestamp);
    setRelativeTime(calculateRelativeTime(alert.timestamp));
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setRelativeTime(calculateRelativeTime(alert.timestamp));
    }, 15000);
    return () => clearInterval(timer);
  }, [alert.timestamp]);

  const isAmber = alert.severity === "amber" || alert.type === "after-hours";
  const isRed = alert.severity === "red" || alert.type === "prolonged-use";

  let animClass = "";
  if (isNewest) {
    animClass = isAmber ? "new-alert-amber" : "new-alert-red";
  }

  return (
    <div 
      className={`border rounded-xl p-3.5 flex items-start gap-3 transition-all duration-300 ${animClass}
        ${isRed 
          ? "bg-red-500/5 border-red-500/10 dark:bg-red-950/20 dark:border-red-900/30" 
          : "bg-amber-500/5 border-amber-500/10 dark:bg-amber-950/20 dark:border-amber-900/30"
        }`}
    >
      {/* Icon */}
      <div 
        className={`p-2 rounded-lg mt-0.5
          ${isRed 
            ? "bg-red-100 dark:bg-red-950/50 text-red-500" 
            : "bg-amber-100 dark:bg-amber-950/50 text-amber-500"
          }`}
      >
        {isRed ? (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
          </svg>
        )}
      </div>

      {/* Message content */}
      <div className="flex-1 flex flex-col">
        <div className="flex justify-between items-start gap-2">
          <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
            {isRed ? "Prolonged Use Alert" : "After Hours Alert"}
          </span>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
            {relativeTime}
          </span>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
          {alert.message}
        </p>
        {alert.room && (
          <span className="text-[9px] uppercase tracking-wider font-extrabold text-gray-400 dark:text-gray-500 mt-2">
            Area: {alert.room === "drawingroom" ? "Drawing Room" : alert.room === "workroom1" ? "Work Room 1" : "Work Room 2"}
          </span>
        )}
      </div>
    </div>
  );
}

export default function AlertsPanel() {
  const { alerts, newestAlertId } = useDeviceData();

  return (
    <div className="glass-panel rounded-3xl p-6 shadow-xl h-full flex flex-col min-h-[460px]">
      <div className="mb-5 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Anomaly Alerts</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Real-time alerts for forgotten devices.</p>
        </div>
        
        {/* Count badge */}
        {alerts.length > 0 && (
          <span className="bg-red-500 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.4)]">
            {alerts.length} ALERT{alerts.length > 1 ? "S" : ""}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto max-h-[500px] pr-1">
        {alerts.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="p-4 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 mb-4 animate-pulse">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">No alerts — all quiet</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 max-w-[200px] mt-1.5 leading-relaxed">
              No after-hours activity or prolonged device usage detected.
            </p>
          </div>
        ) : (
          /* Alerts List */
          <div className="space-y-3">
            {alerts.map((alert) => (
              <AlertItem 
                key={alert.id || `${alert.type}-${alert.timestamp}`} 
                alert={alert} 
                isNewest={newestAlertId === alert.id} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
