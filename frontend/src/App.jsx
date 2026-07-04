import { useState, useEffect } from "react";
import { DeviceDataProvider, useDeviceData } from "./hooks/useDeviceData";
import { USE_MOCK } from "./api/socketProvider";
import FloorPlan from "./components/FloorPlan";
import DevicePanel from "./components/DevicePanel";
import PowerMeter from "./components/PowerMeter";
import AlertsPanel from "./components/AlertsPanel";

function DashboardContent() {
  const { triggerTimeTravel, devices } = useDeviceData();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const handleTimeTravelClick = async () => {
    setToastMessage("Initiating time travel: setting clock to 10 PM...");
    setShowToast(true);
    await triggerTimeTravel();
    setTimeout(() => {
      setShowToast(false);
    }, 4000);
  };

  const activeCount = devices.filter(d => d.status === "on").length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0c0d12] text-gray-900 dark:text-gray-100 transition-colors duration-300 pb-20">
      {/* Header Bar */}
      <header className="border-b border-gray-200/60 dark:border-gray-800/40 bg-white/70 dark:bg-[#111219]/60 backdrop-blur-md sticky top-0 z-40 transition-colors">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500 text-white p-2 rounded-xl shadow-[0_4px_12px_rgba(245,158,11,0.3)]">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                Office IoT Monitor
                <span className="text-xs font-normal text-gray-400 dark:text-gray-500">v1.0</span>
              </h1>
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Lights, Fans, Discord System
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Connection Status Badge */}
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${USE_MOCK ? "bg-purple-500 animate-pulse" : "bg-emerald-500 animate-pulse"}`}></span>
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                {USE_MOCK ? "🧪 Mock Layer Standalone" : "🟢 Backend Connected"}
              </span>
            </div>

            {/* Separator */}
            <span className="w-px h-5 bg-gray-200 dark:bg-gray-800"></span>

            {/* Theme Toggle Button */}
            <ThemeToggler />
          </div>
        </div>
      </header>

      {/* Main Grid Layout */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Quick stats ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="glass-panel p-4 rounded-2xl flex items-center justify-between shadow-sm">
            <div>
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Active Devices</span>
              <span className="text-2xl font-black block mt-0.5 text-gray-800 dark:text-white">{activeCount} / 15</span>
            </div>
            <span className="text-2xl">🔌</span>
          </div>
          <div className="glass-panel p-4 rounded-2xl flex items-center justify-between shadow-sm">
            <div>
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Rooms Monitored</span>
              <span className="text-2xl font-black block mt-0.5 text-gray-800 dark:text-white">3 Rooms</span>
            </div>
            <span className="text-2xl">🏢</span>
          </div>
          <div className="glass-panel p-4 rounded-2xl flex items-center justify-between shadow-sm">
            <div>
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">System Health</span>
              <span className="text-2xl font-black block mt-0.5 text-emerald-500">Nominal</span>
            </div>
            <span className="text-2xl">🛡️</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          {/* Left Column: Floor Plan and Device Panel (Col span 3) */}
          <div className="lg:col-span-3 space-y-6">
            <FloorPlan />
            <DevicePanel />
          </div>

          {/* Right Column: Power Meter and Alerts (Col span 2) */}
          <div className="lg:col-span-2 space-y-6">
            <PowerMeter />
            <AlertsPanel />
          </div>
        </div>
      </main>

      {/* Floating Developer Time-Travel Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={handleTimeTravelClick}
          className="bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700 text-white font-bold text-xs py-3 px-4.5 rounded-full shadow-[0_8px_24px_rgba(245,158,11,0.4)] flex items-center gap-2 hover:scale-105 transition-all duration-200 cursor-pointer active:scale-95 group"
          title="Fast-forward simulated clock to 10:00 PM to force after-hours alerts"
        >
          <svg className="w-4 h-4 text-white group-hover:animate-bounce" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
          </svg>
          Time Travel (10 PM)
        </button>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-20 right-6 z-50 bg-gray-900 text-white dark:bg-white dark:text-gray-900 text-xs font-semibold py-3 px-5 rounded-xl shadow-2xl border border-gray-800 dark:border-gray-200 animate-slide-up flex items-center gap-2.5">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          {toastMessage}
        </div>
      )}
    </div>
  );
}

// Session-persisted Theme Toggler
function ThemeToggler() {
  const [isDark, setIsDark] = useState(true); // Default to Dark Mode for premium look

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#181920] hover:bg-gray-100 hover:dark:bg-gray-900 transition-colors shadow-sm outline-none cursor-pointer"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        // Sun Icon
        <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
      ) : (
        // Moon Icon
        <svg className="w-4 h-4 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      )}
    </button>
  );
}

export default function App() {
  return (
    <DeviceDataProvider>
      <DashboardContent />
    </DeviceDataProvider>
  );
}
