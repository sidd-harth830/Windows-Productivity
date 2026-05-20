import React, { useState } from 'react'
import { GenericAppIcon } from '../App'

export type BlockRule = 'fully_blocked' | number;

interface ControlsProps {
    isFocusMode: boolean;
    setIsFocusMode: (enabled: boolean) => void;
    blockList: Record<string, BlockRule>;
    setBlockList: (list: Record<string, BlockRule>) => void;
    availableApps: string[];
    appIcons: Record<string, string>;
}

const Controls: React.FC<ControlsProps> = ({ isFocusMode, setIsFocusMode, blockList, setBlockList, availableApps, appIcons }) => {
    const [inputValue, setInputValue] = useState<string>('');
    const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
    const [ruleType, setRuleType] = useState<'block' | 'timer'>('block');
    const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(30);

    const handleToggleFocus = () => {
        const nextState = !isFocusMode;
        setIsFocusMode(nextState);
        if (window.api && window.api.toggleFocusMode) window.api.toggleFocusMode(nextState);
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

    return (
        <div className="flex flex-col h-full gap-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
            <div className="shrink-0">
                <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-[rgb(var(--a1))] to-[rgb(var(--a2))] text-transparent bg-clip-text font-['Acorn',_sans-serif]">
                    Zeitra Controls
                </h1>
                <p className="text-[var(--text)] opacity-60 text-lg font-medium">Manage your Windows configuration and focus limits.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-0 items-start">

                <div className="lg:col-span-5 flex flex-col gap-6">
                    <div className={`bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-2xl border p-8 rounded-3xl flex flex-col gap-8 transition-all duration-300 shadow-2xl ring-1 ring-white/5 ${isFocusMode ? 'border-[rgba(var(--a2),0.5)] shadow-[0_0_40px_rgba(var(--a2),0.2)]' : 'border-white/10'}`}>
                        <div className="flex items-start justify-between w-full gap-4">
                            <div className="flex flex-col gap-2">
                                <div className={`p-3.5 w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-inner border ${isFocusMode ? 'bg-[rgba(var(--a2),0.2)] text-[rgb(var(--a2))] border-[rgba(var(--a2),0.4)] shadow-[0_0_20px_rgba(var(--a2),0.4)]' : 'bg-[var(--bg)] border-white/10 text-[var(--text)] opacity-50'}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-full h-full">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                                    </svg>
                                </div>
                                <h3 className="font-bold text-xl text-[var(--text)] mt-3">Focus Mode Engine</h3>
                                <p className="text-sm text-[var(--text)] opacity-60 leading-relaxed font-medium">Engage the native Windows blocker to enforce your custom rules and time limits globally.</p>
                            </div>

                            <button onClick={handleToggleFocus} className={`w-16 h-9 flex flex-shrink-0 items-center rounded-full p-1 cursor-pointer transition-all duration-300 focus:outline-none mt-1 border ${isFocusMode ? 'bg-[rgb(var(--a2))] border-[rgba(var(--a2),0.8)] shadow-[0_0_25px_rgba(var(--a2),0.6)]' : 'bg-gray-800 border-white/10'}`}>
                                <div className={`bg-white w-7 h-7 rounded-full shadow-md transform transition-transform duration-300 ${isFocusMode ? 'translate-x-7' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-7 bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl flex flex-col h-full shadow-2xl ring-1 ring-white/5">
                    <div className="shrink-0 mb-8">
                        <h3 className="font-bold text-2xl text-[var(--text)] flex items-center gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7 text-[rgb(var(--a1))] drop-shadow-[0_0_8px_rgba(var(--a1),0.4)]">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                            </svg>
                            Rule Builder
                        </h3>
                        <p className="text-[var(--text)] opacity-60 mt-2 font-medium">Target specific applications for strict blocking or daily allowance tracking.</p>
                    </div>

                    <div className="flex flex-col gap-6 shrink-0">
                        <div className="flex gap-2 p-1.5 bg-[var(--bg)] rounded-xl w-fit border border-white/5 shadow-inner">
                            <button onClick={() => setRuleType('block')} className={`px-5 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${ruleType === 'block' ? 'bg-[rgb(var(--a2))] text-white shadow-[0_0_15px_rgba(var(--a2),0.4)]' : 'text-[var(--text)] opacity-50 hover:opacity-100'}`}>
                                Hard Block
                            </button>
                            <button onClick={() => setRuleType('timer')} className={`px-5 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${ruleType === 'timer' ? 'bg-[rgb(var(--a1))] text-white shadow-[0_0_15px_rgba(var(--a1),0.4)]' : 'text-[var(--text)] opacity-50 hover:opacity-100'}`}>
                                Daily Limit
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex gap-3 relative z-30">
                            <div className="relative flex-grow">
                                <input
                                    type="text"
                                    value={inputValue}
                                    onFocus={() => setShowSuggestions(true)}
                                    onChange={(e) => {
                                        setInputValue(e.target.value);
                                        setShowSuggestions(true);
                                    }}
                                    placeholder="Search detected apps..."
                                    className="w-full bg-[var(--bg)] border border-white/10 rounded-xl px-5 py-4 text-sm text-[var(--text)] focus:outline-none focus:border-[rgb(var(--a1))] focus:ring-1 focus:ring-[rgb(var(--a1))] transition-all font-bold shadow-inner"
                                />
                                {showSuggestions && inputValue.length > 0 && filteredSuggestions.length > 0 && (
                                    <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-[#1A1A1A] border border-[rgba(var(--a1),0.4)] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] z-50 overflow-hidden flex flex-col max-h-60 overflow-y-auto">
                                        {filteredSuggestions.map(app => (
                                            <button
                                                key={app}
                                                type="button"
                                                onClick={() => handleAddApp(app)}
                                                className="text-left px-5 py-4 text-sm text-[var(--text)] hover:bg-[rgba(var(--a1),0.2)] transition-colors border-b border-white/5 last:border-0 cursor-pointer font-bold flex items-center gap-4"
                                            >
                                                <div className="w-6 h-6 flex items-center justify-center flex-shrink-0 drop-shadow-md">
                                                    {appIcons[app] ? <img src={appIcons[app]} alt="" className="max-w-full max-h-full object-contain" /> : <GenericAppIcon />}
                                                </div>
                                                <span className="flex-grow text-base tracking-wide">{app}</span>
                                                <span className="text-xs text-[rgb(var(--a1))] bg-[rgba(var(--a1),0.1)] px-3 py-1 rounded font-black border border-[rgba(var(--a1),0.2)] tracking-widest">SELECT</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {ruleType === 'timer' && (
                                <div className="flex items-center gap-2 bg-[var(--bg)] border border-[rgba(var(--a1),0.5)] shadow-[0_0_15px_rgba(var(--a1),0.15)] rounded-xl px-4 py-2">
                                    <input type="number" min="1" max="1440" value={timeLimitMinutes} onChange={(e) => setTimeLimitMinutes(Number(e.target.value))} className="w-14 bg-transparent text-[rgb(var(--a1))] text-center font-black text-lg focus:outline-none drop-shadow-[0_0_5px_rgba(var(--a1),0.3)]" />
                                    <span className="text-[var(--text)] opacity-50 font-bold pr-1">MIN</span>
                                </div>
                            )}

                            <button type="submit" className="bg-[rgb(var(--a1))] hover:brightness-125 text-[var(--bg)] px-6 py-4 rounded-xl text-sm font-black tracking-widest transition-all cursor-pointer shadow-[0_0_20px_rgba(var(--a1),0.4)]">
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
                        <div className="flex flex-col gap-3 overflow-y-auto pr-2 pb-4">
                            {Object.entries(blockList).map(([app, rule]) => (
                                <div key={app} className="flex items-center justify-between bg-[var(--bg)] border border-white/5 p-4 rounded-xl text-sm group transition-all hover:border-[rgba(var(--a1),0.3)] hover:shadow-lg">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 flex items-center justify-center bg-black/40 rounded-xl border border-white/10 p-1.5 flex-shrink-0 drop-shadow-md shadow-inner">
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
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
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