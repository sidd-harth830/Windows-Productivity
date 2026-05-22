import React, { useState, useMemo, useRef, useCallback } from 'react'
import { GenericAppIcon, X, Clock, ShieldBan, ShieldAlert, FolderOpen, Check } from './Icons'
import { Switch } from '../switch'
import { Input } from '../input'

const TrashIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>;
const FilterIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>;
const EditIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>;

const CircularDial = ({ value, min, max, onChange, step = 5 }: any) => {
    const svgRef = useRef<SVGSVGElement>(null);
    
    const handleInteract = useCallback((e: any) => {
        if (!svgRef.current) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        const rect = svgRef.current.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        
        let angle = Math.atan2(clientY - cy, clientX - cx) * 180 / Math.PI;
        let shifted = angle + 90;
        if (shifted < 0) shifted += 360;
        
        const percentage = shifted / 360;
        let newVal = Math.round((min + percentage * (max - min)) / step) * step;
        
        if (value <= min + (max - min) * 0.15 && newVal >= max - (max - min) * 0.15) newVal = min;
        else if (value >= max - (max - min) * 0.15 && newVal <= min + (max - min) * 0.15) newVal = max;
        
        onChange(Math.max(min, Math.min(max, newVal)));
    }, [value, min, max, step, onChange]);

    const onPointerDown = (e: React.PointerEvent) => { (e.target as Element).setPointerCapture(e.pointerId); handleInteract(e); };
    const onPointerMove = (e: React.PointerEvent) => { if (e.buttons > 0) handleInteract(e); };
    const onPointerUp = (e: React.PointerEvent) => { (e.target as Element).releasePointerCapture(e.pointerId); };

    const percentage = (value - min) / (max - min);
    const r = 38; const cx = 50; const cy = 50;
    const dashArray = 2 * Math.PI * r;
    const dashOffset = dashArray - percentage * dashArray;
    const knobAngle = (percentage * 360 - 90) * Math.PI / 180;

    return (
        <svg ref={svgRef} viewBox="0 0 100 100" className="w-20 h-20 sm:w-24 sm:h-24 cursor-pointer touch-none drop-shadow-[0_0_12px_rgba(var(--a1),0.25)] hover:scale-105 transition-transform" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
            <circle cx={cx} cy={cy} r={r} fill="transparent" stroke="var(--panel-border)" strokeWidth="8" opacity="0.5" />
            <circle cx={cx} cy={cy} r={r} fill="transparent" stroke="rgb(var(--a1))" strokeWidth="8" strokeDasharray={dashArray} strokeDashoffset={dashOffset} strokeLinecap="round" style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }} />
            <circle cx={cx + r * Math.cos(knobAngle)} cy={cy + r * Math.sin(knobAngle)} r="8" fill="var(--bg)" stroke="rgb(var(--a1))" strokeWidth="4" className="shadow-lg pointer-events-none" />
            <text x="50" y="56" textAnchor="middle" fill="var(--text)" fontSize="18" fontWeight="900" className="pointer-events-none drop-shadow-md">{value}</text>
        </svg>
    );
};

export type BlockRule = 'fully_blocked' | number;

interface ControlsProps {
    isFocusMode: boolean;
    setIsFocusMode: (enabled: boolean) => void;
    blockList: Record<string, BlockRule>;
    setBlockList: (list: Record<string, BlockRule>) => void;
    availableApps: string[];
    appIcons: Record<string, string>;
    allUsage: Record<string, number>;
    onContextMenu?: (e: React.MouseEvent, appName: string) => void;
    showToast: (title: string, message: string) => void;
}

const Controls: React.FC<ControlsProps> = ({ isFocusMode, setIsFocusMode, blockList, setBlockList, availableApps, appIcons, allUsage, onContextMenu, showToast }) => {
    const [inputValue, setInputValue] = useState<string>('');
    const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
    const [ruleType, setRuleType] = useState<'block' | 'timer'>('block');
    const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(30);
    const [offlineActivity, setOfflineActivity] = useState<string>('');
    const [offlineMinutes, setOfflineMinutes] = useState<number>(30);
    const [ruleSearchQuery, setRuleSearchQuery] = useState<string>('');
    const [ruleFilter, setRuleFilter] = useState<'all' | 'block' | 'timer'>('all');
    const [editingRuleApp, setEditingRuleApp] = useState<string | null>(null);
    const [editingRuleLimit, setEditingRuleLimit] = useState<number>(30);

    const handleToggleFocus = (checked: boolean) => {
        setIsFocusMode(checked);
        if (window.api && window.api.toggleFocusMode) window.api.toggleFocusMode(checked);
    };

    const handleAddApp = (appToAdd: string) => {
        const cleanApp = appToAdd.trim();
        if (!cleanApp) return;

        const newRule: BlockRule = ruleType === 'block' ? 'fully_blocked' : (timeLimitMinutes * 60);
        const updatedList = { ...blockList, [cleanApp]: newRule };

        setBlockList(updatedList);
        setInputValue('');
        setShowSuggestions(false);

        if (window.api && window.api.updateBlockList) window.api.updateBlockList(updatedList);
    };

    const handleQuickAdd = (appName: string) => {
        const newRule: BlockRule = ruleType === 'block' ? 'fully_blocked' : (timeLimitMinutes * 60);
        const updatedList = { ...blockList, [appName]: newRule };
        setBlockList(updatedList);
        if (window.api && window.api.updateBlockList) window.api.updateBlockList(updatedList);
        showToast('Rule Added', `Applied ${ruleType === 'block' ? 'Block' : 'Limit'} to ${appName}`);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleAddApp(inputValue);
    };

    const handleRemoveApp = (appToRemove: string) => {
        const updatedList = { ...blockList };
        delete updatedList[appToRemove];
        setBlockList(updatedList);
        if (window.api && window.api.updateBlockList) window.api.updateBlockList(updatedList);
    };

    const handleClearAllRules = () => {
        setBlockList({});
        if (window.api && window.api.updateBlockList) window.api.updateBlockList({});
        showToast('Rules Cleared', 'All enforcement rules have been removed.');
    };

    const saveEditedTimer = (app: string) => {
        if (editingRuleLimit > 0) {
            const updatedList = { ...blockList, [app]: editingRuleLimit * 60 };
            setBlockList(updatedList);
            if (window.api && window.api.updateBlockList) window.api.updateBlockList(updatedList);
            setEditingRuleApp(null);
            showToast('Rule Updated', `Limit for ${app} changed to ${editingRuleLimit}m.`);
        }
    };

    const filteredSuggestions = availableApps.filter(app =>
        app.toLowerCase().includes(inputValue.toLowerCase()) &&
        !Object.keys(blockList).some(blocked => blocked.toLowerCase() === app.toLowerCase())
    );

    const handleAddOfflineTime = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = offlineActivity.trim();
        if (!trimmed) return;

        if (window.api && (window.api as any).addOfflineTime) {
            const success = await (window.api as any).addOfflineTime(trimmed, offlineMinutes);
            if (success) {
                setOfflineActivity('');
                setOfflineMinutes(30);
                showToast('Activity Logged', `Added ${offlineMinutes}m of offline time for "${trimmed}".`);
            }
        }
    };

    const filteredRules = useMemo(() => {
        return Object.entries(blockList).filter(([app, rule]) => {
            if (ruleFilter === 'block' && rule !== 'fully_blocked') return false;
            if (ruleFilter === 'timer' && rule === 'fully_blocked') return false;
            if (ruleSearchQuery && !app.toLowerCase().includes(ruleSearchQuery.toLowerCase())) return false;
            return true;
        });
    }, [blockList, ruleFilter, ruleSearchQuery]);

    const offlineApps = Object.keys(allUsage).filter(app => app.endsWith('(Offline)'));

    const handleDeleteOffline = async (appName: string) => {
        if (window.api && (window.api as any).removeAppUsage) {
            const success = await (window.api as any).removeAppUsage(appName);
            if (success) {
                showToast('Log Deleted', `Removed "${appName}".`);
            }
        }
    };

    const handleBrowseExe = async () => {
        if (window.api && (window.api as any).browseForExe) {
            const appName = await (window.api as any).browseForExe();
            if (appName) {
                setInputValue(appName);
                setShowSuggestions(true);
            }
        }
    };

    return (
        <div className="flex flex-col min-h-full gap-6 sm:gap-8 lg:gap-10 max-w-7xl mx-auto w-full pb-10">
            <div className="stagger-item shrink-0 mb-2 sm:mb-4" style={{ animationDelay: '0.05s' }}>
                <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-black mb-2 sm:mb-4 tracking-tighter bg-gradient-to-br from-[rgb(var(--a1))] via-[var(--text)] to-[rgb(var(--a2))] text-transparent bg-clip-text drop-shadow-[0_2px_15px_rgba(var(--a1),0.4)] font-['Acorn',_sans-serif]">
                    Zaitra Controls
                </h1>
                <p className="text-[var(--text)] opacity-70 text-sm sm:text-lg font-medium tracking-wide">Manage your Windows configuration and focus limits.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 flex-1 min-h-0 items-start">

                <div className="lg:col-span-5 flex flex-col gap-4 sm:gap-6">
                    <div className={`stagger-item bg-[var(--panel-bg)] backdrop-blur-3xl border p-5 sm:p-6 lg:p-8 rounded-2xl lg:rounded-3xl flex flex-col gap-6 sm:gap-8 transition-all duration-300 shadow-2xl ${isFocusMode ? 'border-[rgba(var(--a2),0.5)] shadow-[0_0_40px_rgba(var(--a2),0.2),inset_0_1px_0_rgba(255,255,255,0.1)]' : 'border-[var(--panel-border)] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]'}`} style={{ animationDelay: '0.1s' }}>
                        <div className="flex items-start justify-between w-full gap-4">
                            <div className="flex flex-col gap-2">
                                <div className={`p-3 w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-300 shadow-inner border shrink-0 ${isFocusMode ? 'bg-[rgba(var(--a2),0.2)] text-[rgb(var(--a2))] border-[rgba(var(--a2),0.4)] shadow-[0_0_20px_rgba(var(--a2),0.4)]' : 'bg-[var(--bg)] border-[var(--panel-border)] text-[var(--text)] opacity-50'}`}>
                                    <ShieldBan className="w-full h-full" />
                                </div>
                                <h3 className="font-bold text-lg sm:text-xl text-[var(--text)] mt-2 sm:mt-3">Focus Mode Engine</h3>
                                <p className="text-xs sm:text-sm text-[var(--text)] opacity-60 leading-relaxed font-medium">Engage the native Windows blocker to enforce your custom rules and time limits globally.</p>
                            </div>

                            <div className="mt-1">
                                <Switch checked={isFocusMode} onCheckedChange={handleToggleFocus} className="data-[state=checked]:bg-[rgb(var(--a2))]" />
                            </div>
                        </div>
                    </div>

                    <div className="stagger-item bg-[var(--panel-bg)] backdrop-blur-3xl border border-[var(--panel-border)] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] p-5 sm:p-6 lg:p-8 rounded-2xl lg:rounded-3xl flex flex-col gap-5 sm:gap-6 transition-all duration-300 shadow-2xl" style={{ animationDelay: '0.15s' }}>
                        <div className="flex items-start justify-between w-full gap-4">
                            <div className="flex flex-col gap-2">
                                <div className="p-3 w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center bg-[var(--bg)] border-[var(--panel-border)] text-[var(--text)] opacity-50 shadow-inner border shrink-0">
                                    <Clock className="w-full h-full" />
                                </div>
                                <h3 className="font-bold text-lg sm:text-xl text-[var(--text)] mt-2 sm:mt-3">Offline Log</h3>
                                <p className="text-xs sm:text-sm text-[var(--text)] opacity-60 leading-relaxed font-medium">Add time manually for reading, meetings, or brainstorming away from the screen.</p>
                            </div>
                        </div>

                        <form onSubmit={handleAddOfflineTime} className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 relative z-30 mt-3 bg-[var(--bg)] p-4 sm:p-5 rounded-2xl border border-[var(--panel-border)] shadow-inner">
                            <div className="flex flex-col items-center justify-center shrink-0">
                                <CircularDial value={offlineMinutes} min={5} max={180} step={5} onChange={setOfflineMinutes} />
                                <span className="text-[9px] uppercase tracking-widest font-black opacity-40 mt-2">Minutes</span>
                            </div>
                            <div className="flex flex-col w-full gap-3">
                                <Input
                                    type="text" value={offlineActivity} onChange={(e) => setOfflineActivity(e.target.value)}
                                    placeholder="Activity (e.g., Reading Book)"
                                    className="h-12 border-2 rounded-xl px-4 text-sm font-bold w-full" required
                                />
                                <button type="submit" className="w-full h-12 bg-gradient-to-r from-[rgb(var(--a1))] to-[rgb(var(--a2))] hover:brightness-125 text-[var(--bg)] px-6 rounded-xl text-sm font-black tracking-widest transition-all cursor-pointer shadow-[0_0_20px_rgba(var(--a1),0.4)] border-transparent">
                                    LOG OFFLINE TIME
                                </button>
                            </div>
                        </form>
                        
                        <div className="flex flex-wrap gap-2 mt-2">
                            {['Reading', 'Meeting', 'Workout', 'Studying', 'Brainstorming'].map(preset => (
                                <button key={preset} type="button" onClick={() => { setOfflineActivity(preset); setOfflineMinutes(30); }} className="px-3 py-1.5 bg-[var(--bg)] border border-[var(--panel-border)] text-[var(--text)] opacity-70 hover:opacity-100 hover:border-[rgb(var(--a1))] hover:text-[rgb(var(--a1))] rounded-lg text-xs font-bold transition-all shadow-inner cursor-pointer">
                                    + {preset}
                                </button>
                            ))}
                        </div>

                        {offlineApps.length > 0 && (
                            <div className="mt-2 border-t border-[var(--panel-border)] pt-4 flex flex-col gap-2">
                                <span className="text-xs text-[var(--text)] opacity-50 uppercase tracking-widest font-black mb-1">Recent Offline Entries</span>
                                {offlineApps.map(app => (
                                    <div key={app} className="flex items-center justify-between bg-[var(--panel-bg)] px-4 py-3 rounded-xl border border-[var(--panel-border)] shadow-inner">
                                        <span className="text-sm font-bold text-[var(--text)]">{app} <span className="opacity-50 ml-1">({Math.round(allUsage[app] / 60)}m)</span></span>
                                        <button type="button" onClick={() => handleDeleteOffline(app)} className="text-[rgb(var(--a2))] opacity-70 hover:opacity-100 hover:scale-110 transition-all cursor-pointer">
                                            <X className="w-5 h-5" strokeWidth={2.5} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="stagger-item lg:col-span-7 bg-[var(--panel-bg)] backdrop-blur-3xl border border-[var(--panel-border)] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] p-5 sm:p-6 lg:p-8 rounded-2xl lg:rounded-3xl flex flex-col h-full shadow-2xl min-h-[400px]" style={{ animationDelay: '0.2s' }}>
                    <div className="shrink-0 mb-6 sm:mb-8">
                        <h3 className="font-bold text-xl sm:text-2xl text-[var(--text)] flex items-center gap-2 sm:gap-3">
                            <ShieldAlert className="w-6 h-6 sm:w-7 sm:h-7 text-[rgb(var(--a1))] drop-shadow-[0_0_8px_rgba(var(--a1),0.4)] shrink-0" />
                            Rule Builder
                        </h3>
                        <p className="text-sm sm:text-base text-[var(--text)] opacity-60 mt-2 font-medium">Target specific applications for strict blocking or daily allowance tracking.</p>
                    </div>

                    <div className="flex flex-col gap-6 shrink-0">
                        <div className="flex gap-2 p-1.5 bg-[var(--bg)] rounded-xl w-fit border border-[var(--panel-border)] shadow-inner">
                            <button onClick={() => setRuleType('block')} className={`px-4 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${ruleType === 'block' ? 'bg-[rgb(var(--a2))] text-white shadow-[0_0_15px_rgba(var(--a2),0.4)]' : 'text-[var(--text)] opacity-50 hover:opacity-100'}`}>
                                Hard Block
                            </button>
                            <button onClick={() => setRuleType('timer')} className={`px-4 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${ruleType === 'timer' ? 'bg-[rgb(var(--a1))] text-white shadow-[0_0_15px_rgba(var(--a1),0.4)]' : 'text-[var(--text)] opacity-50 hover:opacity-100'}`}>
                                Daily Limit
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex gap-3 relative z-30">
                            <div className="relative flex-grow flex flex-col sm:flex-row gap-2 sm:gap-3">
                                <div className="relative flex-grow">
                                    <Input
                                        type="text"
                                        value={inputValue}
                                        onFocus={() => setShowSuggestions(true)}
                                        onChange={(e) => {
                                            setInputValue(e.target.value);
                                            setShowSuggestions(true);
                                        }}
                                        placeholder="Search detected apps..."
                                        className="h-12 sm:h-14 border-2 rounded-xl px-4 sm:px-5 text-sm sm:text-base font-bold flex-1"
                                    />
                                    {showSuggestions && filteredSuggestions.length > 0 && (
                                        <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-[var(--bg)]/95 backdrop-blur-3xl border border-[rgba(var(--a1),0.4)] rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.3)] z-50 overflow-hidden flex flex-col">
                                            <div className="flex flex-col max-h-60 overflow-y-auto custom-scrollbar">
                                                {filteredSuggestions.map(app => (
                                                    <button
                                                        key={app}
                                                        type="button"
                                                        onClick={() => handleAddApp(app)}
                                                        className="text-left px-5 py-4 text-sm text-[var(--text)] hover:bg-[rgba(var(--a1),0.2)] transition-colors border-b border-[var(--panel-border)] last:border-0 cursor-pointer font-bold flex items-center gap-4"
                                                    >
                                                        <div className="w-6 h-6 flex items-center justify-center flex-shrink-0 drop-shadow-md">
                                                            {appIcons[app] ? <img src={appIcons[app]} alt="" className="max-w-full max-h-full object-contain" /> : <GenericAppIcon />}
                                                        </div>
                                                        <span className="flex-grow text-base tracking-wide">{app}</span>
                                                        <span className="text-xs text-[rgb(var(--a1))] bg-[rgba(var(--a1),0.1)] px-3 py-1 rounded font-black border border-[rgba(var(--a1),0.2)] tracking-widest">SELECT</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <button type="button" onClick={handleBrowseExe} className="h-14 w-14 flex items-center justify-center bg-[var(--bg)] border-2 border-[var(--panel-border)] rounded-xl text-[var(--text)] opacity-50 hover:opacity-100 hover:border-[rgb(var(--a1))] hover:text-[rgb(var(--a1))] transition-all shadow-inner shrink-0 cursor-pointer" title="Browse for executable">
                                    <FolderOpen className="w-6 h-6" />
                                </button>
                            </div>

                            {ruleType === 'timer' && (
                                <div className="flex items-center justify-between bg-[var(--bg)] border-2 border-[var(--panel-border)] focus-within:border-[rgb(var(--a1))] focus-within:shadow-[0_0_15px_rgba(var(--a1),0.15)] transition-all rounded-xl px-2 py-1 min-w-[140px]">
                                    <button type="button" onClick={() => setTimeLimitMinutes(Math.max(1, timeLimitMinutes - 15))} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[rgba(var(--a1),0.15)] text-[var(--text)] font-bold transition-colors">
                                        -
                                    </button>
                                    <div className="flex items-center justify-center flex-1 gap-1">
                                        <input type="number" min="1" max="1440" value={timeLimitMinutes} onChange={(e) => setTimeLimitMinutes(Number(e.target.value) || 0)} className="w-10 bg-transparent text-[rgb(var(--a1))] text-right font-black text-xl focus:outline-none drop-shadow-[0_0_5px_rgba(var(--a1),0.3)] [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]" required />
                                        <span className="text-[var(--text)] opacity-50 font-bold text-xs mt-1">m</span>
                                    </div>
                                    <button type="button" onClick={() => setTimeLimitMinutes(Math.min(1440, timeLimitMinutes + 15))} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[rgba(var(--a1),0.15)] text-[var(--text)] font-bold transition-colors">
                                        +
                                    </button>
                                </div>
                            )}

                            <button type="submit" className="bg-[rgb(var(--a1))] hover:brightness-125 text-[var(--bg)] px-6 h-[56px] rounded-xl text-sm font-black tracking-widest transition-all cursor-pointer shadow-[0_0_20px_rgba(var(--a1),0.4)]">
                                ADD RULE
                            </button>
                        </form>
                        {showSuggestions && <div className="fixed inset-0 z-20" onClick={() => setShowSuggestions(false)} />}
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-2 mb-2 items-center z-10">
                        <span className="text-[10px] sm:text-xs font-black text-[var(--text)] opacity-40 uppercase tracking-widest mr-1">Quick Target:</span>
                        {['YouTube', 'Discord', 'Netflix', 'Twitter', 'Steam', 'TikTok', 'Instagram'].map(app => (
                            <button
                                key={app} type="button"
                                onClick={() => handleQuickAdd(app)}
                                className="px-3 py-1.5 bg-[var(--bg)] border border-[var(--panel-border)] text-[var(--text)] opacity-70 hover:opacity-100 hover:border-[rgb(var(--a1))] hover:text-[rgb(var(--a1))] rounded-lg text-[10px] sm:text-xs font-bold transition-all shadow-inner cursor-pointer"
                            >
                                + {app}
                            </button>
                        ))}
                    </div>

                    <div className="mt-8 flex flex-col flex-1 min-h-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 sm:px-2 mb-3">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <FilterIcon className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text)] opacity-50" />
                                    <select value={ruleFilter} onChange={(e) => setRuleFilter(e.target.value as any)} className="pl-8 pr-3 py-1.5 bg-[var(--bg)] border border-[var(--panel-border)] rounded-lg text-xs font-bold text-[var(--text)] opacity-70 hover:opacity-100 outline-none focus:border-[rgb(var(--a1))] transition-colors appearance-none cursor-pointer">
                                        <option value="all">All Rules</option>
                                        <option value="block">Hard Blocks Only</option>
                                        <option value="timer">Time Limits Only</option>
                                    </select>
                                </div>
                                <Input type="text" value={ruleSearchQuery} onChange={(e) => setRuleSearchQuery(e.target.value)} placeholder="Filter rules..." className="h-8 text-xs w-32 sm:w-40 rounded-lg px-3" />
                            </div>
                            <button type="button" onClick={handleClearAllRules} disabled={Object.keys(blockList).length === 0} className="flex items-center gap-1.5 text-[10px] sm:text-xs font-black text-red-400 hover:text-red-500 hover:bg-red-500/10 px-2 py-1 rounded transition-colors uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">
                                <TrashIcon className="w-3.5 h-3.5" /> Clear All
                            </button>
                        </div>
                        <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-2 pb-4">
                            {filteredRules.map(([app, rule]) => {
                                const isEditing = editingRuleApp === app;
                                return (
                                    <div key={app} onContextMenu={(e) => onContextMenu?.(e, app)} className="flex items-center justify-between bg-[var(--bg)] border border-[var(--panel-border)] p-3 sm:p-4 rounded-xl text-sm group transition-all hover:border-[rgba(var(--a1),0.3)] hover:shadow-lg cursor-context-menu">
                                        <div className="flex items-center gap-3 sm:gap-4 overflow-hidden pr-2">
                                            <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-[var(--panel-bg)] rounded-lg sm:rounded-xl border border-[var(--panel-border)] p-1 sm:p-1.5 flex-shrink-0 drop-shadow-md shadow-inner">
                                                {appIcons[app] ? <img src={appIcons[app]} alt="" className="max-w-full max-h-full object-contain" /> : <GenericAppIcon />}
                                            </div>
                                            <span className="text-[var(--text)] font-bold text-sm sm:text-base tracking-wide truncate" title={app}>{app}</span>
                                        </div>
                                        {isEditing ? (
                                            <div className="flex items-center gap-2 shrink-0">
                                                <div className="flex items-center justify-between bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-lg px-1 py-0.5 shadow-inner">
                                                    <button onClick={() => setEditingRuleLimit(Math.max(5, editingRuleLimit - 5))} className="w-6 h-6 flex items-center justify-center hover:bg-[rgba(var(--a1),0.15)] text-[var(--text)] font-bold rounded">-</button>
                                                    <input type="number" min="5" value={editingRuleLimit} onChange={(e) => setEditingRuleLimit(Number(e.target.value) || 5)} className="w-10 bg-transparent text-[rgb(var(--a1))] text-center font-bold text-sm outline-none [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
                                                    <button onClick={() => setEditingRuleLimit(editingRuleLimit + 5)} className="w-6 h-6 flex items-center justify-center hover:bg-[rgba(var(--a1),0.15)] text-[var(--text)] font-bold rounded">+</button>
                                                </div>
                                                <button onClick={() => saveEditedTimer(app)} className="p-1.5 bg-[rgb(var(--a1))] text-[var(--bg)] rounded-md shadow-md hover:brightness-110 cursor-pointer transition-all">
                                                    <Check className="w-4 h-4 sm:w-4.5 sm:h-4.5" strokeWidth={3} />
                                                </button>
                                                <button onClick={() => setEditingRuleApp(null)} className="p-1.5 bg-[var(--panel-border)] text-[var(--text)] rounded-md hover:bg-opacity-80 cursor-pointer transition-all">
                                                    <X className="w-4 h-4 sm:w-4.5 sm:h-4.5" strokeWidth={2.5} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                                                {rule === 'fully_blocked' ? (
                                                    <span className="text-[10px] sm:text-xs text-[rgb(var(--a2))] bg-[rgba(var(--a2),0.1)] px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg border border-[rgba(var(--a2),0.3)] font-black tracking-widest drop-shadow-[0_0_5px_rgba(var(--a2),0.2)]">HARD BLOCKED</span>
                                                ) : (
                                                    <span className="text-[10px] sm:text-xs text-[rgb(var(--a1))] bg-[rgba(var(--a1),0.1)] px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg border border-[rgba(var(--a1),0.3)] font-black tracking-widest drop-shadow-[0_0_5px_rgba(var(--a1),0.2)]">{(rule / 60)}M DAILY LIMIT</span>
                                                )}
                                                <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                                                    {rule !== 'fully_blocked' && (
                                                        <button onClick={() => { setEditingRuleApp(app); setEditingRuleLimit(rule as number / 60); }} className="text-[var(--text)] hover:text-[rgb(var(--a1))] transition-colors cursor-pointer p-1.5 rounded-md hover:bg-[rgba(var(--a1),0.1)]">
                                                            <EditIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                                                        </button>
                                                    )}
                                                    <button onClick={() => handleRemoveApp(app)} className="text-[var(--text)] hover:text-[rgb(var(--a2))] transition-colors cursor-pointer p-1.5 rounded-md hover:bg-[rgba(var(--a2),0.1)]">
                                                        <X className="w-4 h-4 sm:w-4.5 sm:h-4.5" strokeWidth={2.5} />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            {filteredRules.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full min-h-[150px] text-center border-2 border-dashed border-[rgba(var(--a1),0.2)] rounded-xl bg-gradient-to-b from-[rgba(var(--a1),0.05)] to-transparent">
                                    <ShieldAlert className="w-10 h-10 mb-3 opacity-40 text-[var(--text)]" />
                                    <span className="text-sm text-[var(--text)] opacity-70 font-black tracking-widest uppercase">No Rules Found</span>
                                    <span className="text-xs text-[var(--text)] opacity-40 mt-1 font-medium">{Object.keys(blockList).length === 0 ? 'Add a rule above to engage protection.' : 'Adjust your filters to see more rules.'}</span>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}

export default Controls