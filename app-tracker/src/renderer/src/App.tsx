import React, { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import Controls from './components/Controls'

interface WindowData {
  name: string;
  title: string;
  focusTime: number;
  allUsage: Record<string, number>;
  appIcons: Record<string, string>; // NEW
}

// Fallback generic SVG icon if Windows fails to extract a native one
export const GenericAppIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-[#1E90FF]">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v2.25A2.25 2.25 0 006 10.5zm0 9.75h2.25A2.25 2.25 0 0010.5 18v-2.25a2.25 2.25 0 00-2.25-2.25H6a2.25 2.25 0 00-2.25 2.25V18A2.25 2.25 0 006 20.25zm9.75-9.75H18a2.25 2.25 0 002.25-2.25V6A2.25 2.25 0 0018 3.75h-2.25A2.25 2.25 0 0013.5 6v2.25a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'controls'>('dashboard');
  const [activeApp, setActiveApp] = useState<WindowData | null>(null);
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [blockList, setBlockList] = useState<Record<string, 'fully_blocked' | number>>({});

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

  // Custom Neon Tooltip with Icon Support
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const iconUrl = activeApp?.appIcons?.[label];
      return (
        <div className="bg-[#0D0D0D]/95 backdrop-blur-md border border-[#1E90FF]/50 p-4 rounded-xl shadow-[0_10px_30px_rgba(30,144,255,0.2)] flex items-center gap-4">
          {iconUrl ? <img src={iconUrl} alt={label} className="w-8 h-8 rounded" /> : <GenericAppIcon />}
          <div>
            <p className="text-[#F7F7F7] font-semibold mb-1 text-base">{label}</p>
            <p className="text-[#FF0099] font-bold text-sm tracking-wide">
              TIME: <span className="text-white font-medium ml-1">{formatTime(payload[0].value)}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Recharts Y-Axis Tick to show Icons next to the app names
  const CustomYAxisTick = ({ x, y, payload }: any) => {
    const iconUrl = activeApp?.appIcons?.[payload.value];
    return (
      <g transform={`translate(${x},${y})`}>
        {iconUrl && <image href={iconUrl} x="-155" y="-12" height="24" width="24" />}
        <text x={iconUrl ? "-120" : "-10"} y="4" dy="0.32em" textAnchor="end" fill="#E0E0E0" fontSize="13" className="font-medium">
          {payload.value}
        </text>
      </g>
    );
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#FFFFFF] flex overflow-hidden relative font-sans selection:bg-[#1E90FF]/30">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#1E90FF] rounded-full mix-blend-screen filter blur-[150px] opacity-20 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#FF0099] rounded-full mix-blend-screen filter blur-[150px] opacity-20 pointer-events-none"></div>

      <div className="w-64 shrink-0 bg-[#0D0D0D]/60 border-r border-[#1E90FF]/10 p-6 flex flex-col justify-between relative z-10 backdrop-blur-2xl">
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-3 px-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-[#1E90FF]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
            <span className="font-bold text-2xl tracking-wide bg-gradient-to-r from-[#1E90FF] to-[#FF0099] text-transparent bg-clip-text font-['Acorn',_sans-serif]">
              ForgePulse
            </span>
          </div>

          <nav className="flex flex-col gap-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 cursor-pointer ${activeTab === 'dashboard' ? 'bg-[#1E90FF]/10 text-white font-medium border-l-4 border-[#1E90FF] pl-3 shadow-[inset_4px_0_0_0_#1E90FF]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${activeTab === 'dashboard' ? 'text-[#1E90FF]' : ''}`}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
              </svg>
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('controls')}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 cursor-pointer ${activeTab === 'controls' ? 'bg-[#FF0099]/10 text-white font-medium border-l-4 border-[#FF0099] pl-3 shadow-[inset_4px_0_0_0_#FF0099]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${activeTab === 'controls' ? 'text-[#FF0099]' : ''}`}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
              </svg>
              Controls
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-2xl p-4">
          <div className="w-2.5 h-2.5 rounded-full bg-[#00FF85] animate-pulse shadow-[0_0_8px_#00FF85]"></div>
          <span className="text-xs text-gray-300 font-medium tracking-wider uppercase">Engine Live</span>
        </div>
      </div>

      <main className="flex-grow p-10 overflow-y-auto relative z-10 max-w-5xl mx-auto w-full">
        {activeTab === 'dashboard' ? (
          <div className="flex flex-col gap-8 animate-in fade-in duration-500">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-[#1E90FF] to-[#FF0099] text-transparent bg-clip-text font-['Acorn',_sans-serif]">
                Productivity Dashboard
              </h1>
              <p className="text-gray-400 text-lg">Real-time application footprint analysis.</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl flex items-center gap-6 hover:border-[#1E90FF]/30 transition-colors">
                {/* RENDER NATIVE ICON HERE */}
                {activeApp?.appIcons?.[activeApp.name] ? (
                  <img src={activeApp.appIcons[activeApp.name]} alt="Active App" className="w-16 h-16 rounded-xl shadow-[0_0_15px_rgba(30,144,255,0.3)]" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-[#1E90FF]/10 flex items-center justify-center border border-[#1E90FF]/20">
                    <GenericAppIcon />
                  </div>
                )}
                <div className="flex flex-col justify-center min-h-[80px]">
                  <span className="text-gray-400 text-sm mb-1 uppercase tracking-wider font-medium">Current Active App</span>
                  <span className="text-2xl font-semibold text-[#1E90FF] drop-shadow-[0_0_8px_rgba(30,144,255,0.3)] truncate max-w-[200px]">
                    {activeApp ? activeApp.name : "Scanning system..."}
                  </span>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl flex flex-col justify-center min-h-[140px] hover:border-[#FF0099]/30 transition-colors">
                <span className="text-gray-400 text-sm mb-2 uppercase tracking-wider font-medium">Focus Session</span>
                <span className="text-3xl font-bold text-white">
                  {activeApp ? formatTime(activeApp.focusTime) : "0s"}
                </span>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl h-80 w-full flex flex-col">
              <h2 className="text-xl font-semibold text-gray-200 mb-6">Top App Footprints</h2>
              <div className="flex-grow w-full min-h-0 min-w-0 pr-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={<CustomYAxisTick />} width={160} />
                    <Tooltip cursor={{ fill: 'rgba(30, 144, 255, 0.1)' }} content={<CustomTooltip />} />
                    <Bar dataKey="time" radius={[0, 8, 8, 0]} barSize={28}>
                      {chartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#FF0099' : '#1E90FF'} />
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
            availableApps={activeApp ? Object.keys(activeApp.allUsage) : []}
            appIcons={activeApp ? activeApp.appIcons : {}} // Pass Icons to controls!
          />
        )}
      </main>
    </div>
  )
}

export default App