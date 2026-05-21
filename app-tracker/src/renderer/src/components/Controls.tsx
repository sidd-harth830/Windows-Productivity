import React, { useState } from 'react'
import { GenericAppIcon, X, Clock, ShieldBan, ShieldAlert, FolderOpen } from './Icons'
import { Switch } from '../switch'
import { Input } from '../input'

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
        <div className="flex flex-col h-full gap-8 max-w-6xl mx-auto">
            <div className="stagger-item shrink-0" style={{ animationDelay: '0.05s' }}>
                <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-[rgb(var(--a1))] to-[rgb(var(--a2))] text-transparent bg-clip-text font-['Acorn',_sans-serif]">
                    Zeitra Controls
                </h1>
                <p className="text-[var(--text)] opacity-60 text-lg font-medium">Manage your Windows configuration and focus limits.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-0 items-start">

                <div className="lg:col-span-5 flex flex-col gap-6">
                    <div className={`stagger-item bg-[var(--panel-bg)] backdrop-blur-2xl border p-8 rounded-3xl flex flex-col gap-8 transition-all duration-300 shadow-xl ${isFocusMode ? 'border-[rgba(var(--a2),0.5)] shadow-[0_0_40px_rgba(var(--a2),0.2)]' : 'border-[var(--panel-border)]'}`} style={{ animationDelay: '0.1s' }}>
                        <div className="flex items-start justify-between w-full gap-4">
                            <div className="flex flex-col gap-2">
                                <div className={`p-3.5 w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-inner border ${isFocusMode ? 'bg-[rgba(var(--a2),0.2)] text-[rgb(var(--a2))] border-[rgba(var(--a2),0.4)] shadow-[0_0_20px_rgba(var(--a2),0.4)]' : 'bg-[var(--bg)] border-[var(--panel-border)] text-[var(--text)] opacity-50'}`}>
                                    <ShieldBan className="w-full h-full" />
                                </div>
                                <h3 className="font-bold text-xl text-[var(--text)] mt-3">Focus Mode Engine</h3>
                                <p className="text-sm text-[var(--text)] opacity-60 leading-relaxed font-medium">Engage the native Windows blocker to enforce your custom rules and time limits globally.</p>
                            </div>

                            <div className="mt-1">
                                <Switch checked={isFocusMode} onCheckedChange={handleToggleFocus} className="data-[state=checked]:bg-[rgb(var(--a2))]" />
                            </div>
                        </div>
                    </div>

                    <div className="stagger-item bg-[var(--panel-bg)] backdrop-blur-2xl border border-[var(--panel-border)] p-8 rounded-3xl flex flex-col gap-6 transition-all duration-300 shadow-xl" style={{ animationDelay: '0.15s' }}>
                        <div className="flex items-start justify-between w-full gap-4">
                            <div className="flex flex-col gap-2">
                                <div className="p-3.5 w-14 h-14 rounded-2xl flex items-center justify-center bg-[var(--bg)] border-[var(--panel-border)] text-[var(--text)] opacity-50 shadow-inner border">
                                    <Clock className="w-full h-full" />
                                </div>
                                <h3 className="font-bold text-xl text-[var(--text)] mt-3">Offline Log</h3>
                                <p className="text-sm text-[var(--text)] opacity-60 leading-relaxed font-medium">Add time manually for reading, meetings, or brainstorming away from the screen.</p>
                            </div>
                        </div>

                        <form onSubmit={handleAddOfflineTime} className="flex flex-col gap-3 relative z-30 mt-2">
                            <Input
                                type="text" value={offlineActivity} onChange={(e) => setOfflineActivity(e.target.value)}
                                placeholder="Activity (e.g., Reading Book)"
                                className="h-14 border-2 rounded-xl px-5 text-base font-bold" required
                            />
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-between bg-[var(--bg)] border-2 border-[var(--panel-border)] focus-within:border-[rgb(var(--a1))] focus-within:shadow-[0_0_15px_rgba(var(--a1),0.15)] transition-all rounded-xl px-2 py-1.5 w-1/2">
                                    <button type="button" onClick={() => setOfflineMinutes(Math.max(1, offlineMinutes - 5))} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[rgba(var(--a1),0.15)] text-[var(--text)] font-bold transition-colors">
                                        -
                                    </button>
                                    <div className="flex items-center justify-center flex-1 gap-1">
                                        <input type="number" min="1" value={offlineMinutes} onChange={(e) => setOfflineMinutes(Number(e.target.value) || 0)} className="w-12 bg-transparent text-[rgb(var(--a1))] text-right font-black text-xl focus:outline-none drop-shadow-[0_0_5px_rgba(var(--a1),0.3)] [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]" required />
                                        <span className="text-[var(--text)] opacity-50 font-bold text-xs mt-1">m</span>
                                    </div>
                                    <button type="button" onClick={() => setOfflineMinutes(offlineMinutes + 5)} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[rgba(var(--a1),0.15)] text-[var(--text)] font-bold transition-colors">
                                        +
                                    </button>
                                </div>
                                <button type="submit" className="w-1/2 h-[56px] bg-[rgb(var(--a1))] hover:brightness-125 text-[var(--bg)] px-6 py-0 rounded-xl text-sm font-black tracking-widest transition-all cursor-pointer shadow-[0_0_20px_rgba(var(--a1),0.4)]">
                                    ADD TIME
                                </button>
                            </div>
                        </form>

                        {offlineApps.length > 0 && (
                            <div className="mt-2 border-t border-[var(--panel-border)] pt-4 flex flex-col gap-2">
                                <span className="text-xs text-[var(--text)] opacity-50 uppercase tracking-widest font-black mb-1">Recent Offline Entries</span>
                                {offlineApps.map(app => (
                                    <div key={app} className="flex items-center justify-between bg-[var(--panel-bg)] px-4 py-3 rounded-xl border border-[var(--panel-border)] shadow-inner">
                                        <span className="text-sm font-bold text-[var(--text)]">{app} <span className="opacity-50 ml-1">({Math.round(allUsage[app]/60)}m)</span></span>
                                        <button type="button" onClick={() => handleDeleteOffline(app)} className="text-[rgb(var(--a2))] opacity-70 hover:opacity-100 hover:scale-110 transition-all cursor-pointer">
                                            <X className="w-5 h-5" strokeWidth={2.5} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="stagger-item lg:col-span-7 bg-[var(--panel-bg)] backdrop-blur-2xl border border-[var(--panel-border)] p-8 rounded-3xl flex flex-col h-full shadow-xl" style={{ animationDelay: '0.2s' }}>
                    <div className="shrink-0 mb-8">
                        <h3 className="font-bold text-2xl text-[var(--text)] flex items-center gap-3">
                            <ShieldAlert className="w-7 h-7 text-[rgb(var(--a1))] drop-shadow-[0_0_8px_rgba(var(--a1),0.4)]" />
                            Rule Builder
                        </h3>
                        <p className="text-[var(--text)] opacity-60 mt-2 font-medium">Target specific applications for strict blocking or daily allowance tracking.</p>
                    </div>

                    <div className="flex flex-col gap-6 shrink-0">
                        <div className="flex gap-2 p-1.5 bg-[var(--bg)] rounded-xl w-fit border border-[var(--panel-border)] shadow-inner">
                            <button onClick={() => setRuleType('block')} className={`px-5 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${ruleType === 'block' ? 'bg-[rgb(var(--a2))] text-white shadow-[0_0_15px_rgba(var(--a2),0.4)]' : 'text-[var(--text)] opacity-50 hover:opacity-100'}`}>
                                Hard Block
                            </button>
                            <button onClick={() => setRuleType('timer')} className={`px-5 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${ruleType === 'timer' ? 'bg-[rgb(var(--a1))] text-white shadow-[0_0_15px_rgba(var(--a1),0.4)]' : 'text-[var(--text)] opacity-50 hover:opacity-100'}`}>
                                Daily Limit
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex gap-3 relative z-30">
                            <div className="relative flex-grow flex gap-2">
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
                                        className="h-14 border-2 rounded-xl px-5 text-base font-bold flex-1"
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

                    <div className="mt-8 flex flex-col flex-1 min-h-0">
                        <div className="flex items-center justify-between px-2 mb-3 text-xs font-black text-[var(--text)] opacity-40 uppercase tracking-widest">
                            <span>Target App</span>
                            <span>Enforcement Rule</span>
                        </div>
                        <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-2 pb-4">
                            {Object.entries(blockList).map(([app, rule]) => (
                                <div key={app} onContextMenu={(e) => onContextMenu?.(e, app)} className="flex items-center justify-between bg-[var(--bg)] border border-[var(--panel-border)] p-4 rounded-xl text-sm group transition-all hover:border-[rgba(var(--a1),0.3)] hover:shadow-lg cursor-context-menu">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 flex items-center justify-center bg-[var(--panel-bg)] rounded-xl border border-[var(--panel-border)] p-1.5 flex-shrink-0 drop-shadow-md shadow-inner">
                                            {appIcons[app] ? <img src={appIcons[app]} alt="" className="max-w-full max-h-full object-contain" /> : <GenericAppIcon />}
                                        </div>
                                        <span className="text-[var(--text)] font-bold text-base tracking-wide">{app}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {rule === 'fully_blocked' ? (
                                            <span className="text-xs text-[rgb(var(--a2))] bg-[rgba(var(--a2),0.1)] px-3 py-1.5 rounded-lg border border-[rgba(var(--a2),0.3)] font-black tracking-widest drop-shadow-[0_0_5px_rgba(var(--a2),0.2)]">HARD BLOCKED</span>
                                        ) : (
                                            <span className="text-xs text-[rgb(var(--a1))] bg-[rgba(var(--a1),0.1)] px-3 py-1.5 rounded-lg border border-[rgba(var(--a1),0.3)] font-black tracking-widest drop-shadow-[0_0_5px_rgba(var(--a1),0.2)]">{(rule / 60)}M DAILY LIMIT</span>
                                        )}
                                        <button onClick={() => handleRemoveApp(app)} className="text-[var(--text)] opacity-30 hover:opacity-100 hover:text-[rgb(var(--a2))] transition-colors cursor-pointer p-2 rounded-md hover:bg-[rgba(var(--a2),0.15)] group-hover:opacity-100">
                                            <X className="w-5 h-5" strokeWidth={2.5} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {Object.keys(blockList).length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full min-h-[150px] text-center border-2 border-dashed border-[rgba(var(--a1),0.2)] rounded-xl bg-gradient-to-b from-[rgba(var(--a1),0.05)] to-transparent">
                                    <span className="text-3xl mb-3 opacity-90 drop-shadow-[0_0_10px_rgba(var(--a1),0.5)]">🛡️</span>
                                    <span className="text-sm text-[rgb(var(--a1))] opacity-90 font-black tracking-widest">SYSTEM UNRESTRAINED</span>
                                    <span className="text-xs text-[var(--text)] opacity-50 mt-2 font-medium">Add a rule above to engage protection.</span>
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