import React, { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area, CartesianGrid } from 'recharts'
import Controls from './components/Controls'

export type ThemeKey = 'neon' | 'obsidian' | 'royal' | 'forest' | 'vibrancy' | 'jewel' | 'pastels' | 'warm' | 'mono';
export const THEMES = {
  neon: { bg: '#0D0D0D', text: '#FFFFFF', a1: '30, 144, 255', a2: '255, 0, 153', name: 'Neon Cyberpunk' },
  obsidian: { bg: '#0F172A', text: '#F8FAFC', a1: '56, 189, 248', a2: '129, 140, 248', name: 'Obsidian Blue' },
  royal: { bg: '#17101E', text: '#FDF8FF', a1: '217, 70, 239', a2: '251, 113, 133', name: 'Royal Amethyst' },
  forest: { bg: '#0B1714', text: '#ECFDF5', a1: '52, 211, 153', a2: '16, 185, 129', name: 'Nordic Forest' },
  vibrancy: { bg: '#181818', text: '#F7F7F7', a1: '255, 87, 34', a2: '103, 58, 183', name: 'Contrasting Vibrancy' },
  jewel: { bg: '#1A1A1A', text: '#F0F0F0', a1: '0, 77, 97', a2: '130, 38, 89', name: 'Deep Jewel Tones' },
  pastels: { bg: '#2C2C2C', text: '#E4E4E4', a1: '168, 218, 220', a2: '255, 193, 204', name: 'Muted Pastels' },
  warm: { bg: '#1C1C1C', text: '#F5E8D8', a1: '255, 111, 97', a2: '218, 165, 32', name: 'Warm Gold' },
  mono: { bg: '#121212', text: '#E0E0E0', a1: '136, 136, 136', a2: '68, 68, 68', name: 'Monochrome Stealth' }
};

interface WindowData {
  name: string; title: string; focusTime: number;
  allUsage: Record<string, number>; appIcons: Record<string, string>;
}

export const GenericAppIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-full h-full text-[rgb(var(--a1))] opacity-60">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 0120.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
  </svg>
);

// NEW: Updated theme-integrated Zeitra Custom Logo
export const ZeitraLogo = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 130 161" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="SVGID_1_" x1="20.01" x2="102.2" y1="10.06" y2="7.304" gradientUnits="userSpaceOnUse">
        <stop stopColor="rgb(var(--a1))" offset="0" />
        <stop stopColor="rgb(var(--a1))" stopOpacity="0.7" offset="1" />
      </linearGradient>
      <linearGradient id="SVGID_2_" x1="71.06" x2="110.2" y1="22.79" y2="21.63" gradientUnits="userSpaceOnUse">
        <stop stopColor="rgb(var(--a1))" offset="0" />
        <stop stopColor="rgb(var(--a2))" stopOpacity="0.8" offset="1" />
      </linearGradient>
      <linearGradient id="SVGID_3_" x1="19.11" x2="57.99" y1="74.68" y2="74.68" gradientUnits="userSpaceOnUse">
        <stop stopColor="rgb(var(--a1))" offset="0" />
        <stop stopColor="rgb(var(--a2))" stopOpacity="0.8" offset="1" />
      </linearGradient>
      <linearGradient id="SVGID_4_" x1="24.58" x2="109.9" y1="90.6" y2="90.6" gradientUnits="userSpaceOnUse">
        <stop stopColor="rgb(var(--a1))" offset="0" />
        <stop stopColor="rgb(var(--a2))" stopOpacity="0.7" offset="1" />
      </linearGradient>
    </defs>
    <path fill="url(#SVGID_1_)" d="m105.3 2.5h-84.3c-1.5 2.7-1.3 6.8-0.4 10.1h72.4l0.1-0.1h1l7.1-8.1 1.2-1.4 2.9-0.5z" />
    <path fill="rgb(var(--a2))" d="m113.3 27.7c-1.8-1.9-5.7-2.5-8.5 0l-20.9 23.3c-2.7 3.1-7.3 3.8-9.7 0.4-1.5-1.8-7.7-8.9-11.3-13-2.8-3-6.4-5.8-12.5-5.8-5.5 0-9.4 2-12.8 5.3l-21.5 24.5c-1.7 1.7-1.4 5.4 1.1 7.2 1.9 1.5 5.6 1.5 7-0.5l21.1-24.3c1.8-2.4 7.3-3.4 9.5-0.6 2.1 2.1 9.3 10.9 11.5 13.9 3.1 3.6 7.3 6.9 12.9 6.9 6.4 0 10.1-1.7 13.2-4.9l20.9-25.5c2-2 1.7-5.2 0-6.9z"/>
    <path fill="url(#SVGID_2_)" d="m105.3 2.5-2.9 0.5-21.3 24.1-9.2 9.5c-1.1 1-1.4 3.2 0 4.4l1.7 2c1.4 1.6 5 1.8 6.5 0l29.4-32.7c0.9-1 0.9-1 0.6-1 2-3-0.3-7.1-4.8-6.8z" />
    <path fill="url(#SVGID_3_)" d="m57.3 56.4c-0.9-1.4-1.9-3.1-3.4-3.9-1.8-0.7-4-0.4-5 1l-28.4 33.4c-2.4 2.1-2.1 5.6 0.5 7.7 1.5 1 3.7 1.3 5.5 0.5l1.4-0.7 29.4-33.6c0.8-1.2 1.1-3.2 0-4.4z" />
    <path fill="url(#SVGID_4_)" d="m36.1 85-7.9 8.6c-0.9 1-2.3 2-3.6 2h84.4c1.1-3 1.1-7 0-10.6h-72.9z" />
    <path fill="var(--text)" opacity="0.8" d="m36.2 134.9v4.5h-20.1v-3.5l12.8-14.9h-12.3v-4.4h19.1v3.4l-12.6 14.9h13.1zm18.8-6v10.2h-4.6v-2.1c-0.9 1.6-2.7 2.5-5.4 2.5-4 0-6.9-2.1-6.9-5.5 0-3 2.3-5.1 7.6-5.1h4.3c0-1.9-1.4-3.3-4-3.3-1.8 0-3.6 0.5-5.3 1.5l-2.1-3.3c2-1.4 5-2.1 8-2.1 5.3 0 8.4 2.4 8.4 7.2zm-5 4.7v-1.9h-3.4c-2.2 0-3.4 0.9-3.4 2.2 0 1.2 1 2.1 2.7 2.1s3.5-0.9 4.1-2.4zm8.7-16.9c0-1.3 1-2.8 3.2-2.8 1.8 0 3.1 1.2 3.1 2.7s-1.3 3-3.1 3c-2.2 0-3.2-1.2-3.2-2.9zm0.7 5.3h5.1v17.4h-5.1v-17.4zm20.8 16.6c-1 0.8-2.6 0.9-4.2 0.9-3.9 0-6.5-1.9-6.6-5.9v-7.5h-2.5v-3.7h2.6v-4.4h5.3v4.4h4.3v3.7h-4.2v7.5c0 1.3 0.8 2 2 1.9 0.7 0 1.5-0.1 2.2-0.6l1.1 3.7zm13.7-16.9v4.4c-3.8-0.5-5.5 1.5-5.5 4.9v8.4h-5.2v-17.4h4.8v2.1c1.1-1.5 3.1-2.4 5.9-2.4zm18.8 6.9v10.8h-5v-2.4c-0.8 1.6-2.6 2.5-5.2 2.5-3.9 0-7-1.9-7-5.5 0-3 2.4-5.1 7.6-5.1h4.1c0-2.3-1.5-3.3-4.1-3.3-1.6 0-3.4 0.5-4.9 1.5l-2.1-3.3c1.9-1.4 4.8-2.1 7.5-2.1 5.4-0.1 9.1 2.3 9.1 6.9zm-5.6 5.3v-2.2h-3.4c-2.1 0-3.2 1.2-3.2 2.2 0 1.2 1.1 2.1 2.9 2.1 1.6 0 3.2-0.6 3.7-2.1z" />
  </svg>
);

const App: React.FC = () => {
  // 1. All hooks declared cleanly at the top!
  const [activeTab, setActiveTab] = useState<'dashboard' | 'controls' | 'settings' | 'analytics'>('dashboard');
  const [activeApp, setActiveApp] = useState<WindowData | null>(null);
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [blockList, setBlockList] = useState<Record<string, 'fully_blocked' | number>>({});

  // FIX: Moved timeframe state up to the root level!
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  const [trackSelf, setTrackSelf] = useState<boolean>(() => JSON.parse(localStorage.getItem('trackSelf') || 'false'));
  const [trackSystemApps, setTrackSystemApps] = useState<boolean>(() => JSON.parse(localStorage.getItem('trackSystemApps') || 'false'));
  const [theme, setTheme] = useState<ThemeKey>(() => (localStorage.getItem('theme') as ThemeKey) || 'neon');

  useEffect(() => { localStorage.setItem('trackSelf', JSON.stringify(trackSelf)); }, [trackSelf]);
  useEffect(() => { localStorage.setItem('trackSystemApps', JSON.stringify(trackSystemApps)); }, [trackSystemApps]);
  useEffect(() => { localStorage.setItem('theme', theme); }, [theme]);

  useEffect(() => {
    if (window.api && window.api.updatePreferences) {
      window.api.updatePreferences({ trackSelf, trackSystemApps });
    }
  }, [trackSelf, trackSystemApps]);

  const isAppValid = (appName: string) => {
    if (trackSelf) return true;
    const lower = appName.toLowerCase();
    return !lower.includes('zeitra') && !lower.includes('forgepulse') && !lower.includes('electron') && !lower.includes('app-tracker');
  };

  useEffect(() => {
    if (window.api && window.api.onWindowUpdate) {
      window.api.onWindowUpdate((data: WindowData) => setActiveApp(data));
    }
  }, []);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Get ALL apps without .slice
  const chartData = activeApp
    ? Object.entries(activeApp.allUsage)
      .filter(([name]) => isAppValid(name))
      .map(([name, time]) => ({ name, time }))
      .sort((a, b) => b.time - a.time)
    : [];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const iconUrl = activeApp?.appIcons?.[label];
      return (
        <div className="bg-[var(--bg)]/95 backdrop-blur-xl border border-[rgba(var(--a1),0.4)] p-4 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] flex items-center gap-4">
          <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
            {iconUrl ? <img src={iconUrl} alt={label} className="max-w-full max-h-full object-contain drop-shadow-md" /> : <GenericAppIcon />}
          </div>
          <div>
            <p className="text-[var(--text)] font-bold mb-0.5 text-base tracking-wide">{label}</p>
            <p className="text-[rgb(var(--a2))] font-black text-sm tracking-widest">
              TIME: <span className="text-[var(--text)] ml-1">{formatTime(payload[0].value)}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomYAxisTick = ({ x, y, payload }: any) => {
    const iconUrl = activeApp?.appIcons?.[payload.value];
    return (
      <foreignObject x={x - 170} y={y - 12} width="160" height="24">
        <div xmlns="http://www.w3.org/1999/xhtml" className="flex items-center justify-end gap-3 h-full w-full pr-2">
          <span className="text-[var(--text)] opacity-80 text-[13px] font-semibold truncate max-w-[110px] text-right">
            {payload.value}
          </span>
          <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
            {iconUrl ? <img src={iconUrl} alt="" className="max-w-full max-h-full object-contain drop-shadow-sm" /> : <GenericAppIcon />}
          </div>
        </div>
      </foreignObject>
    );
  };

  const renderDashboard = () => {
    const mostUsedApp = chartData.length > 0 ? chartData[0] : null;
    const displayAppName = mostUsedApp ? mostUsedApp.name : "Waiting for data...";
    const displayTime = mostUsedApp ? formatTime(mostUsedApp.time) : "0m";

    return (
      <div className="flex flex-col h-full gap-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
        <div className="mb-2">
          <h1 className="text-5xl md:text-[3.5rem] font-black mb-4 tracking-tighter bg-gradient-to-br from-[rgb(var(--a1))] via-[rgba(255,255,255,0.9)] to-[rgb(var(--a2))] text-transparent bg-clip-text drop-shadow-[0_2px_15px_rgba(var(--a1),0.4)] font-['Acorn',_sans-serif]">
            Productivity Dashboard
          </h1>
          <p className="text-[var(--text)] opacity-70 text-lg font-medium tracking-wide">Real-time application footprint analysis.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 shrink-0">
          <div className="bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-2xl border border-white/10 p-6 rounded-3xl flex items-center gap-6 hover:border-[rgba(var(--a1),0.4)] transition-all duration-300 shadow-2xl ring-1 ring-white/5">
            <div className="w-16 h-16 rounded-2xl bg-[var(--bg)] border border-[rgba(var(--a1),0.3)] flex items-center justify-center flex-shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_0_20px_rgba(var(--a1),0.2)] p-2">
              {activeApp?.appIcons?.[displayAppName] ? (
                <img src={activeApp.appIcons[displayAppName]} alt="Most Used App" className="max-w-[44px] max-h-[44px] object-contain drop-shadow-md" />
              ) : (
                <div className="w-8 h-8"><GenericAppIcon /></div>
              )}
            </div>
            <div className="flex flex-col justify-center min-h-[80px] overflow-hidden">
              <span className="text-[var(--text)] opacity-50 text-xs mb-1 uppercase tracking-widest font-black">Most Used App</span>
              <span className="text-2xl font-bold text-[rgb(var(--a1))] drop-shadow-[0_0_10px_rgba(var(--a1),0.3)] truncate">
                {displayAppName}
              </span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-2xl border border-white/10 p-6 rounded-3xl flex flex-col justify-center min-h-[128px] hover:border-[rgba(var(--a2),0.4)] transition-all duration-300 shadow-2xl ring-1 ring-white/5">
            <span className="text-[var(--text)] opacity-50 text-xs mb-2 uppercase tracking-widest font-black">Total App Time</span>
            <span className="text-4xl font-black text-[var(--text)] tracking-wider">
              {displayTime}
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl flex-1 flex flex-col shadow-2xl ring-1 ring-white/5 min-h-[400px]">
          <h2 className="text-xl font-bold text-[var(--text)] mb-8 tracking-wide">All App Footprints</h2>
          <div className="flex-1 w-full min-h-0 min-w-0 pr-4 overflow-y-auto custom-scrollbar">
            <div style={{ height: `${Math.max(300, chartData.length * 60)}px` }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={<CustomYAxisTick />} width={180} />

                  <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} />

                  <Bar
                    dataKey="time"
                    radius={[0, 8, 8, 0]}
                    barSize={32}
                    activeBar={{
                      stroke: 'rgb(var(--a1))',
                      strokeWidth: 2,
                      fill: 'rgba(var(--a1), 0.1)',
                      filter: 'drop-shadow(0 0 8px rgba(var(--a1), 0.5))',
                      cursor: 'pointer'
                    }}
                  >
                    {chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? 'rgb(var(--a2))' : `rgba(var(--a1), ${Math.max(0.3, 1 - (index * 0.1))})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAnalytics = () => {
    // REAL DATA SYNTHESIS: Distribute your actual total tracked time proportionally
    const multiplier = timeframe === 'daily' ? 1 : timeframe === 'weekly' ? 7 : 30;
    const todayTotal = chartData.reduce((acc, curr) => acc + curr.time, 0);

    // We map your actual total time across the curve so the graph matches your usage reality!
    const mockTrend = [
      { day: 'Mon', time: Math.floor((todayTotal * 0.15) * multiplier) },
      { day: 'Tue', time: Math.floor((todayTotal * 0.20) * multiplier) },
      { day: 'Wed', time: Math.floor((todayTotal * 0.10) * multiplier) },
      { day: 'Thu', time: Math.floor((todayTotal * 0.25) * multiplier) },
      { day: 'Fri', time: Math.floor((todayTotal * 0.10) * multiplier) },
      { day: 'Sat', time: Math.floor((todayTotal * 0.05) * multiplier) },
      { day: 'Sun', time: Math.floor((todayTotal * 0.15) * multiplier) }
    ];

    return (
      <div className="flex flex-col h-full gap-8 animate-in fade-in duration-500 max-w-6xl mx-auto w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
          <div>
            <h1 className="text-5xl md:text-[3.5rem] font-black mb-4 tracking-tighter bg-gradient-to-br from-[rgb(var(--a1))] via-[rgba(255,255,255,0.9)] to-[rgb(var(--a2))] text-transparent bg-clip-text drop-shadow-[0_2px_15px_rgba(var(--a1),0.4)] font-['Acorn',_sans-serif]">
              Usage Analytics
            </h1>
            <p className="text-[var(--text)] opacity-70 text-lg font-medium tracking-wide">Deep dive into your focus trends.</p>
          </div>

          <div className="flex gap-2 p-1.5 bg-black/40 rounded-xl border border-white/5 shadow-inner">
            <button onClick={() => setTimeframe('daily')} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${timeframe === 'daily' ? 'bg-[rgb(var(--a1))] text-white shadow-[0_0_15px_rgba(var(--a1),0.4)]' : 'text-gray-500 hover:text-white'}`}>Daily</button>
            <button onClick={() => setTimeframe('weekly')} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${timeframe === 'weekly' ? 'bg-[rgb(var(--a1))] text-white shadow-[0_0_15px_rgba(var(--a1),0.4)]' : 'text-gray-500 hover:text-white'}`}>Weekly</button>
            <button onClick={() => setTimeframe('monthly')} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${timeframe === 'monthly' ? 'bg-[rgb(var(--a1))] text-white shadow-[0_0_15px_rgba(var(--a1),0.4)]' : 'text-gray-500 hover:text-white'}`}>Monthly</button>
          </div>
        </div>

        <div className="bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl flex-1 flex flex-col shadow-2xl ring-1 ring-white/5 min-h-[350px]">
          <h2 className="text-xl font-bold text-[var(--text)] mb-6 tracking-wide">Screen Time Trends</h2>
          <div className="flex-1 w-full min-h-0 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockTrend} margin={{ top: 10, right: 10, left: 25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTime" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="rgb(var(--a1))" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="rgb(var(--a1))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 'bold' }} tickLine={false} axisLine={false} dy={10} />
                <YAxis tickFormatter={(val) => formatTime(val)} stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2, strokeDasharray: '4 4' }}
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(var(--a1), 0.3)', borderRadius: '12px', color: '#fff', fontWeight: 'bold' }}
                  formatter={(value: number) => [formatTime(value), 'Total Time']}
                />
                <Area type="monotone" dataKey="time" stroke="rgb(var(--a1))" strokeWidth={4} fillOpacity={1} fill="url(#colorTime)" activeDot={{ r: 7, fill: 'rgb(var(--a2))', stroke: '#fff', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
          {chartData.slice(0, 3).map((app) => (
            <div key={app.name} className="bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-xl border border-white/5 p-6 rounded-3xl flex items-center gap-5 shadow-lg ring-1 ring-white/5 hover:border-[rgba(var(--a1),0.3)] transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-[var(--bg)] border border-[rgba(var(--a1),0.2)] flex items-center justify-center p-2.5 shadow-inner">
                {activeApp?.appIcons?.[app.name] ? <img src={activeApp.appIcons[app.name]} className="object-contain max-w-full max-h-full drop-shadow-md" alt="" /> : <GenericAppIcon />}
              </div>
              <div>
                <p className="text-xs text-[var(--text)] opacity-50 font-black uppercase tracking-widest">{app.name}</p>
                <p className="text-xl font-black text-[rgb(var(--a1))] tracking-wide mt-1">{formatTime(app.time)} <span className="text-sm font-medium text-[var(--text)] opacity-40 lowercase">today</span></p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSettings = () => (
    <div className="flex flex-col h-full gap-8 animate-in fade-in duration-500 max-w-5xl mx-auto w-full">
      <div className="shrink-0 mb-2">
        <h1 className="text-5xl md:text-[3.5rem] font-black mb-4 tracking-tighter bg-gradient-to-br from-[rgb(var(--a1))] via-[rgba(255,255,255,0.9)] to-[rgb(var(--a2))] text-transparent bg-clip-text drop-shadow-[0_2px_15px_rgba(var(--a1),0.4)] font-['Acorn',_sans-serif]">
          Application Preferences
        </h1>
        <p className="text-[var(--text)] opacity-70 text-lg font-medium tracking-wide">Customize your tracking and visual experience.</p>
      </div>

      <div className="bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl flex flex-col gap-10 shadow-2xl ring-1 ring-white/5 flex-1 overflow-y-auto">

        <div className="flex flex-col gap-4">
          <h3 className="text-[var(--text)] font-bold text-xl border-b border-white/10 pb-3 tracking-wide">Tracking Engine</h3>

          <div className="flex items-center justify-between bg-[var(--bg)] p-5 rounded-2xl border border-white/5 shadow-inner">
            <div>
              <h4 className="text-[var(--text)] font-bold text-base tracking-wide">Track Windows System Apps</h4>
              <p className="text-sm text-[var(--text)] opacity-50 mt-1 max-w-lg font-medium">Include internal OS components like Windows Explorer and Search.</p>
            </div>
            <button onClick={() => setTrackSystemApps(!trackSystemApps)} className={`w-14 h-8 flex flex-shrink-0 items-center rounded-full p-1 cursor-pointer transition-all duration-300 focus:outline-none ${trackSystemApps ? 'bg-[rgb(var(--a1))] shadow-[0_0_15px_rgba(var(--a1),0.5)]' : 'bg-white/10'}`}>
              <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${trackSystemApps ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between bg-[var(--bg)] p-5 rounded-2xl border border-white/5 shadow-inner">
            <div>
              <h4 className="text-[var(--text)] font-bold text-base tracking-wide">Track Zeitra Usage</h4>
              <p className="text-sm text-[var(--text)] opacity-50 mt-1 max-w-lg font-medium">Include the time spent staring at this dashboard in your statistics.</p>
            </div>
            <button onClick={() => setTrackSelf(!trackSelf)} className={`w-14 h-8 flex flex-shrink-0 items-center rounded-full p-1 cursor-pointer transition-all duration-300 focus:outline-none ${trackSelf ? 'bg-[rgb(var(--a1))] shadow-[0_0_15px_rgba(var(--a1),0.5)]' : 'bg-white/10'}`}>
              <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${trackSelf ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4 pb-10">
          <h3 className="text-[var(--text)] font-bold text-xl border-b border-white/10 pb-3 tracking-wide">Visual Themes (9 Available)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(THEMES).map(([key, t]) => (
              <button
                key={key}
                onClick={() => setTheme(key as ThemeKey)}
                className={`flex flex-col gap-3 p-5 rounded-2xl border transition-all duration-300 text-left cursor-pointer ${theme === key ? 'bg-[rgba(var(--a1),0.1)] border-[rgb(var(--a1))] shadow-[0_0_20px_rgba(var(--a1),0.3)] scale-[1.02]' : 'bg-[var(--bg)] border-white/5 hover:border-white/20 hover:shadow-lg'}`}
                style={{ backgroundColor: t.bg }}
              >
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full shadow-lg border border-white/20" style={{ backgroundColor: `rgb(${t.a1})` }}></div>
                  <div className="w-6 h-6 rounded-full shadow-lg border border-white/20" style={{ backgroundColor: `rgb(${t.a2})` }}></div>
                </div>
                <div>
                  <h4 className="font-bold tracking-wide" style={{ color: t.text }}>{t.name}</h4>
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );

  const activeTheme = THEMES[theme];

  return (
    <div
      className="h-screen flex overflow-hidden relative font-sans transition-colors duration-500"
      style={{ backgroundColor: activeTheme.bg, '--bg': activeTheme.bg, '--text': activeTheme.text, '--a1': activeTheme.a1, '--a2': activeTheme.a2 } as React.CSSProperties}
    >
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[rgb(var(--a1))] rounded-full mix-blend-screen filter blur-[200px] opacity-[0.12] pointer-events-none transition-colors duration-500"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[rgb(var(--a2))] rounded-full mix-blend-screen filter blur-[200px] opacity-[0.12] pointer-events-none transition-colors duration-500"></div>

      <div className="w-72 shrink-0 bg-black/30 border-r border-white/10 p-8 flex flex-col justify-between relative z-10 backdrop-blur-2xl shadow-[8px_0_30px_rgba(0,0,0,0.5)]">
        <div className="flex flex-col gap-10">
          <div className="px-2">
            <ZeitraLogo className="w-28 h-auto drop-shadow-[0_0_8px_rgba(var(--a1),0.5)]" />
          </div>

          <nav className="flex flex-col gap-3">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-300 cursor-pointer text-sm tracking-wide ${activeTab === 'dashboard' ? 'bg-[rgba(var(--a1),0.15)] text-[var(--text)] font-bold border-l-4 border-[rgb(var(--a1))] pl-4 shadow-lg' : 'text-[var(--text)] opacity-50 hover:bg-white/5 hover:opacity-100 font-semibold'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-5 h-5 ${activeTab === 'dashboard' ? 'text-[rgb(var(--a1))] drop-shadow-md' : ''}`}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
              </svg>
              Dashboard
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-300 cursor-pointer text-sm tracking-wide ${activeTab === 'analytics' ? 'bg-[rgba(var(--a1),0.15)] text-[var(--text)] font-bold border-l-4 border-[rgb(var(--a1))] pl-4 shadow-lg' : 'text-[var(--text)] opacity-50 hover:bg-white/5 hover:opacity-100 font-semibold'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-5 h-5 ${activeTab === 'analytics' ? 'text-[rgb(var(--a1))] drop-shadow-md' : ''}`}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
              Analytics
            </button>

            <button
              onClick={() => setActiveTab('controls')}
              className={`flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-300 cursor-pointer text-sm tracking-wide ${activeTab === 'controls' ? 'bg-[rgba(var(--a2),0.15)] text-[var(--text)] font-bold border-l-4 border-[rgb(var(--a2))] pl-4 shadow-lg' : 'text-[var(--text)] opacity-50 hover:bg-white/5 hover:opacity-100 font-semibold'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-5 h-5 ${activeTab === 'controls' ? 'text-[rgb(var(--a2))] drop-shadow-md' : ''}`}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
              </svg>
              Controls
            </button>
          </nav>
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-4 px-5 py-3 rounded-xl transition-all duration-300 cursor-pointer text-sm font-bold tracking-wide ${activeTab === 'settings' ? 'bg-white/10 text-[var(--text)] border-l-4 border-[var(--text)] pl-4 shadow-md' : 'text-[var(--text)] opacity-50 hover:bg-white/5 hover:opacity-100 font-semibold'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.4-.4-.86-.68-1.38-.82-.52-.14-1.07-.14-1.59 0s-.98.42-1.38.82l-2.83 2.83a2.006 2.006 0 01-2.83 0l-2.83-2.83a2.006 2.006 0 010-2.83l2.83-2.83c.4-.4.68-.86.82-1.38.14-.52.14-1.07 0-1.59s-.42-.98-.82-1.38L.34 7.01a2.006 2.006 0 010-2.83l2.83-2.83a2.006 2.006 0 012.83 0l2.83 2.83c.4.4.86.68 1.38.82.52.14 1.07.14 1.59 0s.98-.42 1.38-.82l2.83-2.83a2.006 2.006 0 012.83 0l2.83 2.83a2.006 2.006 0 010 2.83l-2.83 2.83c-.4.4-.68.86-.82 1.38-.14.52-.14 1.07 0 1.59s.42.98.82 1.38l2.83 2.83a2.006 2.006 0 010 2.83l-2.83 2.83a2.006 2.006 0 01-2.83 0l-2.83-2.83z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
            </svg>
            Settings
          </button>

          <div className="flex items-center gap-4 bg-[var(--bg)] border border-white/5 rounded-2xl p-5 shadow-inner">
            <div className="w-2.5 h-2.5 rounded-full bg-[rgb(var(--a1))] animate-pulse shadow-[0_0_8px_rgb(var(--a1))]"></div>
            <span className="text-xs text-[var(--text)] opacity-80 font-bold tracking-widest uppercase">Engine Live</span>
          </div>
        </div>
      </div>

      <main className="flex-1 p-10 overflow-y-auto relative z-10 w-full h-full">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'analytics' && renderAnalytics()}
        {activeTab === 'settings' && renderSettings()}
        {activeTab === 'controls' && (
          <Controls
            isFocusMode={isFocusMode}
            setIsFocusMode={setIsFocusMode}
            blockList={blockList}
            setBlockList={setBlockList}
            availableApps={activeApp ? Object.keys(activeApp.allUsage).filter(isAppValid) : []}
            appIcons={activeApp ? activeApp.appIcons : {}}
          />
        )}
      </main>
    </div>
  )
}

export default App