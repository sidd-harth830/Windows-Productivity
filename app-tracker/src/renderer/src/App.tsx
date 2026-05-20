import React, { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
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

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'controls' | 'settings'>('dashboard');
  const [activeApp, setActiveApp] = useState<WindowData | null>(null);
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [blockList, setBlockList] = useState<Record<string, 'fully_blocked' | number>>({});
  
  // Settings Memory
  const [trackSelf, setTrackSelf] = useState<boolean>(() => JSON.parse(localStorage.getItem('trackSelf') || 'false'));
  const [trackSystemApps, setTrackSystemApps] = useState<boolean>(() => JSON.parse(localStorage.getItem('trackSystemApps') || 'false'));
  const [theme, setTheme] = useState<ThemeKey>(() => (localStorage.getItem('theme') as ThemeKey) || 'neon');

  useEffect(() => { localStorage.setItem('trackSelf', JSON.stringify(trackSelf)); }, [trackSelf]);
  useEffect(() => { localStorage.setItem('trackSystemApps', JSON.stringify(trackSystemApps)); }, [trackSystemApps]);
  useEffect(() => { localStorage.setItem('theme', theme); }, [theme]);

  // SYNC PREFERENCES TO BACKEND EVERY TIME THEY CHANGE
  useEffect(() => {
    if (window.api && window.api.updatePreferences) {
      window.api.updatePreferences({ trackSelf, trackSystemApps });
    }
  }, [trackSelf, trackSystemApps]);

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

  const chartData = activeApp
    ? Object.entries(activeApp.allUsage)
      .map(([name, time]) => ({ name, time }))
      .sort((a, b) => b.time - a.time)
      .slice(0, 5)
    : [];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const iconUrl = activeApp?.appIcons?.[label];
      return (
        <div className="bg-[var(--bg)]/95 backdrop-blur-md border border-[rgba(var(--a1),0.5)] p-4 rounded-xl shadow-[0_10px_30px_rgba(var(--a1),0.2)] flex items-center gap-4">
          <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
            {iconUrl ? <img src={iconUrl} alt={label} className="max-w-full max-h-full object-contain" /> : <GenericAppIcon />}
          </div>
          <div>
            <p className="text-[var(--text)] font-semibold mb-1 text-base">{label}</p>
            <p className="text-[rgb(var(--a2))] font-bold text-sm tracking-wide">
              TIME: <span className="text-[var(--text)] font-medium ml-1">{formatTime(payload[0].value)}</span>
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
          <span className="text-[var(--text)] opacity-80 text-[13px] font-medium truncate max-w-[110px] text-right">
            {payload.value}
          </span>
          <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
             {iconUrl ? <img src={iconUrl} alt="" className="max-w-full max-h-full object-contain" /> : <GenericAppIcon />}
          </div>
        </div>
      </foreignObject>
    );
  };

  const renderDashboard = () => {
    const displayAppName = activeApp?.name || "Scanning system...";
    const displayTime = formatTime(activeApp?.focusTime || 0);

    return (
      <div className="flex flex-col h-full gap-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
        <div>
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-[rgb(var(--a1))] to-[rgb(var(--a2))] text-transparent bg-clip-text font-['Acorn',_sans-serif]">
            Productivity Dashboard
          </h1>
          <p className="text-[var(--text)] opacity-60 text-lg">Real-time application footprint analysis.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 shrink-0">
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-6 rounded-3xl flex items-center gap-6 hover:border-[rgba(var(--a1),0.3)] transition-colors shadow-lg">
            <div className="w-16 h-16 rounded-2xl bg-[var(--bg)] border border-[rgba(var(--a1),0.3)] flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_rgba(var(--a1),0.15)] p-2">
              {activeApp?.appIcons?.[displayAppName] ? (
                <img src={activeApp.appIcons[displayAppName]} alt="Active App" className="max-w-[44px] max-h-[44px] object-contain" />
              ) : (
                <div className="w-8 h-8"><GenericAppIcon /></div>
              )}
            </div>
            <div className="flex flex-col justify-center min-h-[80px] overflow-hidden">
              <span className="text-[var(--text)] opacity-50 text-sm mb-1 uppercase tracking-wider font-bold">Current Active App</span>
              <span className="text-2xl font-semibold text-[rgb(var(--a1))] drop-shadow-[0_0_8px_rgba(var(--a1),0.3)] truncate">
                {displayAppName}
              </span>
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-6 rounded-3xl flex flex-col justify-center min-h-[128px] hover:border-[rgba(var(--a2),0.3)] transition-colors shadow-lg">
            <span className="text-[var(--text)] opacity-50 text-sm mb-2 uppercase tracking-wider font-bold">Current Session</span>
            <span className="text-4xl font-bold text-[var(--text)] tracking-wide">
              {displayTime}
            </span>
          </div>
        </div>

        <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-8 rounded-3xl flex-1 flex flex-col shadow-lg min-h-[400px]">
          <h2 className="text-xl font-bold text-[var(--text)] mb-8">Top App Footprints</h2>
          <div className="flex-1 w-full min-h-0 min-w-0 pr-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={<CustomYAxisTick />} width={180} />
                
                {/* PROFESSIONAL HOVER: Subtle glass cursor box instead of pure white */}
                <Tooltip cursor={{ fill: 'rgba(255, 255, 255, 0.05)', rx: 10 }} content={<CustomTooltip />} />
                
                <Bar dataKey="time" radius={[0, 8, 8, 0]} barSize={32}>
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? 'rgb(var(--a2))' : `rgba(var(--a1), ${1 - (index * 0.15)})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  const renderSettings = () => (
    <div className="flex flex-col h-full gap-8 animate-in fade-in duration-500 max-w-5xl mx-auto w-full">
      <div className="shrink-0">
        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-[rgb(var(--a1))] to-[rgb(var(--a2))] text-transparent bg-clip-text font-['Acorn',_sans-serif]">
            Application Preferences
        </h1>
        <p className="text-[var(--text)] opacity-60 text-lg">Customize your tracking and visual experience.</p>
      </div>

      <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-8 rounded-3xl flex flex-col gap-10 shadow-xl flex-1 overflow-y-auto">
        
        {/* Tracking Engine Settings */}
        <div className="flex flex-col gap-4">
           <h3 className="text-[var(--text)] font-bold text-xl border-b border-white/5 pb-3">Tracking Engine</h3>
           
           <div className="flex items-center justify-between bg-black/40 p-5 rounded-2xl border border-white/5">
              <div>
                 <h4 className="text-[var(--text)] font-bold text-base tracking-wide">Track Windows System Apps</h4>
                 <p className="text-sm text-[var(--text)] opacity-50 mt-1 max-w-lg">Include internal OS components like Windows Explorer, Search, and Start Menu in your usage data.</p>
              </div>
              <button onClick={() => setTrackSystemApps(!trackSystemApps)} className={`w-14 h-8 flex flex-shrink-0 items-center rounded-full p-1 cursor-pointer transition-all duration-300 focus:outline-none ${trackSystemApps ? 'bg-[rgb(var(--a1))] shadow-[0_0_15px_rgba(var(--a1),0.5)]' : 'bg-gray-700'}`}>
                  <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${trackSystemApps ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
           </div>

           <div className="flex items-center justify-between bg-black/40 p-5 rounded-2xl border border-white/5">
              <div>
                 <h4 className="text-[var(--text)] font-bold text-base tracking-wide">Track ForgePulse Usage</h4>
                 <p className="text-sm text-[var(--text)] opacity-50 mt-1 max-w-lg">Include the time spent staring at this dashboard in your total application statistics.</p>
              </div>
              <button onClick={() => setTrackSelf(!trackSelf)} className={`w-14 h-8 flex flex-shrink-0 items-center rounded-full p-1 cursor-pointer transition-all duration-300 focus:outline-none ${trackSelf ? 'bg-[rgb(var(--a1))] shadow-[0_0_15px_rgba(var(--a1),0.5)]' : 'bg-gray-700'}`}>
                  <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${trackSelf ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
           </div>
        </div>

        {/* Visual Themes */}
        <div className="flex flex-col gap-4 pb-10">
           <h3 className="text-[var(--text)] font-bold text-xl border-b border-white/5 pb-3">Visual Themes (9 Available)</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(THEMES).map(([key, t]) => (
                <button 
                  key={key}
                  onClick={() => setTheme(key as ThemeKey)}
                  className={`flex flex-col gap-3 p-5 rounded-2xl border transition-all text-left cursor-pointer ${theme === key ? 'bg-[rgba(var(--a1),0.1)] border-[rgb(var(--a1))] shadow-[0_0_20px_rgba(var(--a1),0.2)]' : 'bg-[var(--bg)] border-white/5 hover:border-white/20 hover:shadow-lg'}`}
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
      style={{
        backgroundColor: activeTheme.bg,
        '--bg': activeTheme.bg,
        '--text': activeTheme.text,
        '--a1': activeTheme.a1,
        '--a2': activeTheme.a2
      } as React.CSSProperties}
    >
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[rgb(var(--a1))] rounded-full mix-blend-screen filter blur-[200px] opacity-[0.12] pointer-events-none transition-colors duration-500"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[rgb(var(--a2))] rounded-full mix-blend-screen filter blur-[200px] opacity-[0.12] pointer-events-none transition-colors duration-500"></div>

      <div className="w-72 shrink-0 bg-black/20 border-r border-white/5 p-8 flex flex-col justify-between relative z-10 backdrop-blur-2xl shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
        <div className="flex flex-col gap-10">
          <div className="flex items-center gap-3 px-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7 text-[rgb(var(--a1))]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
            <span className="font-bold text-2xl tracking-wide bg-gradient-to-r from-[rgb(var(--a1))] to-[rgb(var(--a2))] text-transparent bg-clip-text font-['Acorn',_sans-serif]">
              ForgePulse
            </span>
          </div>

          <nav className="flex flex-col gap-3">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-300 cursor-pointer text-sm tracking-wide ${activeTab === 'dashboard' ? 'bg-[rgba(var(--a1),0.15)] text-[var(--text)] font-bold border-l-4 border-[rgb(var(--a1))] pl-4' : 'text-[var(--text)] opacity-50 hover:bg-white/5 hover:opacity-100'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${activeTab === 'dashboard' ? 'text-[rgb(var(--a1))]' : ''}`}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
              </svg>
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('controls')}
              className={`flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-300 cursor-pointer text-sm tracking-wide ${activeTab === 'controls' ? 'bg-[rgba(var(--a2),0.15)] text-[var(--text)] font-bold border-l-4 border-[rgb(var(--a2))] pl-4' : 'text-[var(--text)] opacity-50 hover:bg-white/5 hover:opacity-100'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${activeTab === 'controls' ? 'text-[rgb(var(--a2))]' : ''}`}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
              </svg>
              Controls
            </button>
          </nav>
        </div>

        <div className="flex flex-col gap-4">
          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-4 px-5 py-3 rounded-xl transition-all duration-300 cursor-pointer text-sm font-bold tracking-wide ${activeTab === 'settings' ? 'bg-white/10 text-[var(--text)] border-l-4 border-[var(--text)] pl-4' : 'text-[var(--text)] opacity-50 hover:bg-white/5 hover:opacity-100'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
               <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
               <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </button>
          
          <div className="flex items-center gap-4 bg-black/40 border border-white/5 rounded-2xl p-5 shadow-lg">
            <div className="w-2.5 h-2.5 rounded-full bg-[rgb(var(--a1))] animate-pulse shadow-[0_0_8px_rgb(var(--a1))]"></div>
            <span className="text-xs text-[var(--text)] opacity-80 font-bold tracking-widest uppercase">Engine Live</span>
          </div>
        </div>
      </div>

      <main className="flex-1 p-10 overflow-y-auto relative z-10 w-full h-full">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'settings' && renderSettings()}
        {activeTab === 'controls' && (
          <Controls
            isFocusMode={isFocusMode}
            setIsFocusMode={setIsFocusMode}
            blockList={blockList}
            setBlockList={setBlockList}
            availableApps={activeApp ? Object.keys(activeApp.allUsage) : []}
            appIcons={activeApp ? activeApp.appIcons : {}}
          />
        )}
      </main>
    </div>
  )
}

export default App