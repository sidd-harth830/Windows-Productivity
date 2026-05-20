import React, { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import Controls from './components/Controls'

interface WindowData {
  name: string;
  title: string;
  focusTime: number;
  allUsage: Record<string, number>;
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'controls'>('dashboard');
  const [activeApp, setActiveApp] = useState<WindowData | null>(null);
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [blockList, setBlockList] = useState<string[]>(['chrome.exe', 'msedge.exe']);

  useEffect(() => {
    if (window.api && window.api.onWindowUpdate) {
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

  const chartData = activeApp
    ? Object.entries(activeApp.allUsage)
      .map(([name, time]) => ({ name, time }))
      .sort((a, b) => b.time - a.time)
      .slice(0, 5)
    : [];

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex overflow-hidden relative font-sans">

      {/* Background ambient decorative effects */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-30 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-30 pointer-events-none"></div>

      {/* LEFT SIDEBAR PANEL */}
      <div className="w-64 shrink-0 bg-black/20 border-r border-white/5 p-6 flex flex-col justify-between relative z-10 backdrop-blur-xl">
        <div className="flex flex-col gap-8">
          {/* Branding Header */}
          <div className="flex items-center gap-3 px-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-purple-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
            <span className="font-bold text-xl tracking-wide bg-gradient-to-r from-white to-gray-400 text-transparent bg-clip-text">
              ForgePulse
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer ${activeTab === 'dashboard'
                ? 'bg-white/10 text-white font-medium border-l-4 border-purple-500 pl-3'
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
              </svg>
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('controls')}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer ${activeTab === 'controls'
                ? 'bg-white/10 text-white font-medium border-l-4 border-purple-500 pl-3'
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
              </svg>
              Controls
            </button>
          </nav>
        </div>

        {/* Status Indicator Bottom */}
        <div className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-2xl p-4">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
          <span className="text-xs text-gray-400 font-medium tracking-wider uppercase">Tracking Engine Live</span>
        </div>
      </div>

      {/* RIGHT CONTENT PANEL */}
      <main className="flex-grow p-10 overflow-y-auto relative z-10 max-w-5xl mx-auto w-full">
        {activeTab === 'dashboard' ? (
          <div className="flex flex-col gap-8">
            {/* Dashboard Header */}
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
                Productivity Dashboard
              </h1>
              <p className="text-gray-400 text-lg">Real-time application footprint analysis.</p>
            </div>

            {/* Live Stats Cards Grid */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl flex flex-col justify-center min-h-[140px]">
                <span className="text-gray-400 text-sm mb-2">Current Active App</span>
                <span className="text-2xl font-semibold text-blue-300">
                  {activeApp ? activeApp.name : "Waiting for data..."}
                </span>
                <span className="text-xs text-gray-500 mt-2 truncate w-full">
                  {activeApp ? activeApp.title : "..."}
                </span>
              </div>

              <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl flex flex-col justify-center min-h-[140px]">
                <span className="text-gray-400 text-sm mb-2">Focus Time (Current App)</span>
                <span className="text-2xl font-semibold">
                  {activeApp ? formatTime(activeApp.focusTime) : "0s"}
                </span>
              </div>
            </div>

            {/* Recharts Graphical Panel */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl h-80 w-full flex flex-col">
              <h2 className="text-xl font-semibold text-gray-300 mb-6">Top 5 Most Used Apps</h2>
              <div className="flex-grow w-full min-h-0 min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 14 }} width={120} />
                    <Tooltip
                      cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white' }}
                      formatter={(value: number) => [formatTime(value), 'Time Spent']}
                    />
                    <Bar dataKey="time" radius={[0, 8, 8, 0]} barSize={24}>
                      {chartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#8b5cf6' : '#3b82f6'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : (
          <Controls
            isFocusMode={isFocusMode}
            setIsFocusMode={setIsFocusMode}
            blockList={blockList}
            setBlockList={setBlockList}
          />
        )}
      </main>
    </div>
  )
}

export default App