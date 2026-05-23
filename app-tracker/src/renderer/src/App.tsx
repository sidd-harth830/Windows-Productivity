import React, { useEffect, useState, useRef, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area, CartesianGrid, PieChart, Pie, Brush } from 'recharts'
import Controls from './components/Controls'
import ContextMenu from './components/ContextMenu'
import NoData from './components/NoData'
import { GenericAppIcon, ZeitraLogo, LayoutDashboard, LineChart, ShieldAlert, Settings, Download, Monitor, Sun, Moon, HardDrive, Eye, X, Flame, Play, Square, RefreshCw, Maximize2, Clock, Pin, PinOff } from './components/Icons'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './dialog'
import { Switch } from './switch'
import { Input } from './input'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { Calendar } from './calendar'
import { format } from 'date-fns'
import { Toaster, toast } from 'sonner'

interface WindowData {
  name: string; title: string;
  allUsage: Record<string, number>; appIcons: Record<string, string>;
  hourlyUsageToday?: Record<string, Record<string, number>>;
}

const MinusIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="5" y1="12" x2="19" y2="12"></line></svg>;

const App: React.FC = () => {
  // 1. All hooks declared cleanly at the top!
  const isMiniPlayer = window.location.hash === '#mini';
  const [activeTab, setActiveTab] = useState<'dashboard' | 'controls' | 'settings' | 'analytics'>('dashboard');
  const [activeApp, setActiveApp] = useState<WindowData | null>(null);
  const [lastActiveValidApp, setLastActiveValidApp] = useState<string | null>(null);
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [blockList, setBlockList] = useState<Record<string, 'fully_blocked' | number>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState<boolean>(false);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; appName: string } | null>(null);
  const [focusSessionActive, setFocusSessionActive] = useState<boolean>(false);
  const [focusSessionMinutes, setFocusSessionMinutes] = useState<number>(25);
  const [focusSessionTimeLeft, setFocusSessionTimeLeft] = useState<number>(25 * 60);
  const [isMiniPlayerAlwaysOnTop, setIsMiniPlayerAlwaysOnTop] = useState<boolean>(true);
  const [updateProgress, setUpdateProgress] = useState<number | null>(null);
  const [updateReady, setUpdateReady] = useState<boolean>(false);

  const dashboardRef = useRef<HTMLDivElement>(null);
  const analyticsRef = useRef<HTMLDivElement>(null);

  const [dashboardSearch, setDashboardSearch] = useState<string>('');
  const [sortMode, setSortMode] = useState<'duration' | 'alphabetical'>('duration');
  const [historyData, setHistoryData] = useState<Record<string, Record<string, number>>>({});
  const [hourlyHistoryData, setHourlyHistoryData] = useState<Record<string, Record<string, number>>>({});
  const [analyticsStartDate, setAnalyticsStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [analyticsEndDate, setAnalyticsEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [datePreset, setDatePreset] = useState<string>('today');
  const [analyticsSearch, setAnalyticsSearch] = useState<string>('');
  const [exportStartDate, setExportStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [exportEndDate, setExportEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [trackSelf, setTrackSelf] = useState<boolean>(() => JSON.parse(localStorage.getItem('trackSelf') || 'false'));
  const [trackSystemApps, setTrackSystemApps] = useState<boolean>(() => JSON.parse(localStorage.getItem('trackSystemApps') || 'false'));
  const [themePref, setThemePref] = useState<'system' | 'light' | 'dark'>(() => (localStorage.getItem('themePref') as 'system' | 'light' | 'dark') || 'system');
  const [miniPlayerThemePref, setMiniPlayerThemePref] = useState<'sync' | 'light' | 'dark'>(() => (localStorage.getItem('miniPlayerThemePref') as 'sync' | 'light' | 'dark') || 'sync');
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('dark');
  const [dailyFocusGoal, setDailyFocusGoal] = useState<number>(() => parseInt(localStorage.getItem('dailyFocusGoal') || '4', 10));
  const [hiddenApps, setHiddenApps] = useState<string[]>(() => JSON.parse(localStorage.getItem('hiddenApps') || '[]'));
  const [showIgnoredApps, setShowIgnoredApps] = useState<boolean>(() => JSON.parse(localStorage.getItem('showIgnoredApps') || 'false'));
  const [stopTrackingOnIdle, setStopTrackingOnIdle] = useState<boolean>(() => JSON.parse(localStorage.getItem('stopTrackingOnIdle') || 'true'));
  const [autoStart, setAutoStart] = useState<boolean>(false);

  const effectiveTheme = themePref === 'system' ? systemTheme : themePref;

  useEffect(() => { localStorage.setItem('trackSelf', JSON.stringify(trackSelf)); }, [trackSelf]);
  useEffect(() => { localStorage.setItem('trackSystemApps', JSON.stringify(trackSystemApps)); }, [trackSystemApps]);
  useEffect(() => { localStorage.setItem('themePref', themePref); }, [themePref]);
  useEffect(() => { localStorage.setItem('miniPlayerThemePref', miniPlayerThemePref); }, [miniPlayerThemePref]);
  useEffect(() => { localStorage.setItem('dailyFocusGoal', dailyFocusGoal.toString()); }, [dailyFocusGoal]);
  useEffect(() => { localStorage.setItem('hiddenApps', JSON.stringify(hiddenApps)); }, [hiddenApps]);
  useEffect(() => { localStorage.setItem('showIgnoredApps', JSON.stringify(showIgnoredApps)); }, [showIgnoredApps]);
  useEffect(() => { localStorage.setItem('stopTrackingOnIdle', JSON.stringify(stopTrackingOnIdle)); }, [stopTrackingOnIdle]);

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove('light', 'dark');
    if (isMiniPlayer) {
      root.classList.add(miniPlayerThemePref === 'sync' ? effectiveTheme : miniPlayerThemePref);
    } else {
      root.classList.add(effectiveTheme);
    }
  }, [themePref, systemTheme, miniPlayerThemePref, isMiniPlayer]);

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
        if (data && data.daily) {
          setHistoryData(data.daily);
          setHourlyHistoryData(data.hourly || {});
        } else {
          setHistoryData(data);
        }
        setIsAnalyticsLoading(false);
      });
    }
  }, [activeTab]);

  useEffect(() => {
    if (window.api && window.api.updatePreferences) {
      window.api.updatePreferences({ trackSelf, trackSystemApps, hiddenApps, stopTrackingOnIdle });
    }
  }, [trackSelf, trackSystemApps, hiddenApps, stopTrackingOnIdle]);

  useEffect(() => {
    if (window.api && (window.api as any).getAutoStartStatus) {
      (window.api as any).getAutoStartStatus().then(setAutoStart);
    }
  }, []);

  useEffect(() => {
    if (window.api && (window.api as any).onSyncFocusMode) {
      (window.api as any).onSyncFocusMode((enabled: boolean) => {
        setIsFocusMode(enabled);
        if (enabled) {
          toast.success('Focus Mode Enabled', { description: 'Toggled via System Tray.' });
        } else {
          toast.info('Focus Mode Disabled', { description: 'Toggled via System Tray.' });
        }
      });
    }
  }, []);

  useEffect(() => {
    if (window.api && (window.api as any).onUpdateProgress) {
      (window.api as any).onUpdateProgress((percent: number) => {
        setUpdateProgress(percent);
      });
      (window.api as any).onUpdateComplete(() => {
        setUpdateProgress(100);
        setUpdateReady(true);
        toast.success('Update Ready', { description: 'Restart the application to apply the latest updates.' });
      });
    }
  }, []);

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

  const handleOpenLocation = async () => {
    if (contextMenu && window.api && (window.api as any).openFileLocation) {
      const success = await (window.api as any).openFileLocation(contextMenu.appName);
      if (!success) {
        showToast('Action Failed', `Could not find executable path for ${contextMenu.appName}.`);
      }
    }
    setContextMenu(null);
  };

  const handleHideApp = () => {
    if (contextMenu) {
      setHiddenApps(prev => {
        if (!prev.includes(contextMenu.appName)) return [...prev, contextMenu.appName];
        return prev;
      });
      showToast('App Hidden', `${contextMenu.appName} will no longer be tracked globally.`);
    }
    setContextMenu(null);
  };

  const isAppValid = (appName: string) => {
    if (hiddenApps.includes(appName) && !showIgnoredApps) return false;
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
    if (window.api) {
      // 1. Get all initial data on startup
      (window.api as any).getInitialData().then((data: any) => {
        setActiveApp({
          name: '', // No active app initially
          title: '',
          allUsage: data.allUsage,
          appIcons: data.appIcons
        });
        if (data.hourlyUsageToday) {
          setHourlyHistoryData(prev => ({
            ...prev,
            ...data.hourlyUsageToday
          }));
        }
        setBlockList(data.blockList);
        setIsFocusMode(data.isFocusMode);
        setIsLoading(false); // Data is loaded, show UI
      });

      // 2. Listen for periodic, smaller updates
      window.api.onWindowUpdate((data: WindowData) => {
        setActiveApp(prev => {
          if (!prev) return null; // Should not happen after initial load
          return {
            ...prev,
            name: data.name,
            title: data.title,
            allUsage: data.allUsage,
          };
        });
        if (data.hourlyUsageToday) {
          setHourlyHistoryData(prev => ({
            ...prev,
            ...data.hourlyUsageToday
          }));
        }
      });

      // 3. Listen for individual icon updates to merge them in
      (window.api as any).onIconUpdate((data: { appName: string; icon: string }) => {
        setActiveApp(prev => {
          if (!prev) return null;
          return { ...prev, appIcons: { ...prev.appIcons, [data.appName]: data.icon } };
        });
      });
    }
  }, []);
  useEffect(() => {
    if (activeApp?.name && isAppValid(activeApp.name)) {
      setLastActiveValidApp(activeApp.name);
    }
  }, [activeApp?.name, trackSelf, trackSystemApps, hiddenApps]);

  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      oscillator.frequency.exponentialRampToValueAtTime(1046.50, audioCtx.currentTime + 0.1); // C6
      
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);

      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.8);
    } catch (e) {
      console.error("Audio playback failed", e);
    }
  };

  useEffect(() => {
    if (window.api && window.api.onFocusTimerTick) {
      window.api.onFocusTimerTick((data: { active: boolean, timeLeft: number, total: number }) => {
        if (focusSessionActive && !data.active && data.timeLeft === 0) {
          showToast('Session Complete', 'Great job! Take a short break to recharge.');
          playChime();
        }
        setFocusSessionActive(data.active);
        setFocusSessionTimeLeft(data.timeLeft);
        if (data.total > 0 && !data.active) setFocusSessionMinutes(Math.floor(data.total / 60));
      });
    }
  }, [focusSessionActive, focusSessionTimeLeft]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatCountdown = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const toggleFocusSession = () => {
    if (!focusSessionActive) {
      if (window.api && (window.api as any).startFocusTimer) (window.api as any).startFocusTimer(focusSessionMinutes);
      if (!isFocusMode) {
        setIsFocusMode(true);
        if (window.api && (window.api as any).toggleFocusMode) (window.api as any).toggleFocusMode(true);
        showToast('Deep Focus Engaged', 'Focus Mode auto-enabled to protect your session.');
      } else {
        showToast('Deep Focus Started', 'Stay on task. You got this!');
      }
    } else {
      if (window.api && (window.api as any).stopFocusTimer) (window.api as any).stopFocusTimer();
    }
  };

  const handleExportCsv = async () => {
    let fullHistory = historyData;

    if (Object.keys(fullHistory).length === 0 && window.api && (window.api as any).getHistory) {
      const history = await (window.api as any).getHistory();
      fullHistory = history.daily ? history.daily : history;
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

  const handleCheckForUpdates = async () => {
    if (updateReady) {
      showToast('Restart Required', 'Please close and restart the application to apply the update.');
      return;
    }

    if (window.api && (window.api as any).checkForUpdates) {
      showToast('Checking for Updates', 'Contacting the server to find new versions...');
      const result = await (window.api as any).checkForUpdates();
      if (!result) {
        setTimeout(() => toast.info('Up to Date', { description: 'You are currently running the latest version.' }), 1500);
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

  const handleAutoStartToggle = (checked: boolean) => {
    setAutoStart(checked);
    if (window.api && (window.api as any).toggleAutoStart) (window.api as any).toggleAutoStart(checked);
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
    const isIgnored = hiddenApps.includes(val);
    const text = val.length > 18 ? val.substring(0, 15) + '...' : val;
    return (
      <g transform={`translate(${x},${y})`} className="cursor-context-menu" onContextMenu={(e) => handleContextMenu(e, val)}>
        <text x="-40" y="4" textAnchor="end" fill={isActive ? "rgb(var(--a1))" : (isIgnored ? "var(--panel-border)" : "var(--text)")} opacity={isActive ? "1" : (isIgnored ? "0.4" : "0.8")} fontSize="13" fontWeight="bold" textDecoration={isIgnored ? "line-through" : "none"}>
          {text}
        </text>
        {iconUrl && (
          <g>
            <image href={iconUrl} xlinkHref={iconUrl} x="-30" y="-12" width="20" height="20" opacity={isIgnored ? "0.4" : "1"} />
            {isIgnored && (
              <>
                <circle cx="-20" cy="-2" r="7" fill="var(--panel-bg)" stroke="#ef4444" strokeWidth="1.5" />
                <path d="M-22,-4 L-18,0 M-18,-4 L-22,0" stroke="#ef4444" strokeWidth="1.5" />
              </>
            )}
          </g>
        )}
      </g>
    );
  };

  const CustomXAxisTick = ({ x, y, payload }: any) => {
    const val = payload?.value || '';
    const isIgnored = hiddenApps.includes(val);
    const text = val.length > 12 ? val.substring(0, 12) + '...' : val;
    return (
      <g transform={`translate(${x},${y})`} className="cursor-default">
        <text x={0} y={0} dy={16} textAnchor="middle" fill={isIgnored ? "var(--panel-border)" : "var(--text)"} opacity={isIgnored ? "0.4" : "0.6"} fontSize="12" fontWeight="bold" textDecoration={isIgnored ? "line-through" : "none"}>
          {text}
        </text>
      </g>
    );
  };

  const PIE_COLORS = [
    'rgb(var(--a1))',
    'rgb(var(--a2))',
    'rgba(var(--a1), 0.75)',
    'rgba(var(--a2), 0.75)',
    'rgba(var(--a1), 0.45)',
    'rgba(var(--a2), 0.45)',
    'rgba(var(--text), 0.3)'
  ];

  const categorizeApp = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('code') || n.includes('studio') || n.includes('terminal') || n.includes('git') || n.includes('idea')) return 'Development';
    if (n.includes('chrome') || n.includes('edge') || n.includes('firefox') || n.includes('brave') || n.includes('safari') || n.includes('opera')) return 'Browsing';
    if (n.includes('slack') || n.includes('discord') || n.includes('teams') || n.includes('zoom') || n.includes('mail') || n.includes('outlook') || n.includes('telegram')) return 'Communication';
    if (n.includes('spotify') || n.includes('netflix') || n.includes('youtube') || n.includes('steam') || n.includes('game') || n.includes('player') || n.includes('music')) return 'Entertainment';
    if (n.includes('word') || n.includes('excel') || n.includes('powerpoint') || n.includes('notion') || n.includes('obsidian') || n.includes('onenote') || n.includes('acrobat')) return 'Productivity';
    return 'Other';
  };

  const calculateProductivityScore = (data: { name: string, time: number }[]) => {
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

  const calculateProductivityScoreForDay = (dayData: Record<string, number>) => {
    let prodTime = 0;
    let total = 0;
    Object.entries(dayData).forEach(([app, time]) => {
      total += time;
      const cat = categorizeApp(app);
      if (cat === 'Development' || cat === 'Productivity') prodTime += time;
      else if (cat === 'Communication') prodTime += (time * 0.5);
    });
    if (total === 0) return 0;
    return Math.round((prodTime / total) * 100);
  };

  const categoryDataMap: Record<string, { value: number; apps: { name: string; time: number }[] }> = {};
  analyticsChartData.forEach(app => {
    const cat = categorizeApp(app.name);
    if (!categoryDataMap[cat]) categoryDataMap[cat] = { value: 0, apps: [] };
    categoryDataMap[cat].value += app.time;
    categoryDataMap[cat].apps.push({ name: app.name, time: app.time });
  });

  const pieData = Object.entries(categoryDataMap)
    .map(([name, data]) => ({ name, value: data.value, apps: data.apps.sort((a, b) => b.time - a.time) }))
    .sort((a, b) => b.value - a.value);

  const totalCategoryTime = pieData.reduce((sum, item) => sum + item.value, 0);

  const heatmapDays: { dateStr: string, score: number, hasData: boolean, isFuture: boolean }[] = [];
  const currentDayOfWeek = new Date().getDay();
  const daysToPadAtEnd = 6 - currentDayOfWeek;
  const totalCells = 16 * 7; // 16 Weeks

  for (let i = totalCells - 1 - daysToPadAtEnd; i >= -daysToPadAtEnd; i--) {
    if (i < 0) {
      heatmapDays.push({ dateStr: '', score: 0, hasData: false, isFuture: true });
    } else {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const dayData = (dStr === todayStr && activeApp) ? activeApp.allUsage : (historyData[dStr] || {});
      const score = calculateProductivityScoreForDay(dayData);
      const hasData = Object.keys(dayData).length > 0;
      heatmapDays.push({ dateStr: dStr, score, hasData, isFuture: false });
    }
  }

  // Advanced Streak Calculator
  const currentStreak = useMemo(() => {
    let streak = 0;
    const goalSeconds = dailyFocusGoal * 3600;
    const d = new Date();
    const todayStr = d.toISOString().split('T')[0];
    const todayData = activeApp ? activeApp.allUsage : (historyData[todayStr] || {});
    const todayUptime = Object.values(todayData).reduce((a, b) => (a as number) + (b as number), 0) as number;
    
    let dayOffset = 0;
    if (todayUptime >= goalSeconds) {
      streak++;
      dayOffset = 1;
    } else {
      // If goal isn't met today yet, check if it was met yesterday to keep streak alive
      let yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      let yStr = yesterday.toISOString().split('T')[0];
      let yUptime = Object.values(historyData[yStr] || {}).reduce((a, b) => (a as number) + (b as number), 0) as number;
      if (yUptime < goalSeconds) return 0; // Streak broken
      dayOffset = 1;
    }
    
    for (let i = dayOffset; i < 365; i++) {
      let pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - i);
      let uptime = Object.values(historyData[pastDate.toISOString().split('T')[0]] || {}).reduce((a, b) => (a as number) + (b as number), 0) as number;
      if (uptime >= goalSeconds) streak++;
      else break;
    }
    return streak;
  }, [historyData, activeApp, dailyFocusGoal]);

  const getStreakRank = (streak: number) => {
    if (streak >= 30) return { title: 'Legend', color: 'text-purple-400 drop-shadow-[0_0_5px_rgba(192,132,252,0.5)]' };
    if (streak >= 7) return { title: 'Master', color: 'text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]' };
    if (streak >= 3) return { title: 'Pro', color: 'text-blue-400 drop-shadow-[0_0_5px_rgba(96,165,250,0.5)]' };
    return { title: 'Novice', color: 'text-[var(--text)] opacity-60' };
  };
  const currentRank = getStreakRank(currentStreak);

  // Weekly Productivity Summary
  useEffect(() => {
    if (Object.keys(historyData).length === 0) return;

    const lastSummary = localStorage.getItem('lastWeeklySummaryDate');
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const lastSummaryDate = lastSummary ? new Date(lastSummary) : null;
    const daysSinceLast = lastSummaryDate ? (today.getTime() - lastSummaryDate.getTime()) / (1000 * 3600 * 24) : 7;

    if (daysSinceLast >= 7) {
      let totalTime = 0;
      let prodTime = 0;
      for (let i = 1; i <= 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dStr = d.toISOString().split('T')[0];
        const dayData = historyData[dStr] || {};
        
        Object.entries(dayData).forEach(([app, time]) => {
          totalTime += time;
          const cat = categorizeApp(app);
          if (cat === 'Development' || cat === 'Productivity') prodTime += time;
          else if (cat === 'Communication') prodTime += (time * 0.5);
        });
      }

      if (totalTime > 0) {
        const score = Math.round((prodTime / totalTime) * 100);
        const title = "Weekly Productivity Summary 📊";
        const body = `You achieved a ${score}% productivity score over the last 7 days. ${score >= 60 ? 'Fantastic work!' : 'Let us aim higher next week!'}`;
        
        showToast(title, body);
        if (window.api && (window.api as any).showNotification) {
          (window.api as any).showNotification(title, body);
        }
        
        localStorage.setItem('lastWeeklySummaryDate', todayStr);
      } else if (!lastSummary) {
        localStorage.setItem('lastWeeklySummaryDate', todayStr);
      }
    }
  }, [historyData]);

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
      <div ref={dashboardRef} className="flex flex-col min-h-full gap-6 sm:gap-8 lg:gap-10 max-w-7xl mx-auto w-full pb-10">
        <div className="stagger-item mb-2 flex flex-col md:flex-row justify-between items-start md:items-end gap-3 sm:gap-4" style={{ animationDelay: '0.05s' }}>
          <div>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-black mb-2 sm:mb-4 tracking-tighter bg-gradient-to-br from-[rgb(var(--a1))] via-[var(--text)] to-[rgb(var(--a2))] text-transparent bg-clip-text drop-shadow-[0_2px_15px_rgba(var(--a1),0.4)] font-['Acorn',_sans-serif]">
              Productivity Dashboard
            </h1>
            <p className="text-[var(--text)] opacity-70 text-sm sm:text-lg font-medium tracking-wide">Real-time application footprint analysis.</p>
          </div>
          <div className="flex items-center gap-3 bg-[var(--panel-bg)] border border-[var(--panel-border)] px-4 py-2 rounded-2xl shadow-inner mb-1">
            <div className="flex items-center gap-2 border-r border-[var(--panel-border)] pr-3">
              <Flame className={`w-5 h-5 ${currentStreak > 0 ? 'text-orange-500 animate-pulse drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]' : 'text-[var(--text)] opacity-40'}`} />
              <div className="flex flex-col">
                <span className="text-sm font-black text-[var(--text)] leading-none">{currentStreak} <span className="opacity-50 text-xs font-bold tracking-widest uppercase ml-1">Day Streak</span></span>
              </div>
            </div>
            <div className={`text-xs font-black uppercase tracking-widest ${currentRank.color}`}>
              {currentRank.title}
            </div>
          </div>
        </div>

        <div className="stagger-item grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 shrink-0" style={{ animationDelay: '0.15s' }}>
          <div className="bg-[var(--panel-bg)] backdrop-blur-3xl border border-[var(--panel-border)] p-5 sm:p-6 rounded-2xl sm:rounded-3xl flex items-center gap-4 hover:border-[rgba(var(--a1),0.4)] transition-all duration-300 shadow-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] cursor-context-menu" onContextMenu={(e) => handleContextMenu(e, displayAppName)}>
            <div className="relative w-14 h-14 rounded-2xl bg-[var(--bg)] border border-[rgba(var(--a1),0.3)] flex items-center justify-center flex-shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_0_20px_rgba(var(--a1),0.2)] p-2.5">
              {activeApp?.appIcons?.[displayAppName] ? (
                <img src={activeApp.appIcons[displayAppName]} alt="Most Used App" className="max-w-full max-h-full object-contain drop-shadow-md" />
              ) : (
                <div className="w-8 h-8"><GenericAppIcon /></div>
              )}
              {lastActiveValidApp === displayAppName && (
                <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 shrink-0" title="Currently Active">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] border border-[var(--panel-bg)]"></span>
                </span>
              )}
            </div>
            <div className="flex flex-col justify-center overflow-hidden">
              <span className="text-[var(--text)] opacity-50 text-xs mb-1 uppercase tracking-widest font-black">Most Used App</span>
              <span className="text-2xl font-bold text-[rgb(var(--a1))] drop-shadow-[0_0_10px_rgba(var(--a1),0.3)] truncate">{displayAppName}</span>
            </div>
          </div>

          <div className="bg-[var(--panel-bg)] backdrop-blur-3xl border border-[var(--panel-border)] p-5 sm:p-6 rounded-2xl sm:rounded-3xl flex items-center gap-4 hover:border-[rgba(var(--a2),0.4)] transition-all duration-300 shadow-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
            <div className="relative w-14 h-14 rounded-2xl bg-[var(--bg)] border border-[rgba(var(--a2),0.3)] flex items-center justify-center flex-shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_0_20px_rgba(var(--a2),0.2)] p-3">
              <svg className="w-full h-full text-[rgb(var(--a2))]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-[var(--text)] opacity-50 text-xs mb-1 uppercase tracking-widest font-black">Today's Uptime</span>
              <span className="text-2xl font-black text-[var(--text)] tracking-wider">
                {displayTotalTime}
              </span>
            </div>
          </div>

          <div className="bg-[var(--panel-bg)] backdrop-blur-3xl border border-[var(--panel-border)] p-5 sm:p-6 rounded-2xl sm:rounded-3xl flex items-center gap-4 hover:border-[rgba(var(--a1),0.4)] transition-all duration-300 shadow-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
            <div className="relative w-14 h-14 rounded-2xl bg-[var(--bg)] border border-[rgba(var(--a1),0.3)] flex items-center justify-center flex-shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_0_20px_rgba(var(--a1),0.2)] p-3">
              <svg className="w-full h-full text-[rgb(var(--a1))]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
            </div>
            <div className="flex flex-col justify-center w-full">
              <div className="flex justify-between items-end mb-1.5">
                <span className="text-[var(--text)] opacity-50 text-xs uppercase tracking-widest font-black">Prod. Score</span>
                <span className={`text-sm font-black ${scoreColor}`}>{prodScore}%</span>
              </div>
              <div className="w-full bg-[var(--panel-border)] rounded-full h-2.5 overflow-hidden shadow-inner">
                <div className={`h-full rounded-full transition-all duration-1000 ease-out ${prodScore >= 75 ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]' : prodScore >= 40 ? 'bg-[rgb(var(--a1))] shadow-[0_0_10px_rgba(var(--a1),0.5)]' : 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]'}`} style={{ width: `${prodScore}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="stagger-item grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 shrink-0" style={{ animationDelay: '0.25s' }}>
          <div className="lg:col-span-8 bg-[var(--panel-bg)] backdrop-blur-3xl border border-[var(--panel-border)] p-5 sm:p-6 lg:p-8 rounded-2xl lg:rounded-3xl flex flex-col shadow-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] min-h-[350px] sm:min-h-[400px]">
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
            <div className="flex-1 w-full min-h-0 min-w-0 pr-2 sm:pr-4 overflow-y-auto overflow-x-hidden custom-scrollbar">
              {filteredChartData.length > 0 ? (
                <div className="w-full relative" style={{ height: `${Math.max(300, filteredChartData.length * 60)}px` }}>
                  <div className="absolute inset-0">
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
                          activeBar={{ stroke: 'rgb(var(--a1))', strokeWidth: 2, fill: 'rgba(var(--a1), 0.1)', filter: 'drop-shadow(0 0 8px rgba(var(--a1), 0.5))', cursor: 'pointer' }}
                        >
                          {filteredChartData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? 'rgb(var(--a2))' : `rgba(var(--a1), ${Math.max(0.3, 1 - (index * 0.1))})`} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
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

          <div className="lg:col-span-4 bg-[var(--panel-bg)] backdrop-blur-3xl border border-[var(--panel-border)] p-5 sm:p-6 lg:p-8 rounded-2xl lg:rounded-3xl flex flex-col items-center relative overflow-hidden hover:border-[rgba(var(--a1),0.4)] transition-all duration-300 shadow-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] min-h-[350px] sm:min-h-[400px]">

            <div className="flex w-full items-center justify-between mb-8 z-10">
              <div className="flex items-center gap-2">
                <Flame className={`w-5 h-5 sm:w-6 sm:h-6 ${focusSessionActive ? 'text-[rgb(var(--a1))] animate-pulse' : 'text-[var(--text)] opacity-50'}`} />
                <h3 className="font-bold text-lg sm:text-xl text-[var(--text)] tracking-wide">Deep Focus</h3>
              </div>
              <button
                onClick={() => {
                  if ((window as any).electron) (window as any).electron.ipcRenderer.send('open-mini-player');
                  else if ((window as any).api && (window as any).api.openMiniPlayer) (window as any).api.openMiniPlayer();
                }}
                className="p-2 bg-[var(--bg)] border border-[var(--panel-border)] hover:bg-[rgba(var(--a1),0.1)] hover:border-[rgb(var(--a1))] text-[var(--text)] opacity-70 hover:opacity-100 hover:text-[rgb(var(--a1))] transition-all rounded-xl shadow-inner"
                title="Open Mini Player"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>

            <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center shrink-0 mb-8 z-10 flex-1">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 drop-shadow-[0_0_12px_rgba(var(--a1),0.3)]">
                <circle cx="50" cy="50" r="45" stroke="var(--panel-border)" strokeWidth="4" fill="transparent" />
                <circle cx="50" cy="50" r="45" stroke="rgb(var(--a1))" strokeWidth="6" fill="transparent" strokeDasharray="282.7" strokeDashoffset={282.7 - ((focusSessionActive ? focusSessionTimeLeft / (focusSessionMinutes * 60) : 1) * 282.7)} className="transition-all duration-1000 linear" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl sm:text-5xl font-black text-[var(--text)] tracking-tight tabular-nums">
                  {focusSessionActive ? formatCountdown(focusSessionTimeLeft) : formatCountdown(focusSessionMinutes * 60)}
                </span>
                {!focusSessionActive && (
                  <div className="flex items-center gap-4 mt-3">
                    <button onClick={() => setFocusSessionMinutes(Math.max(5, focusSessionMinutes - 5))} className="text-[var(--text)] opacity-50 hover:opacity-100 hover:text-[rgb(var(--a1))] transition-colors font-bold text-xl px-2">-</button>
                    <span className="text-[var(--text)] opacity-40 text-[10px] font-bold tracking-widest uppercase">MIN</span>
                    <button onClick={() => setFocusSessionMinutes(Math.min(120, focusSessionMinutes + 5))} className="text-[var(--text)] opacity-50 hover:opacity-100 hover:text-[rgb(var(--a1))] transition-colors font-bold text-xl px-2">+</button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex w-full items-center gap-3 z-10">
              <button
                onClick={toggleFocusSession}
                className={`flex-1 flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 rounded-2xl font-bold text-xs sm:text-sm tracking-widest transition-all shadow-lg ${focusSessionActive ? 'bg-[var(--panel-bg)] border border-[var(--panel-border)] text-[var(--text)] hover:bg-[rgba(var(--a2),0.1)] hover:border-[rgb(var(--a2))] hover:text-[rgb(var(--a2))]' : 'bg-gradient-to-r from-[rgb(var(--a1))] to-[rgb(var(--a2))] text-[var(--bg)] shadow-[0_0_20px_rgba(var(--a1),0.4)] hover:brightness-125'}`}
              >
                {focusSessionActive ? (<><Square className="w-4 h-4" /> END SESSION</>) : (<><Play className="w-4 h-4 fill-current" /> START FOCUS</>)}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAnalytics = () => {
    if (isAnalyticsLoading) {
      return (
        <div className="flex flex-col min-h-full gap-6 sm:gap-8 lg:gap-10 max-w-7xl mx-auto w-full pb-10 animate-in fade-in duration-300">
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

    let trendData: any[] = [];
    if (analyticsStartDate === analyticsEndDate) {
      const day = analyticsStartDate;
      for (let i = 0; i < 24; i++) {
        const hourStr = i.toString().padStart(2, '0');
        const hourKey = `${day}T${hourStr}`;
        const hourData = hourlyHistoryData[hourKey] || {};
        
        let totalTime = 0;
        let topApp = { name: '', time: 0 };
        
        for (const [appName, time] of Object.entries(hourData)) {
          if (isAppValid(appName)) {
            totalTime += time;
            if (time > topApp.time) {
              topApp = { name: appName, time };
            }
          }
        }
        
        const now = new Date();
        const isToday = day === todayStr;
        const currentHour = now.getHours();
        
        if (!isToday || i <= currentHour) {
          trendData.push({
            label: `${i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`}`,
            time: totalTime,
            topApp: topApp.name,
            topAppTime: topApp.time
          });
        }
      }
    } else {
      let currDate = new Date(analyticsStartDate + "T00:00:00");
      const endDate = new Date(analyticsEndDate + "T00:00:00");
      while (currDate <= endDate) {
        const dStr = currDate.toISOString().split('T')[0];
        const dayData = (dStr === todayStr && activeApp) ? activeApp.allUsage : (historyData[dStr] || {});
        
        let totalTime = 0;
        let topApp = { name: '', time: 0 };
        
        for (const [appName, time] of Object.entries(dayData)) {
          if (isAppValid(appName)) {
            totalTime += time;
            if (time > topApp.time) {
              topApp = { name: appName, time };
            }
          }
        }
        
        trendData.push({
          label: format(currDate, 'MMM d'),
          time: totalTime,
          topApp: topApp.name,
          topAppTime: topApp.time
        });
        
        currDate.setDate(currDate.getDate() + 1);
      }
    }

    const TrendTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        const data = payload[0].payload;
        const iconUrl = activeApp?.appIcons?.[data.topApp];
        return (
          <div className="bg-[var(--bg)]/95 backdrop-blur-3xl border border-[var(--panel-border)] p-4 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.3)] flex flex-col gap-2 min-w-[160px]">
            <p className="text-[var(--text)] font-bold mb-1 text-sm tracking-wide">{label}</p>
            <p className="text-[rgb(var(--a1))] font-black text-xs tracking-widest mb-1">
              TOTAL TIME: <span className="text-[var(--text)] ml-1">{formatTime(data.time)}</span>
            </p>
            {data.topApp && (
              <div className="flex items-center gap-3 mt-2 pt-2 border-t border-[var(--panel-border)]">
                <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                  {iconUrl ? <img src={iconUrl} alt={data.topApp} className="max-w-full max-h-full object-contain drop-shadow-sm" /> : <GenericAppIcon />}
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-[var(--text)] font-bold text-xs truncate" title={data.topApp}>{data.topApp}</span>
                  <span className="text-[var(--text)] opacity-60 font-medium text-[10px]">{formatTime(data.topAppTime)}</span>
                </div>
              </div>
            )}
          </div>
        );
      }
      return null;
    };

    const TrendXAxisTick = ({ x, y, payload }: any) => {
      return (
        <g transform={`translate(${x},${y})`}>
          <text x={0} y={0} dy={16} textAnchor="middle" fill="var(--text)" opacity="0.6" fontSize="11" fontWeight="bold">
            {payload.value}
          </text>
        </g>
      );
    };

    const filteredAnalyticsApps = analyticsChartData.filter(app => app.name.toLowerCase().includes(analyticsSearch.toLowerCase()));

    const getInsight = () => {
      if (pieData.length === 0) return "Not enough data to generate insights yet. Keep working!";

      const last7Days = Object.keys(historyData).sort().slice(-7);
      let avgScore = 0;
      if (last7Days.length > 0) {
        const totalScore = last7Days.reduce((sum, d) => sum + calculateProductivityScoreForDay(historyData[d]), 0);
        avgScore = Math.round(totalScore / last7Days.length);
      }

      const currentScore = calculateProductivityScore(dashboardData);
      let velocityStr = "";
      if (avgScore > 0) {
        const diff = currentScore - avgScore;
        if (diff > 0) velocityStr = ` Your score is +${diff}% above your 7-day average!`;
        else if (diff < 0) velocityStr = ` Your score is ${diff}% compared to your 7-day average.`;
      }

      const topCat = pieData[0];
      const percent = Math.round((topCat.value / totalCategoryTime) * 100);
      if (topCat.name === 'Entertainment' || topCat.name === 'Browsing') {
        return `You've spent ${percent}% of your tracked time on ${topCat.name}.${velocityStr} Consider enabling Focus Mode to stay on track.`;
      }
      return `Great job! Your primary focus was ${topCat.name}, accounting for ${percent}% of your tracked time.${velocityStr}`;
    };

    return (
      <div ref={analyticsRef} className="flex flex-col min-h-full gap-6 sm:gap-8 lg:gap-10 max-w-7xl mx-auto w-full pb-10">
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
                            const fromStr = `${range.from.getFullYear()}-${String(range.from.getMonth() + 1).padStart(2, '0')}-${String(range.from.getDate()).padStart(2, '0')}`;
                            setAnalyticsStartDate(fromStr);
                            if (range.to) {
                              const toStr = `${range.to.getFullYear()}-${String(range.to.getMonth() + 1).padStart(2, '0')}-${String(range.to.getDate()).padStart(2, '0')}`;
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
          <div className="flex-1 w-full min-h-[250px] min-w-0 relative">
            {trendData.length > 0 ? (
              <div className="absolute inset-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 15, bottom: 10 }}>
                    <defs>
                      <linearGradient id="colorTime" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="rgb(var(--a1))" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="rgb(var(--a1))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--panel-border)" vertical={false} />
                    <XAxis dataKey="label" stroke="var(--panel-border)" tick={<TrendXAxisTick />} tickLine={false} axisLine={false} dy={10} minTickGap={20} />
                    <YAxis tickFormatter={(val) => formatTime(val)} stroke="var(--panel-border)" tick={{ fill: 'var(--text)', opacity: 0.5, fontSize: 12, fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                    <Tooltip
                      cursor={{ stroke: 'var(--text)', opacity: 0.2, strokeWidth: 2, strokeDasharray: '4 4' }}
                      content={<TrendTooltip />}
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
                    <Brush 
                      dataKey="label" 
                      height={30} 
                      stroke="rgb(var(--a1))" 
                      fill="var(--panel-bg)" 
                      travellerWidth={10}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-center opacity-50 text-[var(--text)]">
                <NoData className="w-64 h-64 opacity-40" />
                <p className="font-bold tracking-widest uppercase text-sm mt-4">No Usage Data For This Range</p>
              </div>
            )}
          </div>
        </div>

        <div className="stagger-item bg-[var(--panel-bg)] backdrop-blur-3xl border border-[var(--panel-border)] p-5 sm:p-6 lg:p-8 rounded-2xl lg:rounded-3xl flex flex-col shadow-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] shrink-0" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-[var(--text)] tracking-wide">Productivity Heatmap</h2>
          </div>
          <div className="flex gap-2 w-full overflow-x-auto custom-scrollbar pb-4 items-end">
            <div className="grid grid-rows-7 gap-1 sm:gap-1.5 text-[9px] sm:text-[10px] text-[var(--text)] opacity-40 font-bold pr-1 items-center text-right pb-1">
              <span className="opacity-0">S</span><span>M</span><span className="opacity-0">T</span><span>W</span><span className="opacity-0">T</span><span>F</span><span className="opacity-0">S</span>
            </div>
            <div className="grid grid-rows-7 grid-flow-col gap-1 sm:gap-1.5 flex-1 min-w-max pb-1">
              {heatmapDays.map((day, idx) => {
                if (day.isFuture) return <div key={`future-${idx}`} className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-transparent"></div>;
                let colorClass = "bg-[var(--panel-border)] opacity-30";
                if (day.hasData) {
                  if (day.score < 25) colorClass = "bg-[rgba(var(--a1),0.2)]";
                  else if (day.score < 50) colorClass = "bg-[rgba(var(--a1),0.5)]";
                  else if (day.score < 75) colorClass = "bg-[rgba(var(--a1),0.8)]";
                  else colorClass = "bg-[rgb(var(--a1))] shadow-[0_0_8px_rgba(var(--a1),0.4)]";
                }
                return <div key={day.dateStr} className={`w-3 h-3 sm:w-4 sm:h-4 rounded ${colorClass} transition-all hover:scale-125 hover:ring-2 hover:ring-[rgb(var(--a1))] cursor-crosshair`} title={`${format(new Date(day.dateStr + "T00:00:00"), 'MMM d, yyyy')}: ${day.hasData ? day.score + '% Productivity' : 'No Data'}`}></div>
              })}
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 text-[10px] sm:text-xs text-[var(--text)] opacity-60 font-medium mt-2">
            <span>Less</span>
            <div className="w-3 h-3 rounded bg-[var(--panel-border)] opacity-30"></div>
            <div className="w-3 h-3 rounded bg-[rgba(var(--a1),0.2)]"></div>
            <div className="w-3 h-3 rounded bg-[rgba(var(--a1),0.5)]"></div>
            <div className="w-3 h-3 rounded bg-[rgba(var(--a1),0.8)]"></div>
            <div className="w-3 h-3 rounded bg-[rgb(var(--a1))] shadow-[0_0_5px_rgba(var(--a1),0.5)]"></div>
            <span>More</span>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 overflow-y-auto overflow-x-hidden custom-scrollbar pr-2 max-h-[400px]">
              {filteredAnalyticsApps.map((app) => {
                const isActive = lastActiveValidApp === app.name;
                const isIgnored = hiddenApps.includes(app.name);
                return (
                  <div key={app.name} onContextMenu={(e) => handleContextMenu(e, app.name)} className={`bg-[var(--bg)] border p-4 sm:p-5 rounded-2xl flex items-center gap-4 shadow-inner transition-all cursor-context-menu ${isActive ? 'border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'border-[var(--panel-border)] hover:border-[rgba(var(--a1),0.3)] hover:shadow-lg'} ${isIgnored ? 'opacity-60 grayscale' : ''}`}>
                    <div className={`w-12 h-12 rounded-xl bg-[var(--panel-bg)] border flex items-center justify-center p-2 shadow-sm shrink-0 relative ${isActive && !isIgnored ? 'border-emerald-500/50' : 'border-[var(--panel-border)]'}`}>
                      {activeApp?.appIcons?.[app.name] ? <img src={activeApp.appIcons[app.name]} className="object-contain max-w-full max-h-full drop-shadow-md" alt="" /> : <GenericAppIcon />}
                      {isActive && !isIgnored && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3 shrink-0" title="Currently Active">
                          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] border border-[var(--panel-bg)]"></span>
                        </span>
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <p className={`text-sm font-bold text-[var(--text)] truncate flex items-center gap-2 ${isIgnored ? 'line-through opacity-50' : 'opacity-90'}`}>
                        {app.name.length > 20 ? app.name.substring(0, 17) + '...' : app.name}
                        {isActive && !isIgnored && <span className="text-[9px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 tracking-wider">ACTIVE</span>}
                        {isIgnored && <span className="text-[9px] text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20 tracking-wider">IGNORED</span>}
                      </p>
                      <p className={`text-base font-black text-[rgb(var(--a1))] tracking-wide mt-0.5 truncate ${isIgnored ? 'opacity-70' : ''}`}>{formatTime(app.time)} <span className="text-[10px] font-bold text-[var(--text)] opacity-40 uppercase tracking-widest ml-1">{analyticsStartDate === todayStr && analyticsEndDate === todayStr ? 'today' : 'total'}</span></p>
                    </div>
                  </div>
                )
              })}
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
                <div className="flex-1 w-full h-full flex flex-col">
                  <div className="flex-1 w-full relative min-h-[140px]">
                    <div className="absolute inset-0">
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
                              const data = payload[0].payload;
                                return (
                                <div className="bg-[var(--bg)]/95 backdrop-blur-3xl border border-[var(--panel-border)] p-4 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.3)] z-50 min-w-[200px]">
                                  <div className="flex justify-between items-center mb-2 pb-2 border-b border-[var(--panel-border)]">
                                    <p className="text-[var(--text)] font-bold text-sm tracking-wide">{data.name}</p>
                                    <p className="text-[rgb(var(--a2))] font-black text-[10px] tracking-widest bg-[rgba(var(--a2),0.1)] border border-[rgba(var(--a2),0.2)] px-2 py-0.5 rounded">
                                      {percent}%
                                    </p>
                                  </div>
                                  <p className="text-[var(--text)] opacity-60 font-medium text-[10px] tracking-widest uppercase mb-3">Total Time: <span className="text-[var(--text)] font-bold opacity-100 ml-1">{formatTime(data.value)}</span></p>
                                  <div className="flex flex-col gap-1.5">
                                    {data.apps.slice(0, 4).map((app: any, idx: number) => (
                                      <div key={idx} className="flex justify-between items-center text-xs gap-4">
                                        <span className="text-[var(--text)] font-bold truncate max-w-[130px] opacity-90">{app.name}</span>
                                        <span className="text-[var(--text)] opacity-50 font-medium whitespace-nowrap">{formatTime(app.time)}</span>
                                      </div>
                                    ))}
                                    {data.apps.length > 4 && (
                                      <p className="text-[var(--text)] opacity-40 text-[10px] font-bold mt-1 text-center italic">
                                        + {data.apps.length - 4} more
                                      </p>
                                    )}
                                  </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-center gap-x-3 gap-y-2 mt-4 shrink-0">
                    {pieData.map((entry, index) => (
                      <div key={entry.name} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}></div>
                        <span className="text-[var(--text)] text-xs font-bold opacity-70">{entry.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
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
    <div className="relative flex flex-col min-h-full gap-6 sm:gap-8 lg:gap-10 max-w-7xl mx-auto w-full pb-10">
      
      {focusSessionActive && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[var(--bg)]/40 backdrop-blur-md rounded-[2rem] -m-4 p-4">
          <div className="bg-[var(--panel-bg)] p-8 rounded-3xl border border-[var(--panel-border)] shadow-2xl flex flex-col items-center text-center max-w-md animate-in zoom-in fade-in duration-300">
            <ShieldAlert className="w-12 h-12 text-[rgb(var(--a1))] mb-4 drop-shadow-[0_0_8px_rgba(var(--a1),0.5)]" />
            <h2 className="text-2xl font-black text-[var(--text)] mb-2 tracking-tight">Settings Locked</h2>
            <p className="text-[var(--text)] opacity-70 font-medium text-sm">To prevent bypassing tracking rules, settings are securely locked while your Deep Focus session is active.</p>
          </div>
        </div>
      )}

      <div className={`stagger-item shrink-0 mb-2 sm:mb-4 ${focusSessionActive ? 'blur-sm opacity-30 pointer-events-none' : ''}`} style={{ animationDelay: '0.05s' }}>
        <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-black mb-2 sm:mb-4 tracking-tighter bg-gradient-to-br from-[rgb(var(--a1))] via-[var(--text)] to-[rgb(var(--a2))] text-transparent bg-clip-text drop-shadow-[0_2px_15px_rgba(var(--a1),0.4)] font-['Acorn',_sans-serif]">
          Application Preferences
        </h1>
        <p className="text-[var(--text)] opacity-70 text-sm sm:text-lg font-medium tracking-wide">Customize your tracking and visual experience.</p>
      </div>

      <div className={`stagger-item bg-[var(--panel-bg)] backdrop-blur-3xl border border-[var(--panel-border)] rounded-2xl lg:rounded-3xl shadow-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] flex-1 flex flex-col overflow-hidden ${focusSessionActive ? 'blur-sm opacity-30 pointer-events-none' : ''}`} style={{ animationDelay: '0.15s' }}>
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
                  <Play className="w-6 h-6 text-blue-400 fill-current" />
                </div>
                <div>
                  <h4 className="text-[var(--text)] font-bold text-sm sm:text-base tracking-wide">Launch at Startup</h4>
                  <p className="text-xs sm:text-sm text-[var(--text)] opacity-50 mt-0.5 sm:mt-1 max-w-lg font-medium">Start ForgePulse silently in the system tray when Windows boots.</p>
                </div>
              </div>
              <Switch checked={autoStart} onCheckedChange={handleAutoStartToggle} />
            </div>

            <div className="flex items-center justify-between bg-[var(--bg)] p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-[var(--panel-border)] shadow-inner">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[var(--panel-bg)] rounded-xl border border-[var(--panel-border)] shadow-inner">
                  <Clock className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h4 className="text-[var(--text)] font-bold text-sm sm:text-base tracking-wide">Stop Tracking on Idle</h4>
                  <p className="text-xs sm:text-sm text-[var(--text)] opacity-50 mt-0.5 sm:mt-1 max-w-lg font-medium">Pause time tracking when you are away from your computer for 5+ minutes.</p>
                </div>
              </div>
              <Switch checked={stopTrackingOnIdle} onCheckedChange={setStopTrackingOnIdle} />
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
                          const fromStr = `${range.from.getFullYear()}-${String(range.from.getMonth() + 1).padStart(2, '0')}-${String(range.from.getDate()).padStart(2, '0')}`;
                          setExportStartDate(fromStr);
                          if (range.to) {
                            const toStr = `${range.to.getFullYear()}-${String(range.to.getMonth() + 1).padStart(2, '0')}-${String(range.to.getDate()).padStart(2, '0')}`;
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

            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between bg-[var(--bg)] p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-[var(--panel-border)] shadow-inner gap-4 mt-4">
              <div>
                <h4 className="text-[var(--text)] font-bold text-sm sm:text-base tracking-wide">Hidden Applications</h4>
                <p className="text-xs sm:text-sm text-[var(--text)] opacity-50 mt-0.5 sm:mt-1 max-w-lg font-medium">You have hidden {hiddenApps.length} application(s) from tracking.</p>
              </div>
              <div className="flex gap-3 mt-2 lg:mt-0 w-full lg:w-auto shrink-0 flex-wrap items-center">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-[var(--text)] opacity-70 hover:opacity-100 transition-opacity mr-2">
                  <Switch checked={showIgnoredApps} onCheckedChange={setShowIgnoredApps} />
                  Show in Charts
                </label>
                <button
                  onClick={() => { setHiddenApps([]); showToast('Hidden Apps Reset', 'All hidden applications are now being tracked again.'); }}
                  disabled={hiddenApps.length === 0}
                  className="bg-[var(--panel-bg)] disabled:opacity-50 disabled:cursor-not-allowed border border-[var(--panel-border)] hover:bg-[rgba(var(--a1),0.1)] text-[var(--text)] px-4 sm:px-6 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-black tracking-widest transition-all cursor-pointer shadow-inner flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
                  RESET HIDDEN
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 pb-10">
            <h3 className="text-[var(--text)] font-bold text-lg sm:text-xl border-b border-[var(--panel-border)] pb-2 sm:pb-3 tracking-wide">Appearance Options</h3>
            <div className="flex flex-col gap-6">
              <div>
                <h4 className="text-[var(--text)] font-bold text-sm sm:text-base tracking-wide mb-3">Main App Theme</h4>
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
              <div>
                <h4 className="text-[var(--text)] font-bold text-sm sm:text-base tracking-wide mb-3">Mini Player Theme</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  {(['sync', 'light', 'dark'] as const).map((t) => (
                    <button
                      key={`mini-${t}`}
                      onClick={() => setMiniPlayerThemePref(t)}
                      className={`flex items-center justify-center gap-2 sm:gap-3 p-4 sm:p-5 rounded-xl sm:rounded-2xl border transition-all duration-300 cursor-pointer ${miniPlayerThemePref === t ? 'bg-[rgba(var(--a1),0.1)] border-[rgb(var(--a1))] shadow-[0_0_20px_rgba(var(--a1),0.3)] scale-[1.02]' : 'bg-[var(--panel-bg)] border-[var(--panel-border)] hover:border-[var(--text)] hover:shadow-lg'}`}
                    >
                      {t === 'sync' && <RefreshCw className="w-5 h-5 text-[var(--text)] opacity-80" />}
                      {t === 'light' && <Sun className="w-5 h-5 text-[var(--text)] opacity-80" />}
                      {t === 'dark' && <Moon className="w-5 h-5 text-[var(--text)] opacity-80" />}
                      <span className="font-bold tracking-wide text-[var(--text)] capitalize">{t === 'sync' ? 'Sync with App' : `${t} Mode`}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="text-[var(--text)] font-bold text-lg sm:text-xl border-b border-[var(--panel-border)] pb-2 sm:pb-3 tracking-wide">System Updates</h3>
            <div className="flex flex-col bg-[var(--bg)] p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-[var(--panel-border)] shadow-inner gap-4">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div>
                  <h4 className="text-[var(--text)] font-bold text-sm sm:text-base tracking-wide">Check for Updates</h4>
                  <p className="text-xs sm:text-sm text-[var(--text)] opacity-50 mt-0.5 sm:mt-1 max-w-lg font-medium">Verify if a newer version of the application is available for download.</p>
                </div>
                <div className="flex gap-3 mt-2 lg:mt-0 w-full lg:w-auto shrink-0">
                  <button
                    onClick={handleCheckForUpdates}
                    disabled={updateProgress !== null && !updateReady}
                    className={`bg-[var(--panel-bg)] border border-[var(--panel-border)] text-[var(--text)] px-4 sm:px-6 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-black tracking-widest transition-all shadow-inner flex items-center justify-center gap-2 ${updateProgress !== null && !updateReady ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[rgba(var(--a1),0.1)] cursor-pointer'}`}
                  >
                    <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${updateProgress !== null && !updateReady ? 'animate-spin text-[rgb(var(--a1))]' : ''}`} />
                    {updateReady ? 'RESTART TO INSTALL' : (updateProgress !== null ? 'DOWNLOADING...' : 'CHECK NOW')}
                  </button>
                </div>
              </div>
              {updateProgress !== null && (
                <div className="w-full flex flex-col gap-1.5 border-t border-[var(--panel-border)] pt-4 mt-1">
                  <div className="flex justify-between items-center text-xs font-bold text-[var(--text)] opacity-70 tracking-wide uppercase">
                    <span>{updateReady ? 'Download Complete!' : 'Downloading Update...'}</span>
                    <span>{Math.round(updateProgress)}%</span>
                  </div>
                  <div className="w-full bg-[var(--panel-border)] rounded-full h-2 shadow-inner overflow-hidden">
                    <div className={`h-full transition-all duration-300 ${updateReady ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-[rgb(var(--a1))] shadow-[0_0_10px_rgba(var(--a1),0.5)]'}`} style={{ width: `${updateProgress}%` }}></div>
                  </div>
                </div>
              )}
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

  // Special Route strictly for the frameless Mini Player window

  // Force the underlying document to be 100% transparent to support perfectly rounded corners
  useEffect(() => {
    if (isMiniPlayer) {
      document.body.style.background = 'transparent';
      document.documentElement.style.background = 'transparent';
    } else {
      document.body.style.background = '';
      document.documentElement.style.background = '';
    }
  }, [isMiniPlayer]);

  if (isMiniPlayer) {
    return (
      <div className="w-screen h-screen bg-transparent p-3 flex items-center justify-center font-sans overflow-hidden [-webkit-app-region:drag]">
        <div className="w-full h-full flex flex-col justify-between bg-[var(--panel-bg)]/50 backdrop-blur-[24px] text-[var(--text)] relative border border-[var(--panel-border)] shadow-[0_10px_30px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] rounded-[1.5rem] p-4 group transition-all duration-300 hover:shadow-[0_15px_40px_rgba(0,0,0,0.6)]">
          
          <div className="flex items-center justify-between w-full z-50">
            <button 
              onClick={() => {
                const newState = !isMiniPlayerAlwaysOnTop;
                setIsMiniPlayerAlwaysOnTop(newState);
                if ((window as any).electron) (window as any).electron.ipcRenderer.send('toggle-always-on-top', newState);
                else if ((window as any).api && (window as any).api.toggleAlwaysOnTop) (window as any).api.toggleAlwaysOnTop(newState);
              }} 
              className={`p-1.5 rounded-full [-webkit-app-region:no-drag] cursor-pointer transition-all border shadow-sm flex items-center justify-center ${isMiniPlayerAlwaysOnTop ? 'bg-[rgb(var(--a1))] text-[var(--bg)] border-[rgb(var(--a1))] shadow-[0_0_10px_rgba(var(--a1),0.4)]' : 'bg-[var(--bg)]/50 text-[var(--text)] hover:text-[rgb(var(--a1))] border-[var(--panel-border)] hover:bg-[rgba(var(--a1),0.2)]'}`}
              title={isMiniPlayerAlwaysOnTop ? "Always on Top: ON" : "Always on Top: OFF"}
            >
              {isMiniPlayerAlwaysOnTop ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
            </button>

            <div className="flex items-center gap-1.5 bg-[var(--bg)]/50 backdrop-blur-md px-3 py-1 rounded-full border border-[var(--panel-border)] shadow-inner">
              <Flame className={`w-3.5 h-3.5 ${focusSessionActive ? 'text-[rgb(var(--a1))] animate-pulse drop-shadow-[0_0_8px_rgba(var(--a1),0.5)]' : 'opacity-40'}`} />
              <span className="font-bold text-[10px] tracking-widest uppercase opacity-80">Focus</span>
            </div>

            <button 
              onClick={() => {
                if ((window as any).electron) (window as any).electron.ipcRenderer.send('restore-main-window');
                else if ((window as any).api && (window as any).api.restoreMainWindow) (window as any).api.restoreMainWindow();
              }} 
              className="p-1.5 bg-[var(--bg)]/50 hover:bg-red-500/20 text-[var(--text)] hover:text-red-500 rounded-full [-webkit-app-region:no-drag] cursor-pointer transition-all border border-[var(--panel-border)] shadow-sm flex items-center justify-center"
              title="Return to Dashboard"
            >
              <X className="w-3.5 h-3.5" strokeWidth={2.5} />
            </button>
          </div>

          <div className="flex flex-col items-center justify-center flex-1 relative min-h-0 py-2">
            <div className="relative flex flex-col items-center justify-center w-[130px] h-[130px]">
              {focusSessionActive && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <svg className="w-full h-full -rotate-90 drop-shadow-[0_0_15px_rgba(var(--a1),0.4)]" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="46" stroke="var(--panel-border)" strokeWidth="2" fill="transparent" />
                    <circle cx="50" cy="50" r="46" stroke="rgb(var(--a1))" strokeWidth="4" fill="transparent" strokeDasharray="289.02" strokeDashoffset={289.02 - (focusSessionTimeLeft / (focusSessionMinutes * 60) * 289.02)} className="transition-all duration-1000 linear" strokeLinecap="round" />
                  </svg>
                </div>
              )}
              <span className="text-4xl leading-none font-black tabular-nums tracking-tighter text-[var(--text)] drop-shadow-md z-10">
                {focusSessionActive ? formatCountdown(focusSessionTimeLeft) : formatCountdown(focusSessionMinutes * 60)}
              </span>
            </div>
            
            {!focusSessionActive && (
              <div className="flex items-center gap-3 mt-3 [-webkit-app-region:no-drag] z-20">
                <button onClick={() => setFocusSessionMinutes(Math.max(5, focusSessionMinutes - 5))} className="w-7 h-7 flex items-center justify-center rounded-full bg-[var(--bg)]/60 border border-[var(--panel-border)] text-[var(--text)] opacity-70 hover:opacity-100 hover:text-[rgb(var(--a1))] hover:border-[rgb(var(--a1))] transition-all font-bold text-lg cursor-pointer shadow-sm">-</button>
                <span className="text-[var(--text)] opacity-50 text-[10px] font-black tracking-widest uppercase">MIN</span>
                <button onClick={() => setFocusSessionMinutes(Math.min(120, focusSessionMinutes + 5))} className="w-7 h-7 flex items-center justify-center rounded-full bg-[var(--bg)]/60 border border-[var(--panel-border)] text-[var(--text)] opacity-70 hover:opacity-100 hover:text-[rgb(var(--a1))] hover:border-[rgb(var(--a1))] transition-all font-bold text-lg cursor-pointer shadow-sm">+</button>
              </div>
            )}
          </div>

          <button
            onClick={toggleFocusSession}
            className={`[-webkit-app-region:no-drag] w-full py-2.5 rounded-2xl text-[11px] font-black tracking-widest transition-all duration-300 cursor-pointer shadow-lg flex items-center justify-center gap-2 z-50 ${
              focusSessionActive 
                ? 'bg-[var(--bg)]/80 backdrop-blur-md border border-[var(--panel-border)] text-red-400 hover:bg-red-500/20 hover:border-red-500/40 shadow-[0_5px_15px_rgba(239,68,68,0.15)]' 
                : 'bg-gradient-to-r from-[rgb(var(--a1))] to-[rgb(var(--a2))] border-transparent text-[var(--bg)] shadow-[0_0_20px_rgba(var(--a1),0.4)] hover:brightness-110 hover:shadow-[0_0_25px_rgba(var(--a1),0.5)]'
            }`}
          >
            {focusSessionActive ? (
              <><Square className="w-3.5 h-3.5" strokeWidth={3} /> STOP FOCUS</>
            ) : (
              <><Play className="w-3.5 h-3.5 fill-current" /> START FOCUS</>
            )}
          </button>

        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col overflow-hidden relative font-sans transition-colors duration-500 bg-[var(--bg)] text-[var(--text)] rounded-xl border border-[var(--panel-border)] shadow-2xl">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[rgb(var(--a1))] rounded-full mix-blend-screen filter blur-[200px] opacity-[0.12] pointer-events-none transition-colors duration-500 z-0"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[rgb(var(--a2))] rounded-full mix-blend-screen filter blur-[200px] opacity-[0.12] pointer-events-none transition-colors duration-500 z-0"></div>

        <div className="h-10 w-full flex items-center justify-between px-4 shrink-0 bg-[var(--bg)]/50 backdrop-blur-md border-b border-[var(--panel-border)] [-webkit-app-region:drag] z-50">
          <div className="flex items-center gap-2 text-[var(--text)] opacity-60">
            <ZeitraLogo className="w-4 h-4 drop-shadow-[0_0_5px_rgba(var(--a1),0.4)]" />
            <span className="text-xs font-black tracking-widest uppercase">Zeitra</span>
          </div>
          <div className="flex items-center gap-2 [-webkit-app-region:no-drag]">
            <button onClick={() => {
              if ((window as any).electron) (window as any).electron.ipcRenderer.send('minimize-window');
              else (window as any).api?.minimizeWindow?.();
            }} className="p-1.5 rounded-lg hover:bg-[rgba(var(--a1),0.15)] text-[var(--text)] opacity-70 hover:opacity-100 transition-colors cursor-pointer">
              <MinusIcon className="w-4 h-4" />
            </button>
            <button onClick={() => {
              if ((window as any).electron) (window as any).electron.ipcRenderer.send('maximize-window');
              else (window as any).api?.maximizeWindow?.();
            }} className="p-1.5 rounded-lg hover:bg-[rgba(var(--a1),0.15)] text-[var(--text)] opacity-70 hover:opacity-100 transition-colors cursor-pointer">
              <Square className="w-3.5 h-3.5" strokeWidth={3} />
            </button>
            <button onClick={() => {
              if ((window as any).electron) (window as any).electron.ipcRenderer.send('close-window');
              else (window as any).api?.closeWindow?.();
            }} className="p-1.5 rounded-lg hover:bg-red-500 hover:text-white text-[var(--text)] opacity-70 hover:opacity-100 transition-colors cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden relative z-10 w-full bg-transparent">
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
        <main className="flex-1 p-4 sm:p-6 lg:p-10 overflow-y-scroll overflow-x-hidden custom-scrollbar relative z-10 w-full h-full">
          <div className="flex flex-col min-h-full gap-6 sm:gap-8 lg:gap-10 max-w-7xl mx-auto w-full pb-10 animate-in fade-in duration-300">
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
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden relative font-sans transition-colors duration-500 bg-[var(--bg)] text-[var(--text)] rounded-xl border border-[var(--panel-border)] shadow-2xl">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[rgb(var(--a1))] rounded-full mix-blend-screen filter blur-[200px] opacity-[0.12] pointer-events-none transition-colors duration-500 z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[rgb(var(--a2))] rounded-full mix-blend-screen filter blur-[200px] opacity-[0.12] pointer-events-none transition-colors duration-500 z-0"></div>

      <div className="h-10 w-full flex items-center justify-between px-4 shrink-0 bg-[var(--bg)]/50 backdrop-blur-md border-b border-[var(--panel-border)] [-webkit-app-region:drag] z-50">
        <div className="flex items-center gap-2 text-[var(--text)] opacity-60">
          <ZeitraLogo className="w-4 h-4 drop-shadow-[0_0_5px_rgba(var(--a1),0.4)]" />
          <span className="text-xs font-black tracking-widest uppercase">Zeitra</span>
        </div>
        <div className="flex items-center gap-2 [-webkit-app-region:no-drag]">
          <button onClick={() => {
            if ((window as any).electron) (window as any).electron.ipcRenderer.send('minimize-window');
            else (window as any).api?.minimizeWindow?.();
          }} className="p-1.5 rounded-lg hover:bg-[rgba(var(--a1),0.15)] text-[var(--text)] opacity-70 hover:opacity-100 transition-colors cursor-pointer">
            <MinusIcon className="w-4 h-4" />
          </button>
          <button onClick={() => {
            if ((window as any).electron) (window as any).electron.ipcRenderer.send('maximize-window');
            else (window as any).api?.maximizeWindow?.();
          }} className="p-1.5 rounded-lg hover:bg-[rgba(var(--a1),0.15)] text-[var(--text)] opacity-70 hover:opacity-100 transition-colors cursor-pointer">
            <Square className="w-3.5 h-3.5" strokeWidth={3} />
          </button>
          <button onClick={() => {
            if ((window as any).electron) (window as any).electron.ipcRenderer.send('close-window');
            else (window as any).api?.closeWindow?.();
          }} className="p-1.5 rounded-lg hover:bg-red-500 hover:text-white text-[var(--text)] opacity-70 hover:opacity-100 transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative z-10 w-full bg-transparent">
        <div className="w-20 md:w-64 lg:w-72 shrink-0 bg-[var(--panel-bg)] border-r border-[var(--panel-border)] p-4 sm:p-6 lg:p-8 flex flex-col justify-between relative z-10 backdrop-blur-3xl shadow-[20px_0_40px_rgba(0,0,0,0.1)] print:hidden transition-all duration-300">
          <div className="flex flex-col gap-8 md:gap-10">
            <div className="px-0 md:px-2 flex justify-center md:justify-start stagger-item" style={{ animationDelay: '0.0s' }}>
              <ZeitraLogo className="w-10 md:w-28 h-auto drop-shadow-[0_0_8px_rgba(var(--a1),0.5)] transition-all duration-300" />
            </div>

          <nav className="flex flex-col gap-2 md:gap-3">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`stagger-item flex items-center justify-center md:justify-start gap-0 md:gap-4 p-3 md:px-5 md:py-4 rounded-xl transition-all duration-300 cursor-pointer text-sm tracking-wide ${activeTab === 'dashboard' ? 'bg-[rgba(var(--a1),0.15)] text-[var(--text)] font-bold md:border-l-4 border-[rgb(var(--a1))] md:pl-4 shadow-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]' : 'text-[var(--text)] opacity-50 hover:bg-[var(--panel-bg)] hover:opacity-100 font-semibold'}`}
              style={{ animationDelay: '0.05s' }}
            >
              <LayoutDashboard className={`w-6 h-6 md:w-5 md:h-5 shrink-0 ${activeTab === 'dashboard' ? 'text-[rgb(var(--a1))] drop-shadow-md' : ''}`} />
              <span className="hidden md:block">Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`stagger-item flex items-center justify-center md:justify-start gap-0 md:gap-4 p-3 md:px-5 md:py-4 rounded-xl transition-all duration-300 cursor-pointer text-sm tracking-wide ${activeTab === 'analytics' ? 'bg-[rgba(var(--a1),0.15)] text-[var(--text)] font-bold md:border-l-4 border-[rgb(var(--a1))] md:pl-4 shadow-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]' : 'text-[var(--text)] opacity-50 hover:bg-[var(--panel-bg)] hover:opacity-100 font-semibold'}`}
              style={{ animationDelay: '0.1s' }}
            >
              <LineChart className={`w-6 h-6 md:w-5 md:h-5 shrink-0 ${activeTab === 'analytics' ? 'text-[rgb(var(--a1))] drop-shadow-md' : ''}`} />
              <span className="hidden md:block">Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab('controls')}
              className={`stagger-item flex items-center justify-center md:justify-start gap-0 md:gap-4 p-3 md:px-5 md:py-4 rounded-xl transition-all duration-300 cursor-pointer text-sm tracking-wide ${activeTab === 'controls' ? 'bg-[rgba(var(--a2),0.15)] text-[var(--text)] font-bold md:border-l-4 border-[rgb(var(--a2))] md:pl-4 shadow-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]' : 'text-[var(--text)] opacity-50 hover:bg-[var(--panel-bg)] hover:opacity-100 font-semibold'}`}
              style={{ animationDelay: '0.15s' }}
            >
              <ShieldAlert className={`w-6 h-6 md:w-5 md:h-5 shrink-0 ${activeTab === 'controls' ? 'text-[rgb(var(--a2))] drop-shadow-md' : ''}`} />
              <span className="hidden md:block">Controls</span>
            </button>
          </nav>
        </div>

        <div className="flex flex-col gap-2 md:gap-4">
          <button
            onClick={() => setActiveTab('settings')}
            className={`stagger-item flex items-center justify-center md:justify-start gap-0 md:gap-4 p-3 md:px-5 md:py-3 rounded-xl transition-all duration-300 cursor-pointer text-sm font-bold tracking-wide ${activeTab === 'settings' ? 'bg-[var(--panel-bg)] text-[var(--text)] md:border-l-4 border-[var(--text)] md:pl-4 shadow-md shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]' : 'text-[var(--text)] opacity-50 hover:bg-[var(--panel-bg)] hover:opacity-100 font-semibold'}`}
            style={{ animationDelay: '0.2s' }}
          >
            <Settings className="w-6 h-6 md:w-5 md:h-5 shrink-0" />
            <span className="hidden md:block">Settings</span>
          </button>

          <div className="stagger-item flex items-center justify-center md:justify-start gap-0 md:gap-4 bg-transparent md:bg-[var(--bg)] border-none md:border border-[var(--panel-border)] rounded-2xl p-2 md:p-4 shadow-none md:shadow-inner transition-all duration-300" style={{ animationDelay: '0.25s' }}>
            <div className="w-3 h-3 md:w-2.5 md:h-2.5 rounded-full bg-[rgb(var(--a1))] shadow-[0_0_8px_rgb(var(--a1))] shrink-0"></div>
            <span className="hidden md:block text-xs text-[var(--text)] opacity-80 font-bold tracking-widest uppercase truncate">Engine Live</span>
          </div>
        </div>
      </div>

      <main className="flex-1 p-4 sm:p-6 lg:p-10 overflow-y-scroll overflow-x-hidden custom-scrollbar relative z-10 w-full h-full print:p-0 print:overflow-visible">
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
      </div>

      {/* Shadcn Sonner Toaster */}
      <Toaster theme={effectiveTheme as any} toastOptions={{ style: { background: 'var(--panel-bg)', color: 'var(--text)', border: '1px solid var(--panel-border)', backdropFilter: 'blur(20px)' }, className: 'font-sans font-medium' }} />

      {/* Custom Right-Click Context Menu */}
      <ContextMenu contextMenu={contextMenu} onClose={() => setContextMenu(null)} onRefreshIcon={executeIconRefresh} onHideApp={handleHideApp} onOpenLocation={handleOpenLocation} />

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
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(150, 150, 150, 0.25);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
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
        
        /* Premium Timeline Brush Handle Styling */
        .recharts-brush-traveller rect {
          fill: rgb(var(--a1)) !important;
          filter: drop-shadow(0 0 8px rgba(var(--a1), 0.6));
          rx: 4px;
          transition: all 0.3s ease;
        }
        .recharts-brush-traveller:hover rect {
          fill: rgb(var(--a2)) !important;
          filter: drop-shadow(0 0 12px rgba(var(--a2), 0.9));
        }
        .recharts-brush-traveller line {
          stroke: var(--bg) !important;
          stroke-width: 1.5px !important;
        }
      `}</style>

    </div>
  )
}

export default App