import React, { useEffect, useState, useRef } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area, CartesianGrid, PieChart, Pie } from 'recharts'
import Controls from './components/Controls'
import ContextMenu from './components/ContextMenu'
import NoData from './components/NoData'
import { GenericAppIcon, ZeitraLogo, LayoutDashboard, LineChart, ShieldAlert, Settings, Download, Monitor, Sun, Moon, HardDrive, Eye, X } from './components/Icons'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './dialog'
import { Switch } from './switch'
import { Input } from './input'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { Calendar } from './calendar'
import { format } from 'date-fns'
import { Toaster, toast } from 'sonner'

interface WindowData {
  name: string; title: string; focusTime: number;
  allUsage: Record<string, number>; appIcons: Record<string, string>;
}

const App: React.FC = () => {
  // 1. All hooks declared cleanly at the top!
  const [activeTab, setActiveTab] = useState<'dashboard' | 'controls' | 'settings' | 'analytics'>('dashboard');
  const [activeApp, setActiveApp] = useState<WindowData | null>(null);
  const [lastActiveValidApp, setLastActiveValidApp] = useState<string | null>(null);
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [blockList, setBlockList] = useState<Record<string, 'fully_blocked' | number>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState<boolean>(false);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; appName: string } | null>(null);

  const dashboardRef = useRef<HTMLDivElement>(null);
  const analyticsRef = useRef<HTMLDivElement>(null);

  const [dashboardSearch, setDashboardSearch] = useState<string>('');
  const [sortMode, setSortMode] = useState<'duration' | 'alphabetical'>('duration');
  const [historyData, setHistoryData] = useState<Record<string, Record<string, number>>>({});
  const [analyticsStartDate, setAnalyticsStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [analyticsEndDate, setAnalyticsEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [datePreset, setDatePreset] = useState<string>('today');
  const [analyticsSearch, setAnalyticsSearch] = useState<string>('');
  const [exportStartDate, setExportStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [exportEndDate, setExportEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [trackSelf, setTrackSelf] = useState<boolean>(() => JSON.parse(localStorage.getItem('trackSelf') || 'false'));
  const [trackSystemApps, setTrackSystemApps] = useState<boolean>(() => JSON.parse(localStorage.getItem('trackSystemApps') || 'false'));
  const [themePref, setThemePref] = useState<'system' | 'light' | 'dark'>(() => (localStorage.getItem('themePref') as 'system' | 'light' | 'dark') || 'system');
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('dark');
  const [dailyFocusGoal, setDailyFocusGoal] = useState<number>(() => parseInt(localStorage.getItem('dailyFocusGoal') || '4', 10));

  const effectiveTheme = themePref === 'system' ? systemTheme : themePref;

  useEffect(() => { localStorage.setItem('trackSelf', JSON.stringify(trackSelf)); }, [trackSelf]);
  useEffect(() => { localStorage.setItem('trackSystemApps', JSON.stringify(trackSystemApps)); }, [trackSystemApps]);
  useEffect(() => { localStorage.setItem('themePref', themePref); }, [themePref]);
  useEffect(() => { localStorage.setItem('dailyFocusGoal', dailyFocusGoal.toString()); }, [dailyFocusGoal]);

  useEffect(() => {
    const root = window.document.documentElement;
    
    root.classList.remove('light', 'dark');
    root.classList.add(effectiveTheme);
  }, [themePref, systemTheme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
    const handler = (e: MediaQueryListEvent) => setSystemTheme(e.matches ? 'dark' : 'light');
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (activeTab === 'analytics' && window.api && (window.api as any).getHistory) {
      if (Object.keys(historyData).length === 0) setIsAnalyticsLoading(true);
      (window.api as any).getHistory().then((data: any) => {
        setHistoryData(data);
        setIsAnalyticsLoading(false);
      });
    }
  }, [activeTab]);

  useEffect(() => {
    if (window.api && window.api.updatePreferences) {
      window.api.updatePreferences({ trackSelf, trackSystemApps });
    }
  }, [trackSelf, trackSystemApps]);

  const showToast = (title: string, message: string) => {
    toast.success(title, { description: message });
  };

  const handleContextMenu = (e: React.MouseEvent, appName: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, appName });
  };

  const executeIconRefresh = async () => {
    if (contextMenu && window.api && (window.api as any).refreshAppIcon) {
      const success = await (window.api as any).refreshAppIcon(contextMenu.appName);
      if (success) showToast('Icon Refreshed', `Successfully reloaded icon for ${contextMenu.appName}.`);
      else showToast('Refresh Failed', `Could not find executable for ${contextMenu.appName}.`);
    }
    setContextMenu(null);
  };

  const isAppValid = (appName: string) => {
    const lower = appName.toLowerCase();
    
    if (!trackSelf && (lower.includes('zeitra') || lower.includes('forgepulse') || lower.includes('electron') || lower.includes('app-tracker'))) {
      return false;
    }

    if (!trackSystemApps && (lower.includes('windows explorer') || lower.includes('searchhost') || lower.includes('startmenuexperiencehost') || lower.includes('taskmgr') || lower.includes('system idle process'))) {
      return false;
    }

    return true;
  };

  useEffect(() => {
    if (window.api && window.api.onWindowUpdate) {
      window.api.onWindowUpdate((data: WindowData) => {
        setActiveApp(data);
        setIsLoading(false); // Hide the loading screen as soon as the first payload arrives
      });
    }
  }, []);

  useEffect(() => {
    if (activeApp?.name && isAppValid(activeApp.name)) {
      setLastActiveValidApp(activeApp.name);
    }
  }, [activeApp?.name, trackSelf, trackSystemApps]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const handleExportCsv = async () => {
    let fullHistory = historyData;
    
    if (Object.keys(fullHistory).length === 0 && window.api && (window.api as any).getHistory) {
      fullHistory = await (window.api as any).getHistory();
    }
    
    const today = new Date().toISOString().split('T')[0];
    if (activeApp) {
      fullHistory = { ...fullHistory, [today]: activeApp.allUsage };
    }

    if (Object.keys(fullHistory).length === 0) return;

    const rows = [['Date', 'Application', 'Time Spent (seconds)', 'Formatted Time']];
    const dates = Object.keys(fullHistory)
      .filter(d => d >= exportStartDate && d <= exportEndDate)
      .sort((a, b) => b.localeCompare(a));
    
    if (dates.length === 0) {
      showToast('Export Failed', 'No usage data found for the selected date range.');
      return;
    }

    for (const date of dates) {
      const dayData = fullHistory[date];
      const apps = Object.entries(dayData).sort((a, b) => b[1] - a[1]);
      for (const [app, time] of apps) {
        if (time > 0 && isAppValid(app)) {
          rows.push([date, `"${app}"`, time.toString(), `"${formatTime(time)}"`]);
        }
      }
    }

    const csvContent = rows.map(e => e.join(",")).join("\n");
    if (window.api && (window.api as any).saveCsv) {
      const success = await (window.api as any).saveCsv(csvContent);
      if (success) {
        showToast('CSV Exported', 'Your complete history was successfully saved.');
      }
    }
  };

  const handleClearData = async () => {
    setShowClearConfirm(true);
  };

  const confirmClearData = async () => {
    setShowClearConfirm(false);
    if (window.api && (window.api as any).clearUsageData) {
      const success = await (window.api as any).clearUsageData();
      if (success) {
        showToast('Data Cleared', 'All usage history has been permanently deleted.');
      }
    }
  };

  const handlePresetChange = (preset: string) => {
    setDatePreset(preset);
    if (preset === 'custom') return;

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (preset === 'today') {
      setAnalyticsStartDate(todayStr);
      setAnalyticsEndDate(todayStr);
    } else if (preset === 'last7') {
      const last7 = new Date(today);
      last7.setDate(today.getDate() - 6);
      setAnalyticsStartDate(last7.toISOString().split('T')[0]);
      setAnalyticsEndDate(todayStr);
    } else if (preset === 'last30') {
      const last30 = new Date(today);
      last30.setDate(today.getDate() - 29);
      setAnalyticsStartDate(last30.toISOString().split('T')[0]);
      setAnalyticsEndDate(todayStr);
    } else if (preset === 'all') {
      const allDates = Object.keys(historyData).sort();
      const earliest = allDates.length > 0 ? allDates[0] : todayStr;
      setAnalyticsStartDate(earliest);
      setAnalyticsEndDate(todayStr);
    }
  };

  // Get ALL apps without .slice
  const dashboardData = activeApp
    ? Object.entries(activeApp.allUsage)
      .filter(([name, time]) => isAppValid(name) && time >= 60)
      .map(([name, time]) => ({ name, time }))
      .sort((a, b) => b.time - a.time)
    : [];

  const todayStr = new Date().toISOString().split('T')[0];
  const analyticsUsage: Record<string, number> = {};
  const allDates = Array.from(new Set([...Object.keys(historyData), todayStr]));
  allDates.forEach(date => {
    if (date >= analyticsStartDate && date <= analyticsEndDate) {
      const dayData = (date === todayStr && activeApp) ? activeApp.allUsage : (historyData[date] || {});
      for (const [app, time] of Object.entries(dayData)) {
        analyticsUsage[app] = (analyticsUsage[app] || 0) + time;
      }
    }
  });

  const analyticsChartData = Object.entries(analyticsUsage)
      .filter(([name, time]) => isAppValid(name) && (time as number) >= 60)
      .map(([name, time]) => ({ name, time: time as number }))
      .sort((a, b) => b.time - a.time);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const iconUrl = activeApp?.appIcons?.[label];
      return (
        <div className="bg-[var(--bg)]/95 backdrop-blur-3xl border border-[var(--panel-border)] p-4 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.3)] flex items-center gap-4">
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
    const val = payload?.value || '';
    const iconUrl = activeApp?.appIcons?.[val];
    const isActive = lastActiveValidApp === val;
    const text = val.length > 18 ? val.substring(0, 15) + '...' : val;
    return (
      <g transform={`translate(${x},${y})`} className="cursor-context-menu" onContextMenu={(e) => handleContextMenu(e, val)}>
        <text x="-40" y="4" textAnchor="end" fill={isActive ? "rgb(var(--a1))" : "var(--text)"} opacity={isActive ? "1" : "0.8"} fontSize="13" fontWeight="bold">
          {text}
        </text>
        {iconUrl && (
          <image href={iconUrl} xlinkHref={iconUrl} x="-30" y="-12" width="20" height="20" />
        )}
        {isActive && (
          <g transform="translate(-6, -2)">
            <circle cx="0" cy="0" r="4" fill="rgba(var(--a1), 0.3)">
              <animate attributeName="r" values="3;7;3" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0;1" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="0" cy="0" r="3" fill="rgb(var(--a1))" />
          </g>
        )}
      </g>
    );
  };

  const PIE_COLORS = ['rgb(var(--a1))', 'rgb(var(--a2))', 'rgba(var(--a1), 0.7)', 'rgba(var(--a2), 0.7)', 'rgba(var(--a1), 0.4)', 'rgba(var(--a2), 0.4)'];

  const categorizeApp = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('code') || n.includes('studio') || n.includes('terminal') || n.includes('git') || n.includes('idea')) return 'Development';
    if (n.includes('chrome') || n.includes('edge') || n.includes('firefox') || n.includes('brave') || n.includes('safari') || n.includes('opera')) return 'Browsing';
    if (n.includes('slack') || n.includes('discord') || n.includes('teams') || n.includes('zoom') || n.includes('mail') || n.includes('outlook') || n.includes('telegram')) return 'Communication';
    if (n.includes('spotify') || n.includes('netflix') || n.includes('youtube') || n.includes('steam') || n.includes('game') || n.includes('player') || n.includes('music')) return 'Entertainment';
    if (n.includes('word') || n.includes('excel') || n.includes('powerpoint') || n.includes('notion') || n.includes('obsidian') || n.includes('onenote') || n.includes('acrobat')) return 'Productivity';
    return 'Other';
  };

  const calculateProductivityScore = (data: {name: string, time: number}[]) => {
    let productiveTime = 0;
    let totalTime = 0;
    data.forEach(app => {
      totalTime += app.time;
      const cat = categorizeApp(app.name);
      if (cat === 'Development' || cat === 'Productivity') {
        productiveTime += app.time;
      } else if (cat === 'Communication') {
        productiveTime += (app.time * 0.5); // Half weight
      }
    });
    if (totalTime === 0) return 0;
    return Math.round((productiveTime / totalTime) * 100);
  };

  const categoryDataMap: Record<string, number> = {};
  analyticsChartData.forEach(app => {
    const cat = categorizeApp(app.name);
    categoryDataMap[cat] = (categoryDataMap[cat] || 0) + app.time;
  });
  
  const pieData = Object.entries(categoryDataMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const totalCategoryTime = pieData.reduce((sum, item) => sum + item.value, 0);

  const renderDashboard = () => {
    const mostUsedApp = dashboardData.length > 0 ? dashboardData[0] : null;
    const displayAppName = mostUsedApp ? mostUsedApp.name : "Waiting for data...";
    const totalTodayUptime = dashboardData.reduce((acc, curr) => acc + curr.time, 0);
    const displayTotalTime = formatTime(totalTodayUptime);

    const prodScore = calculateProductivityScore(dashboardData);
    const scoreColor = prodScore >= 75 ? 'text-emerald-400' : prodScore >= 40 ? 'text-[rgb(var(--a1))]' : 'text-amber-400';
    const goalSeconds = dailyFocusGoal * 3600;
    const progress = Math.min(1, totalTodayUptime / goalSeconds);

    const filteredChartData = dashboardData
      .filter(d => d.name.toLowerCase().includes(dashboardSearch.toLowerCase()))
      .sort((a, b) => {
        if (sortMode === 'duration') return b.time - a.time;
        return a.name.localeCompare(b.name);
      });

    return (
      <div ref={dashboardRef} className="flex flex-col h-full gap-4 sm:gap-6 lg:gap-8 max-w-7xl mx-auto w-full pb-4">
        <div className="stagger-item mb-2 flex flex-col md:flex-row justify-between items-start md:items-end gap-3 sm:gap-4" style={{ animationDelay: '0.05s' }}>
          <div>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-black mb-2 sm:mb-4 tracking-tighter bg-gradient-to-br from-[rgb(var(--a1))] via-[var(--text)] to-[rgb(var(--a2))] text-transparent bg-clip-text drop-shadow-[0_2px_15px_rgba(var(--a1),0.4)] font-['Acorn',_sans-serif]">
              Productivity Dashboard
            </h1>
            <p className="text-[var(--text)] opacity-70 text-sm sm:text-lg font-medium tracking-wide">Real-time application footprint analysis.</p>
          </div>
        </div>

        <div className="stagger-item grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 shrink-0" style={{ animationDelay: '0.15s' }}>
          <div className="bg-[var(--panel-bg)] backdrop-blur-3xl border border-[var(--panel-border)] p-4 sm:p-5 rounded-2xl sm:rounded-3xl flex items-center gap-3 sm:gap-4 hover:border-[rgba(var(--a1),0.4)] transition-all duration-300 shadow-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] cursor-context-menu" onContextMenu={(e) => handleContextMenu(e, displayAppName)}>
            <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-[var(--bg)] border border-[rgba(var(--a1),0.3)] flex items-center justify-center flex-shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_0_20px_rgba(var(--a1),0.2)] p-2">
              {activeApp?.appIcons?.[displayAppName] ? (
                <img src={activeApp.appIcons[displayAppName]} alt="Most Used App" className="max-w-[44px] max-h-[44px] object-contain drop-shadow-md" />
              ) : (
                <div className="w-8 h-8"><GenericAppIcon /></div>
              )}
              {lastActiveValidApp === displayAppName && (
                <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 shrink-0" title="Currently Active">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] border border-[var(--panel-bg)]"></span>
                </span>
              )}
            </div>
            <div className="flex flex-col justify-center overflow-hidden">
              <span className="text-[var(--text)] opacity-50 text-[10px] sm:text-xs mb-0.5 sm:mb-1 uppercase tracking-widest font-black">Most Used App</span>
              <span className="text-xl sm:text-2xl font-bold text-[rgb(var(--a1))] drop-shadow-[0_0_10px_rgba(var(--a1),0.3)] truncate">{displayAppName}</span>
            </div>
          </div>

          <div className="bg-[var(--panel-bg)] backdrop-blur-3xl border border-[var(--panel-border)] p-5 sm:p-6 rounded-2xl sm:rounded-3xl flex flex-col justify-center hover:border-[rgba(var(--a2),0.4)] transition-all duration-300 shadow-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
            <span className="text-[var(--text)] opacity-50 text-[10px] sm:text-xs mb-1 sm:mb-2 uppercase tracking-widest font-black">Total Today Uptime</span>
            <span className="text-3xl sm:text-4xl font-black text-[var(--text)] tracking-wider">
            {displayTotalTime}
            </span>
          </div>
        </div>

        <div className="stagger-item bg-[var(--panel-bg)] backdrop-blur-3xl border border-[var(--panel-border)] p-5 sm:p-6 lg:p-8 rounded-2xl lg:rounded-3xl flex-1 flex flex-col shadow-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] min-h-[350px] sm:min-h-[400px]" style={{ animationDelay: '0.25s' }}>
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 sm:mb-8 gap-4">
            <h2 className="text-lg sm:text-xl font-bold text-[var(--text)] tracking-wide">All App Footprints</h2>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto print:hidden">
              <div className="relative w-full md:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-[var(--text)] opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
                <Input
                  type="search"
                  placeholder="Search apps..."
                  value={dashboardSearch}
                  onChange={(e) => setDashboardSearch(e.target.value)}
                  className="pl-10 h-[42px] rounded-xl"
                />
              </div>
              <Select value={sortMode} onValueChange={(val) => setSortMode(val as 'duration' | 'alphabetical')}>
                <SelectTrigger className="w-full sm:w-[180px] bg-[var(--panel-bg)] border-[var(--panel-border)] rounded-xl px-4 py-5 text-sm text-[var(--text)] font-medium focus:ring-1 focus:ring-[rgb(var(--a1))] focus:border-[rgb(var(--a1))] transition-all shadow-inner outline-none">
                  <SelectValue placeholder="Sort apps" />
                </SelectTrigger>
                <SelectContent className="bg-[var(--panel-bg)] border-[var(--panel-border)] text-[var(--text)] backdrop-blur-3xl rounded-xl">
                  <SelectItem value="duration" className="cursor-pointer focus:bg-[rgba(var(--a1),0.15)] focus:text-[var(--text)]">Sort by Duration</SelectItem>
                  <SelectItem value="alphabetical" className="cursor-pointer focus:bg-[rgba(var(--a1),0.15)] focus:text-[var(--text)]">Sort A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex-1 w-full min-h-0 min-w-0 pr-4 overflow-y-auto custom-scrollbar">
            {filteredChartData.length > 0 ? (
              <div style={{ height: `${Math.max(300, filteredChartData.length * 60)}px` }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredChartData} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={<CustomYAxisTick />} width={180} />

                    <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} />

                    <Bar
                      dataKey="time"
                      radius={[0, 8, 8, 0]}
                      barSize={32}
                      isAnimationActive={true}
                      animationDuration={1200}
                      animationEasing="ease-out"
                      activeBar={{
                        stroke: 'rgb(var(--a1))',
                        strokeWidth: 2,
                        fill: 'rgba(var(--a1), 0.1)',
                        filter: 'drop-shadow(0 0 8px rgba(var(--a1), 0.5))',
                        cursor: 'pointer'
                      }}
                    >
                      {filteredChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? 'rgb(var(--a2))' : `rgba(var(--a1), ${Math.max(0.3, 1 - (index * 0.1))})`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-center opacity-50 text-[var(--text)]">
                <NoData className="w-64 h-64 opacity-40" />
                <p className="font-bold tracking-widest uppercase text-sm mt-4">No Application Data</p>
                <p className="text-xs mt-1">Start using some apps to see your footprint.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderAnalytics = () => {
    if (isAnalyticsLoading) {
      return (
        <div className="flex flex-col h-full gap-4 sm:gap-6 lg:gap-8 max-w-7xl mx-auto w-full pb-4 animate-in fade-in duration-300">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3 sm:gap-4 mb-2">
            <div className="flex flex-col gap-2 sm:gap-3">
              <div className="h-10 sm:h-14 w-64 sm:w-80 bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-2xl animate-pulse"></div>
              <div className="h-4 sm:h-6 w-48 sm:w-64 bg-[var(--panel-bg)] rounded-lg animate-pulse opacity-50"></div>
            </div>
            <div className="h-10 w-full sm:w-80 bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-xl animate-pulse"></div>
          </div>
          <div className="bg-[var(--panel-bg)] backdrop-blur-3xl border border-[var(--panel-border)] p-5 sm:p-6 lg:p-8 rounded-2xl lg:rounded-3xl flex-1 flex flex-col shadow-2xl min-h-[300px] sm:min-h-[400px]">
            <div className="h-6 sm:h-8 w-40 sm:w-48 bg-[var(--panel-border)] rounded-lg animate-pulse opacity-50 mb-6"></div>
            <div className="flex-1 w-full bg-[var(--panel-border)] rounded-2xl animate-pulse opacity-20"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 shrink-0">
            <div className="lg:col-span-8 flex flex-col gap-4 sm:gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 ml-2">
                <div className="h-6 w-48 bg-[var(--panel-border)] rounded-lg animate-pulse opacity-50"></div>
                <div className="h-9 w-56 bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-lg animate-pulse"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-[var(--panel-bg)] border border-[var(--panel-border)] p-4 sm:p-6 rounded-2xl lg:rounded-3xl flex items-center gap-4 sm:gap-5 shadow-lg">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-[var(--panel-border)] animate-pulse opacity-30 shrink-0"></div>
                    <div className="flex-1">
                      <div className="h-3 w-20 bg-[var(--panel-border)] rounded animate-pulse opacity-40 mb-3"></div>
                      <div className="h-6 w-32 bg-[var(--panel-border)] rounded animate-pulse opacity-60"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:col-span-4 bg-[var(--panel-bg)] border border-[var(--panel-border)] p-5 sm:p-6 rounded-2xl lg:rounded-3xl shadow-lg flex flex-col items-center min-h-[250px]">
              <div className="h-6 w-40 bg-[var(--panel-border)] rounded-lg animate-pulse opacity-50 mb-8 mt-2"></div>
              <div className="w-40 h-40 rounded-full bg-[var(--panel-border)] animate-pulse opacity-20"></div>
            </div>
          </div>
        </div>
      );
    }

    // Visualizing the actual top application times in the trend chart
    const realTrendData = analyticsChartData.slice(0, 7).map(app => ({
      name: app.name,
      time: app.time
    }));

    const filteredAnalyticsApps = analyticsChartData.filter(app => app.name.toLowerCase().includes(analyticsSearch.toLowerCase()));

    const getInsight = () => {
      if (pieData.length === 0) return "Not enough data to generate insights yet. Keep working!";
      const topCat = pieData[0];
      const percent = Math.round((topCat.value / totalCategoryTime) * 100);
      if (topCat.name === 'Entertainment' || topCat.name === 'Browsing') {
        return `You've spent ${percent}% of your tracked time on ${topCat.name}. Consider enabling Focus Mode to stay on track.`;
      }
      return `Great job! Your primary focus was ${topCat.name}, accounting for ${percent}% of your tracked time.`;
    };

    return (
      <div ref={analyticsRef} className="flex flex-col h-full gap-4 sm:gap-6 lg:gap-8 max-w-7xl mx-auto w-full pb-4">
        <div className="stagger-item flex flex-col md:flex-row justify-between items-start md:items-end gap-3 sm:gap-4 mb-2" style={{ animationDelay: '0.05s' }}>
          <div>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-black mb-2 sm:mb-4 tracking-tighter bg-gradient-to-br from-[rgb(var(--a1))] via-[var(--text)] to-[rgb(var(--a2))] text-transparent bg-clip-text drop-shadow-[0_2px_15px_rgba(var(--a1),0.4)] font-['Acorn',_sans-serif]">
              Usage Analytics
            </h1>
            <p className="text-[var(--text)] opacity-70 text-sm sm:text-lg font-medium tracking-wide">Deep dive into your focus trends.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full md:w-auto">
            <span className="text-[var(--text)] opacity-60 text-sm font-bold">Date Range:</span>
            <div className="flex items-center gap-1 sm:gap-2 bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-xl px-2 sm:px-3 py-1.5 shadow-inner w-full sm:w-auto overflow-x-auto custom-scrollbar">
              <Select value={datePreset} onValueChange={handlePresetChange}>
                <SelectTrigger className="bg-transparent border-none text-[rgb(var(--a1))] text-sm font-bold shadow-none focus:ring-0 p-0 h-auto gap-1">
                  <SelectValue placeholder="Select Date" />
                </SelectTrigger>
                <SelectContent className="bg-[var(--panel-bg)] border-[var(--panel-border)] text-[var(--text)] backdrop-blur-3xl rounded-xl">
                  <SelectItem value="today" className="cursor-pointer focus:bg-[rgba(var(--a1),0.15)] focus:text-[var(--text)]">Today</SelectItem>
                  <SelectItem value="last7" className="cursor-pointer focus:bg-[rgba(var(--a1),0.15)] focus:text-[var(--text)]">Last 7 Days</SelectItem>
                  <SelectItem value="last30" className="cursor-pointer focus:bg-[rgba(var(--a1),0.15)] focus:text-[var(--text)]">Last 30 Days</SelectItem>
                  <SelectItem value="all" className="cursor-pointer focus:bg-[rgba(var(--a1),0.15)] focus:text-[var(--text)]">All Time</SelectItem>
                  <SelectItem value="custom" className="cursor-pointer focus:bg-[rgba(var(--a1),0.15)] focus:text-[var(--text)]">Custom</SelectItem>
                </SelectContent>
              </Select>
              {datePreset === 'custom' && (
                <>
                  <div className="w-px h-4 bg-[var(--panel-border)] mx-1"></div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="bg-transparent text-sm text-[var(--text)] font-bold focus:outline-none cursor-pointer hover:bg-[var(--panel-border)] px-3 py-1.5 rounded-md transition-colors text-left min-w-[210px] flex items-center justify-center gap-2">
                        <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        {analyticsStartDate === analyticsEndDate 
                          ? format(new Date(analyticsStartDate + "T00:00:00"), "MMM d, yyyy")
                          : `${format(new Date(analyticsStartDate + "T00:00:00"), "MMM d, yyyy")} - ${format(new Date(analyticsEndDate + "T00:00:00"), "MMM d, yyyy")}`}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar 
                        mode="range" 
                        defaultMonth={(() => {
                          const d = new Date(analyticsStartDate + "T00:00:00");
                          d.setMonth(d.getMonth() - 1);
                          return d;
                        })()}
                        disabled={{ after: new Date() }}
                        selected={{ from: new Date(analyticsStartDate + "T00:00:00"), to: new Date(analyticsEndDate + "T00:00:00") }} 
                        onSelect={(range: any) => {
                          if (range?.from) {
                            const fromStr = `${range.from.getFullYear()}-${String(range.from.getMonth()+1).padStart(2,'0')}-${String(range.from.getDate()).padStart(2,'0')}`;
                            setAnalyticsStartDate(fromStr);
                            if (range.to) {
                              const toStr = `${range.to.getFullYear()}-${String(range.to.getMonth()+1).padStart(2,'0')}-${String(range.to.getDate()).padStart(2,'0')}`;
                              setAnalyticsEndDate(toStr);
                            } else {
                              setAnalyticsEndDate(fromStr);
                            }
                          }
                        }} 
                        initialFocus 
                        numberOfMonths={2}
                      />
                      <div className="p-3 border-t border-[var(--panel-border)]">
                        <button 
                          onClick={() => {
                            const t = new Date().toISOString().split('T')[0];
                            setAnalyticsStartDate(t);
                            setAnalyticsEndDate(t);
                            setDatePreset('today');
                          }}
                          className="w-full bg-[rgba(var(--a1),0.1)] hover:bg-[rgba(var(--a1),0.2)] text-[rgb(var(--a1))] text-sm font-bold py-2 rounded-lg transition-colors cursor-pointer"
                        >
                          Reset to Today
                        </button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="stagger-item bg-gradient-to-r from-[rgba(var(--a1),0.15)] to-transparent border border-[rgba(var(--a1),0.3)] p-4 sm:p-5 rounded-xl sm:rounded-2xl flex items-center gap-4 shadow-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] shrink-0" style={{ animationDelay: '0.1s' }}>
          <div className="w-10 h-10 rounded-full bg-[rgb(var(--a1))] flex items-center justify-center text-[var(--bg)] shadow-[0_0_15px_rgba(var(--a1),0.5)] shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          </div>
          <div>
            <h4 className="text-[var(--text)] font-bold text-sm sm:text-base tracking-wide">Smart Insight</h4>
            <p className="text-xs sm:text-sm text-[var(--text)] opacity-70 mt-0.5 font-medium">{getInsight()}</p>
          </div>
        </div>

        <div className="stagger-item bg-[var(--panel-bg)] backdrop-blur-3xl border border-[var(--panel-border)] p-5 sm:p-6 lg:p-8 rounded-2xl lg:rounded-3xl flex-1 flex flex-col shadow-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] min-h-[300px] sm:min-h-[350px]" style={{ animationDelay: '0.15s' }}>
          <h2 className="text-lg sm:text-xl font-bold text-[var(--text)] mb-4 sm:mb-6 tracking-wide">Screen Time Trends</h2>
          <div className="flex-1 w-full min-h-0 min-w-0">
            {realTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={realTrendData} margin={{ top: 10, right: 10, left: 15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTime" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="rgb(var(--a1))" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="rgb(var(--a1))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--panel-border)" vertical={false} />
                  <XAxis dataKey="name" tickFormatter={(val) => val.length > 12 ? val.substring(0, 12) + '...' : val} stroke="var(--panel-border)" tick={{ fill: 'var(--text)', opacity: 0.5, fontSize: 13, fontWeight: 'bold' }} tickLine={false} axisLine={false} dy={10} />
                  <YAxis tickFormatter={(val) => formatTime(val)} stroke="var(--panel-border)" tick={{ fill: 'var(--text)', opacity: 0.5, fontSize: 12, fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ stroke: 'var(--text)', opacity: 0.2, strokeWidth: 2, strokeDasharray: '4 4' }}
                    content={<CustomTooltip />}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="time" 
                    stroke="rgb(var(--a1))" 
                    strokeWidth={4} 
                    fillOpacity={1} 
                    fill="url(#colorTime)" 
                    isAnimationActive={true}
                    animationDuration={1200}
                    animationEasing="ease-out"
                    activeDot={{ r: 7, fill: 'rgb(var(--a2))', stroke: '#fff', strokeWidth: 2 }} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-center opacity-50 text-[var(--text)]">
                <NoData className="w-64 h-64 opacity-40" />
                <p className="font-bold tracking-widest uppercase text-sm mt-4">No Usage Data For This Range</p>
              </div>
            )}
          </div>
        </div>

        <div className="stagger-item grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 shrink-0" style={{ animationDelay: '0.25s' }}>
          <div className="lg:col-span-8 flex flex-col gap-4 sm:gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 ml-2">
              <h3 className="text-base sm:text-lg font-bold text-[var(--text)] tracking-wide">Top Applications</h3>
              <div className="relative w-full sm:w-64 print:hidden">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-[var(--text)] opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
                <Input
                  type="search"
                  placeholder="Search apps..."
                  value={analyticsSearch}
                  onChange={(e) => setAnalyticsSearch(e.target.value)}
                  className="pl-9 h-9 rounded-lg bg-[var(--bg)]"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 overflow-y-auto custom-scrollbar pr-2 max-h-[320px]">
              {filteredAnalyticsApps.map((app) => {
                const isActive = lastActiveValidApp === app.name;
                return (
                <div key={app.name} onContextMenu={(e) => handleContextMenu(e, app.name)} className={`bg-[var(--panel-bg)] backdrop-blur-3xl border p-4 sm:p-6 rounded-2xl sm:rounded-3xl flex items-center gap-4 sm:gap-5 shadow-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] transition-all cursor-context-menu ${isActive ? 'border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : 'border-[var(--panel-border)] hover:border-[rgba(var(--a1),0.3)]'}`}>
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-[var(--bg)] border flex items-center justify-center p-2.5 shadow-inner shrink-0 relative ${isActive ? 'border-emerald-500/50' : 'border-[var(--panel-border)]'}`}>
                    {activeApp?.appIcons?.[app.name] ? <img src={activeApp.appIcons[app.name]} className="object-contain max-w-full max-h-full drop-shadow-md" alt="" /> : <GenericAppIcon />}
                    {isActive && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 shrink-0" title="Currently Active">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] border border-[var(--panel-bg)]"></span>
                      </span>
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs text-[var(--text)] opacity-50 font-black uppercase tracking-widest truncate flex items-center gap-2">
                      {app.name}
                      {isActive && <span className="text-[9px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 tracking-wider">ACTIVE</span>}
                    </p>
                    <p className="text-xl font-black text-[rgb(var(--a1))] tracking-wide mt-1 truncate">{formatTime(app.time)} <span className="text-sm font-medium text-[var(--text)] opacity-40 lowercase">{analyticsStartDate === todayStr && analyticsEndDate === todayStr ? 'today' : 'total'}</span></p>
                  </div>
                </div>
              )})}
              {filteredAnalyticsApps.length === 0 && (
                <div className="col-span-1 md:col-span-2 bg-[var(--panel-bg)] backdrop-blur-xl border border-dashed border-[var(--panel-border)] p-6 rounded-3xl flex items-center justify-center shadow-lg min-h-[106px]">
                   <div className="w-full h-full flex flex-col items-center justify-center text-center opacity-50 text-[var(--text)]">
                    <NoData className="w-40 h-40 opacity-40" />
                    <p className="font-bold tracking-widest uppercase text-sm mt-4">No Apps Found</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="lg:col-span-4 bg-[var(--panel-bg)] backdrop-blur-3xl border border-[var(--panel-border)] p-5 sm:p-6 rounded-2xl lg:rounded-3xl shadow-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] flex flex-col min-h-[250px]">
            <h3 className="text-base sm:text-lg font-bold text-[var(--text)] tracking-wide mb-4 text-center">Category Breakdown</h3>
            <div className="flex-1 w-full min-h-[180px] relative">
              {pieData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value" stroke="none">
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        content={({ active, payload }: any) => {
                          if (active && payload && payload.length) {
                            const percent = totalCategoryTime > 0 
                              ? ((payload[0].value / totalCategoryTime) * 100).toFixed(1) 
                              : '0.0';
                            return (
                              <div className="bg-[var(--panel-bg)] backdrop-blur-3xl border border-[var(--panel-border)] p-3 rounded-xl shadow-2xl z-50">
                                <p className="text-[var(--text)] font-bold mb-1 text-sm tracking-wide">{payload[0].name}</p>
                                <p className="text-[rgb(var(--a2))] font-black text-xs tracking-widest">
                                  {formatTime(payload[0].value)} <span className="text-[var(--text)] opacity-60 ml-1">({percent}%)</span>
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-x-3 gap-y-2 mt-2">
                    {pieData.map((entry, index) => (
                      <div key={entry.name} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}></div>
                        <span className="text-[var(--text)] text-xs font-bold opacity-70">{entry.name}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center opacity-50 text-[var(--text)]">
                  <NoData className="w-32 h-32 opacity-40" />
                  <p className="font-bold tracking-widest uppercase text-xs mt-4">No Categories Found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSettings = () => (
    <div className="flex flex-col h-full gap-4 sm:gap-6 lg:gap-8 max-w-7xl mx-auto w-full pb-4">
      <div className="stagger-item shrink-0 mb-2 sm:mb-4" style={{ animationDelay: '0.05s' }}>
        <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-black mb-2 sm:mb-4 tracking-tighter bg-gradient-to-br from-[rgb(var(--a1))] via-[var(--text)] to-[rgb(var(--a2))] text-transparent bg-clip-text drop-shadow-[0_2px_15px_rgba(var(--a1),0.4)] font-['Acorn',_sans-serif]">
          Application Preferences
        </h1>
        <p className="text-[var(--text)] opacity-70 text-sm sm:text-lg font-medium tracking-wide">Customize your tracking and visual experience.</p>
      </div>

      <div className="stagger-item bg-[var(--panel-bg)] backdrop-blur-3xl border border-[var(--panel-border)] rounded-2xl lg:rounded-3xl shadow-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] flex-1 flex flex-col overflow-hidden" style={{ animationDelay: '0.15s' }}>
        <div className="p-5 sm:p-6 lg:p-8 pr-2 sm:pr-4 flex flex-col gap-8 sm:gap-10 overflow-y-auto custom-scrollbar h-full">
          <div className="flex flex-col gap-4">
            <h3 className="text-[var(--text)] font-bold text-lg sm:text-xl border-b border-[var(--panel-border)] pb-2 sm:pb-3 tracking-wide">Tracking Engine</h3>

            <div className="flex items-center justify-between bg-[var(--bg)] p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-[var(--panel-border)] shadow-inner">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[var(--panel-bg)] rounded-xl border border-[var(--panel-border)] shadow-inner">
                  <HardDrive className="w-6 h-6 text-[rgb(var(--a1))]" />
                </div>
                <div>
                  <h4 className="text-[var(--text)] font-bold text-sm sm:text-base tracking-wide">Track Windows System Apps</h4>
                  <p className="text-xs sm:text-sm text-[var(--text)] opacity-50 mt-0.5 sm:mt-1 max-w-lg font-medium">Include internal OS components like Windows Explorer and Search.</p>
                </div>
              </div>
              <Switch checked={trackSystemApps} onCheckedChange={setTrackSystemApps} />
            </div>

            <div className="flex items-center justify-between bg-[var(--bg)] p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-[var(--panel-border)] shadow-inner">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[var(--panel-bg)] rounded-xl border border-[var(--panel-border)] shadow-inner">
                  <Eye className="w-6 h-6 text-[rgb(var(--a2))]" />
                </div>
                <div>
                  <h4 className="text-[var(--text)] font-bold text-sm sm:text-base tracking-wide">Track Zeitra Usage</h4>
                  <p className="text-xs sm:text-sm text-[var(--text)] opacity-50 mt-0.5 sm:mt-1 max-w-lg font-medium">Include the time spent staring at this dashboard in your statistics.</p>
                </div>
              </div>
              <Switch checked={trackSelf} onCheckedChange={setTrackSelf} />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-[var(--bg)] p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-[var(--panel-border)] shadow-inner gap-4">
              <div>
                <h4 className="text-[var(--text)] font-bold text-sm sm:text-base tracking-wide">Daily Focus Goal</h4>
                <p className="text-xs sm:text-sm text-[var(--text)] opacity-50 mt-0.5 sm:mt-1 max-w-lg font-medium">Set a target for how many hours you want to be productive today.</p>
              </div>
              <div className="flex items-center justify-between bg-[var(--panel-bg)] border border-[var(--panel-border)] focus-within:border-[rgb(var(--a1))] transition-all rounded-xl px-2 py-1.5 w-full sm:w-36 shadow-inner shrink-0">
                <button type="button" onClick={() => setDailyFocusGoal(Math.max(1, dailyFocusGoal - 1))} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[rgba(var(--a1),0.15)] text-[var(--text)] font-bold transition-colors">-</button>
                <input type="number" min="1" max="24" value={dailyFocusGoal} onChange={(e) => setDailyFocusGoal(Number(e.target.value) || 1)} className="w-10 bg-transparent text-[rgb(var(--a1))] text-center font-black text-lg focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]" />
                <button type="button" onClick={() => setDailyFocusGoal(Math.min(24, dailyFocusGoal + 1))} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[rgba(var(--a1),0.15)] text-[var(--text)] font-bold transition-colors">+</button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="text-[var(--text)] font-bold text-lg sm:text-xl border-b border-[var(--panel-border)] pb-2 sm:pb-3 tracking-wide">Data Management</h3>

            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between bg-[var(--bg)] p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-[var(--panel-border)] shadow-inner gap-4">
              <div>
                <h4 className="text-[var(--text)] font-bold text-sm sm:text-base tracking-wide">Export Usage Data</h4>
                <p className="text-xs sm:text-sm text-[var(--text)] opacity-50 mt-0.5 sm:mt-1 max-w-lg font-medium">Download your application usage history as a CSV for external analysis.</p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full lg:w-auto shrink-0">
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="bg-[var(--panel-bg)] border border-[var(--panel-border)] text-xs sm:text-sm text-[var(--text)] font-bold focus:outline-none cursor-pointer hover:bg-[rgba(var(--a1),0.1)] px-3 sm:px-4 py-2 sm:py-3 rounded-xl transition-colors text-left min-w-[180px] sm:min-w-[210px] flex items-center justify-center gap-2 shadow-inner">
                      <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                      {exportStartDate === exportEndDate 
                        ? format(new Date(exportStartDate + "T00:00:00"), "MMM d, yyyy")
                        : `${format(new Date(exportStartDate + "T00:00:00"), "MMM d, yyyy")} - ${format(new Date(exportEndDate + "T00:00:00"), "MMM d, yyyy")}`}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar 
                      mode="range" 
                      defaultMonth={(() => {
                        const d = new Date(exportStartDate + "T00:00:00");
                        d.setMonth(d.getMonth() - 1);
                        return d;
                      })()}
                      disabled={{ after: new Date() }}
                      selected={{ from: new Date(exportStartDate + "T00:00:00"), to: new Date(exportEndDate + "T00:00:00") }} 
                      onSelect={(range: any) => {
                        if (range?.from) {
                          const fromStr = `${range.from.getFullYear()}-${String(range.from.getMonth()+1).padStart(2,'0')}-${String(range.from.getDate()).padStart(2,'0')}`;
                          setExportStartDate(fromStr);
                          if (range.to) {
                            const toStr = `${range.to.getFullYear()}-${String(range.to.getMonth()+1).padStart(2,'0')}-${String(range.to.getDate()).padStart(2,'0')}`;
                            setExportEndDate(toStr);
                          } else {
                            setExportEndDate(fromStr);
                          }
                        }
                      }} 
                      initialFocus 
                      numberOfMonths={2}
                    />
                    <div className="p-3 border-t border-[var(--panel-border)]">
                      <button 
                        onClick={() => {
                          const t = new Date().toISOString().split('T')[0];
                          setExportStartDate(t);
                          setExportEndDate(t);
                        }}
                        className="w-full bg-[rgba(var(--a1),0.1)] hover:bg-[rgba(var(--a1),0.2)] text-[rgb(var(--a1))] text-sm font-bold py-2 rounded-lg transition-colors cursor-pointer"
                      >
                        Reset to Today
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>
                <button 
                  onClick={handleExportCsv}
                  className="bg-[rgb(var(--a1))] hover:brightness-125 text-[var(--bg)] px-4 sm:px-6 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-black tracking-widest transition-all cursor-pointer shadow-[0_0_15px_rgba(var(--a1),0.4)] flex items-center justify-center gap-2 shrink-0"
                >
                  <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                  EXPORT CSV
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 pb-10">
            <h3 className="text-[var(--text)] font-bold text-lg sm:text-xl border-b border-[var(--panel-border)] pb-2 sm:pb-3 tracking-wide">Appearance Options</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {(['system', 'light', 'dark'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setThemePref(t)}
                  className={`flex items-center justify-center gap-2 sm:gap-3 p-4 sm:p-5 rounded-xl sm:rounded-2xl border transition-all duration-300 cursor-pointer ${themePref === t ? 'bg-[rgba(var(--a1),0.1)] border-[rgb(var(--a1))] shadow-[0_0_20px_rgba(var(--a1),0.3)] scale-[1.02]' : 'bg-[var(--panel-bg)] border-[var(--panel-border)] hover:border-[var(--text)] hover:shadow-lg'}`}
                >
                  {t === 'system' && <Monitor className="w-5 h-5 text-[var(--text)] opacity-80" />}
                  {t === 'light' && <Sun className="w-5 h-5 text-[var(--text)] opacity-80" />}
                  {t === 'dark' && <Moon className="w-5 h-5 text-[var(--text)] opacity-80" />}
                  <span className="font-bold tracking-wide text-[var(--text)] capitalize">{t} Mode</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="text-[var(--text)] font-bold text-lg sm:text-xl border-b border-[var(--panel-border)] pb-2 sm:pb-3 tracking-wide text-red-400">Danger Zone</h3>

            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between bg-red-500/5 p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-red-500/20 shadow-inner gap-4">
              <div>
                <h4 className="text-red-400 font-bold text-sm sm:text-base tracking-wide">Clear All Usage Data</h4>
                <p className="text-xs sm:text-sm text-red-400/70 mt-0.5 sm:mt-1 max-w-lg font-medium">Permanently delete all recorded application history and offline logs. This cannot be undone.</p>
              </div>
              <div className="flex gap-3 mt-2 lg:mt-0 w-full lg:w-auto">
                <button 
                  onClick={handleClearData}
                  className="bg-red-500 hover:brightness-125 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-black tracking-widest transition-all cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.4)] flex items-center justify-center w-full lg:w-auto gap-2"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={3} />
                  CLEAR DATA
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div
        className="h-screen flex overflow-hidden relative font-sans transition-colors duration-500 bg-background text-foreground"
      >
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[rgb(var(--a1))] rounded-full mix-blend-screen filter blur-[200px] opacity-[0.12] pointer-events-none transition-colors duration-500"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[rgb(var(--a2))] rounded-full mix-blend-screen filter blur-[200px] opacity-[0.12] pointer-events-none transition-colors duration-500"></div>
        
        {/* Sidebar Skeleton */}
        <div className="w-20 md:w-64 lg:w-72 shrink-0 bg-[var(--panel-bg)] border-r border-[var(--panel-border)] p-4 sm:p-6 lg:p-8 flex flex-col justify-between relative z-10 backdrop-blur-3xl shadow-2xl print:hidden animate-pulse transition-all duration-300">
          <div className="flex flex-col gap-8 md:gap-10">
            <div className="flex justify-center md:justify-start px-0 md:px-2">
              <div className="h-10 md:h-12 w-10 md:w-28 bg-[var(--panel-border)] opacity-50 rounded-lg"></div>
            </div>
            <nav className="flex flex-col gap-2 md:gap-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 md:h-14 w-full bg-[var(--panel-border)] opacity-30 rounded-xl"></div>
              ))}
            </nav>
          </div>
          <div className="flex flex-col gap-2 md:gap-4">
            <div className="h-12 md:h-14 w-full bg-[var(--panel-border)] opacity-30 rounded-xl"></div>
            <div className="h-10 md:h-14 w-full bg-[var(--panel-border)] opacity-30 rounded-2xl"></div>
          </div>
        </div>

        {/* Dashboard Skeleton */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto relative z-10 w-full h-full">
          <div className="flex flex-col h-full gap-4 sm:gap-6 lg:gap-8 max-w-7xl mx-auto w-full pb-4 animate-in fade-in duration-300">
            <div className="flex flex-col gap-2 sm:gap-3 mb-2">
              <div className="h-10 sm:h-14 w-64 sm:w-80 bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-2xl animate-pulse"></div>
              <div className="h-4 sm:h-6 w-48 sm:w-64 bg-[var(--panel-bg)] rounded-lg animate-pulse opacity-50"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 shrink-0">
              <div className="h-24 sm:h-28 bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-2xl lg:rounded-3xl animate-pulse"></div>
              <div className="h-24 sm:h-28 bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-2xl lg:rounded-3xl animate-pulse"></div>
            </div>
            <div className="bg-[var(--panel-bg)] backdrop-blur-3xl border border-[var(--panel-border)] p-5 sm:p-6 lg:p-8 rounded-2xl lg:rounded-3xl flex-1 flex flex-col shadow-2xl min-h-[300px] sm:min-h-[400px]">
              <div className="flex justify-between items-center mb-6 sm:mb-8 gap-4">
                <div className="h-6 sm:h-8 w-40 sm:w-48 bg-[var(--panel-border)] rounded-lg animate-pulse opacity-50"></div>
                <div className="h-10 w-80 bg-[var(--panel-border)] rounded-xl animate-pulse opacity-30 hidden md:block"></div>
              </div>
              <div className="flex-1 w-full bg-[var(--panel-border)] rounded-2xl animate-pulse opacity-20"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div
      className="h-screen flex overflow-hidden relative font-sans transition-colors duration-500 bg-background text-foreground"
    >
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[rgb(var(--a1))] rounded-full mix-blend-screen filter blur-[200px] opacity-[0.12] pointer-events-none transition-colors duration-500"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[rgb(var(--a2))] rounded-full mix-blend-screen filter blur-[200px] opacity-[0.12] pointer-events-none transition-colors duration-500"></div>

      <div className="w-20 md:w-64 lg:w-72 shrink-0 bg-[var(--panel-bg)] border-r border-[var(--panel-border)] p-4 sm:p-6 lg:p-8 flex flex-col justify-between relative z-10 backdrop-blur-3xl shadow-[20px_0_40px_rgba(0,0,0,0.1)] print:hidden transition-all duration-300">
        <div className="flex flex-col gap-8 md:gap-10">
          <div className="px-0 md:px-2 flex justify-center md:justify-start">
            <ZeitraLogo className="w-10 md:w-28 h-auto drop-shadow-[0_0_8px_rgba(var(--a1),0.5)] transition-all duration-300" />
          </div>

          <nav className="flex flex-col gap-2 md:gap-3">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center justify-center md:justify-start gap-0 md:gap-4 p-3 md:px-5 md:py-4 rounded-xl transition-all duration-300 cursor-pointer text-sm tracking-wide ${activeTab === 'dashboard' ? 'bg-[rgba(var(--a1),0.15)] text-[var(--text)] font-bold md:border-l-4 border-[rgb(var(--a1))] md:pl-4 shadow-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]' : 'text-[var(--text)] opacity-50 hover:bg-[var(--panel-bg)] hover:opacity-100 font-semibold'}`}
            >
              <LayoutDashboard className={`w-6 h-6 md:w-5 md:h-5 shrink-0 ${activeTab === 'dashboard' ? 'text-[rgb(var(--a1))] drop-shadow-md' : ''}`} />
              <span className="hidden md:block">Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center justify-center md:justify-start gap-0 md:gap-4 p-3 md:px-5 md:py-4 rounded-xl transition-all duration-300 cursor-pointer text-sm tracking-wide ${activeTab === 'analytics' ? 'bg-[rgba(var(--a1),0.15)] text-[var(--text)] font-bold md:border-l-4 border-[rgb(var(--a1))] md:pl-4 shadow-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]' : 'text-[var(--text)] opacity-50 hover:bg-[var(--panel-bg)] hover:opacity-100 font-semibold'}`}
            >
              <LineChart className={`w-6 h-6 md:w-5 md:h-5 shrink-0 ${activeTab === 'analytics' ? 'text-[rgb(var(--a1))] drop-shadow-md' : ''}`} />
              <span className="hidden md:block">Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab('controls')}
              className={`flex items-center justify-center md:justify-start gap-0 md:gap-4 p-3 md:px-5 md:py-4 rounded-xl transition-all duration-300 cursor-pointer text-sm tracking-wide ${activeTab === 'controls' ? 'bg-[rgba(var(--a2),0.15)] text-[var(--text)] font-bold md:border-l-4 border-[rgb(var(--a2))] md:pl-4 shadow-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]' : 'text-[var(--text)] opacity-50 hover:bg-[var(--panel-bg)] hover:opacity-100 font-semibold'}`}
            >
              <ShieldAlert className={`w-6 h-6 md:w-5 md:h-5 shrink-0 ${activeTab === 'controls' ? 'text-[rgb(var(--a2))] drop-shadow-md' : ''}`} />
              <span className="hidden md:block">Controls</span>
            </button>
          </nav>
        </div>

        <div className="flex flex-col gap-2 md:gap-4">
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center justify-center md:justify-start gap-0 md:gap-4 p-3 md:px-5 md:py-3 rounded-xl transition-all duration-300 cursor-pointer text-sm font-bold tracking-wide ${activeTab === 'settings' ? 'bg-[var(--panel-bg)] text-[var(--text)] md:border-l-4 border-[var(--text)] md:pl-4 shadow-md shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]' : 'text-[var(--text)] opacity-50 hover:bg-[var(--panel-bg)] hover:opacity-100 font-semibold'}`}
          >
            <Settings className="w-6 h-6 md:w-5 md:h-5 shrink-0" />
            <span className="hidden md:block">Settings</span>
          </button>

          <div className="flex items-center justify-center md:justify-start gap-0 md:gap-4 bg-transparent md:bg-[var(--bg)] border-none md:border border-[var(--panel-border)] rounded-2xl p-2 md:p-4 shadow-none md:shadow-inner transition-all duration-300">
            <div className="w-3 h-3 md:w-2.5 md:h-2.5 rounded-full bg-[rgb(var(--a1))] animate-pulse shadow-[0_0_8px_rgb(var(--a1))] shrink-0"></div>
            <span className="hidden md:block text-xs text-[var(--text)] opacity-80 font-bold tracking-widest uppercase truncate">Engine Live</span>
          </div>
        </div>
      </div>

      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto relative z-10 w-full h-full print:p-0 print:overflow-visible">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'analytics' && renderAnalytics()}
        {activeTab === 'settings' && renderSettings()}
        {activeTab === 'controls' && (
          <Controls
            isFocusMode={isFocusMode}
            setIsFocusMode={setIsFocusMode}
            blockList={blockList}
            setBlockList={setBlockList}
            availableApps={Array.from(new Set([
              ...Object.values(historyData).flatMap(day => Object.keys(day)),
              ...(activeApp ? Object.keys(activeApp.allUsage) : []),
              ...(activeApp ? Object.keys(activeApp.appIcons) : [])
            ])).filter(isAppValid).sort((a, b) => a.localeCompare(b))}
            allUsage={activeApp ? activeApp.allUsage : {}}
            appIcons={activeApp ? activeApp.appIcons : {}}
            onContextMenu={handleContextMenu}
            showToast={showToast}
          />
        )}
      </main>

      {/* Shadcn Sonner Toaster */}
      <Toaster theme={effectiveTheme as any} toastOptions={{ style: { background: 'var(--panel-bg)', color: 'var(--text)', border: '1px solid var(--panel-border)', backdropFilter: 'blur(20px)' }, className: 'font-sans font-medium' }} />

      {/* Custom Right-Click Context Menu */}
      <ContextMenu contextMenu={contextMenu} onClose={() => setContextMenu(null)} onRefreshIcon={executeIconRefresh} />

      {/* Confirmation Modal */}
      <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <DialogContent className="bg-[var(--panel-bg)] backdrop-blur-3xl border-[var(--panel-border)] p-8 rounded-3xl shadow-2xl flex flex-col gap-6 min-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-red-400 mb-2 flex items-center gap-3">
              <ShieldAlert className="w-6 h-6" />
              Clear All Data?
            </DialogTitle>
            <DialogDescription className="text-[var(--text)] opacity-70 text-sm font-medium leading-relaxed max-w-sm">
              This will permanently delete all recorded application history and offline logs. This action cannot be undone. Are you absolutely sure?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-3 mt-2">
            <button onClick={() => setShowClearConfirm(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-[var(--text)] opacity-70 hover:opacity-100 hover:bg-[var(--panel-border)] transition-all cursor-pointer">
              Cancel
            </button>
            <button onClick={confirmClearData} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-red-500 text-white hover:brightness-125 shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all cursor-pointer">
              Yes, Clear Data
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style>{`
        .stagger-item {
          opacity: 0;
          animation: staggerSlideIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes staggerSlideIn {
          0% { opacity: 0; transform: translateY(30px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        
        /* Custom Scrollbar for the application and target containers */
        ::-webkit-scrollbar, .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track, .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb, .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(150, 150, 150, 0.25);
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover, .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(150, 150, 150, 0.45);
        }
        
        .custom-date-picker::-webkit-calendar-picker-indicator {
          cursor: pointer;
          opacity: 0.6;
          transition: opacity 0.2s;
        }
        .custom-date-picker::-webkit-calendar-picker-indicator:hover {
          opacity: 1;
        }
      `}</style>

    </div>
  )
}

export default App