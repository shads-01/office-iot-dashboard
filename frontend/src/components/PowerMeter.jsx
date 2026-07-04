import { ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import { useDeviceData } from "../hooks/useDeviceData";

export default function PowerMeter() {
  const { power, powerHistory } = useDeviceData();

  const currentWatts = power.total || 0;
  const maxLimit = 1000;
  const percentage = Math.min(100, Math.round((currentWatts / maxLimit) * 100));

  // Data for the radial half-donut gauge
  const gaugeData = [
    { value: currentWatts },
    { value: Math.max(0, maxLimit - currentWatts) }
  ];

  // Helper for rooms labels
  const getRoomName = (roomId) => {
    if (roomId === "drawingroom") return "Drawing Room";
    if (roomId === "workroom1") return "Work Room 1";
    if (roomId === "workroom2") return "Work Room 2";
    return roomId;
  };

  return (
    <div className="glass-panel rounded-3xl p-6 shadow-xl flex flex-col h-full min-h-[460px]">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Power & Energy Meter</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Real-time electricity consumption stats.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
        {/* Left Column: Big Stats & Gauge */}
        <div className="flex flex-col justify-between border border-gray-100 dark:border-gray-800/60 rounded-2xl p-4 bg-white/40 dark:bg-gray-900/10">
          <div className="flex justify-between items-start">
            {/* Numeric Indicators */}
            <div>
              <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">CURRENT DRAW</span>
              <span className="text-4xl font-extrabold text-gray-900 dark:text-white mt-1 block">
                {currentWatts}<span className="text-lg font-medium text-gray-400 ml-1">W</span>
              </span>
            </div>
            
            <div className="text-right">
              <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">ESTIMATED COST (TODAY)</span>
              <span className="text-2xl font-bold text-amber-500 mt-1 block">
                ৳{power.estimatedCost ? power.estimatedCost.toFixed(2) : "0.00"}
              </span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500">
                {power.kwh ? power.kwh.toFixed(4) : "0.0000"} kWh @ ৳8.0
              </span>
            </div>
          </div>

          {/* Half-Pie Gauge */}
          <div className="relative h-36 flex items-center justify-center overflow-hidden">
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie
                  data={gaugeData}
                  cx="5/6"
                  cy="120"
                  startAngle={180}
                  endAngle={0}
                  innerRadius={68}
                  outerRadius={88}
                  paddingAngle={0}
                  dataKey="value"
                >
                  <Cell fill="url(#gaugeGradient)" />
                  <Cell className="fill-gray-200 dark:fill-gray-800" />
                </Pie>
                <defs>
                  <linearGradient id="gaugeGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#10b981" /> {/* Emerald */}
                    <stop offset="60%" stopColor="#f59e0b" /> {/* Amber */}
                    <stop offset="100%" stopColor="#ef4444" /> {/* Red */}
                  </linearGradient>
                </defs>
              </PieChart>
            </ResponsiveContainer>
            
            {/* Gauge Label Overlay */}
            <div className="absolute bottom-4 flex flex-col items-center">
              <span className="text-2xl font-extrabold text-gray-800 dark:text-gray-100">{percentage}%</span>
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">OF 1000W LIMIT</span>
            </div>
          </div>

          {/* Per-Room Breakdown */}
          <div className="grid grid-cols-3 gap-2 border-t border-gray-100 dark:border-gray-800/80 pt-3.5">
            {Object.keys(power.byRoom || {}).map(roomId => {
              const roomPower = power.byRoom[roomId];
              let colorClasses = "text-teal-500 bg-teal-500/5 dark:bg-teal-500/10";
              if (roomId === "workroom1") colorClasses = "text-indigo-500 bg-indigo-500/5 dark:bg-indigo-500/10";
              if (roomId === "workroom2") colorClasses = "text-violet-500 bg-violet-500/5 dark:bg-violet-500/10";

              return (
                <div key={roomId} className={`p-2 rounded-xl text-center ${colorClasses}`}>
                  <span className="text-[9px] font-bold uppercase tracking-wider block opacity-70">
                    {getRoomName(roomId).replace(" Room", "")}
                  </span>
                  <span className="text-sm font-extrabold block mt-0.5">
                    {roomPower.watts}W
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Historical Area Chart */}
        <div className="flex flex-col border border-gray-100 dark:border-gray-800/60 rounded-2xl p-4 bg-white/40 dark:bg-gray-900/10 h-full min-h-[220px]">
          <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Live Consumption History (Watts)</span>
          <div className="flex-1 min-h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={powerHistory} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorWatts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="time" 
                  stroke="#9ca3af" 
                  fontSize={8} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  stroke="#9ca3af" 
                  fontSize={8} 
                  tickLine={false} 
                  axisLine={false}
                  domain={[0, 450]}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(31, 41, 55, 0.95)', 
                    borderRadius: '8px', 
                    border: 'none',
                    fontSize: '11px',
                    color: '#fff'
                  }}
                  itemStyle={{ color: '#fbbf24' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="watts" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorWatts)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
