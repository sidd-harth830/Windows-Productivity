import React, { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface WindowData {
  name: string;
  title: string;
  focusTime: number;
  allUsage: Record<string, number>;
}

const App: React.FC = () => {
  const [activeApp, setActiveApp] = useState<WindowData | null>(null);

  useEffect(() => {
    if (window.api) {
      window.api.onWindowUpdate((data: WindowData) => {
        setActiveApp(data);
      });
    }
  }, []);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  // Convert the object data into an array for the chart, sort it, and take the top 5
  const chartData = activeApp
    ? Object.entries(activeApp.allUsage)
      .map(([name, time]) => ({ name, time }))
      .sort((a, b) => b.time - a.time)
      .slice(0, 5)
    : [];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 overflow-hidden relative">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-50 shadow-2xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-50 shadow-2xl"></div>

      <div className="relative z-10 w-full max-w-4xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl flex flex-col gap-8">

        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text text-center">
            Productivity Dashboard
          </h1>
          <p className="text-gray-400 text-lg text-center">Live System Tracking Active</p>
        </div>

        {/* Live Stats Cards */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-black/30 border border-white/5 p-6 rounded-2xl flex flex-col items-center justify-center transition-transform hover:scale-105 cursor-default min-h-[140px]">
            <span className="text-gray-400 text-sm mb-2">Current Active App</span>
            <span className="text-2xl font-semibold text-center text-blue-300">
              {activeApp ? activeApp.name : "Waiting for data..."}
            </span>
            <span className="text-xs text-gray-500 mt-2 truncate w-full text-center px-4">
              {activeApp ? activeApp.title : "..."}
            </span>
          </div>

          <div className="bg-black/30 border border-white/5 p-6 rounded-2xl flex flex-col items-center justify-center transition-transform hover:scale-105 cursor-default min-h-[140px]">
            <span className="text-gray-400 text-sm mb-2">Focus Time (Current App)</span>
            <span className="text-2xl font-semibold">
              {activeApp ? formatTime(activeApp.focusTime) : "0s"}
            </span>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-black/30 border border-white/5 p-6 rounded-2xl h-80 w-full flex flex-col">
          <h2 className="text-xl font-semibold text-gray-300 mb-6 text-center">Top 5 Most Used Apps</h2>
          {/* APPLIED FIX 1: Added min-h-0 min-w-0 to prevent Flexbox crashes */}
          <div className="flex-grow w-full min-h-0 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              {/* APPLIED FIX 2: Set left margin to 0 */}
              <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                {/* APPLIED FIX 3: Added explicit width of 120 so long names like Visual Studio Code don't get cut off */}
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 14 }} width={120} />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white' }}
                  formatter={(value: number) => [formatTime(value), 'Time Spent']}
                />
                <Bar dataKey="time" radius={[0, 8, 8, 0]} barSize={24}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#8b5cf6' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  )
}

export default App