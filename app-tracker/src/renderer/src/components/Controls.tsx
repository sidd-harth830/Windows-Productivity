import React, { useState } from 'react'
import { GenericAppIcon } from '../App'

export type BlockRule = 'fully_blocked' | number;

interface ControlsProps {
    isFocusMode: boolean;
    setIsFocusMode: (enabled: boolean) => void;
    blockList: Record<string, BlockRule>;
    setBlockList: (list: Record<string, BlockRule>) => void;
    availableApps: string[];
    appIcons: Record<string, string>; // NEW
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
        <div className="flex flex-col gap-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-[#1E90FF] to-[#FF0099] text-transparent bg-clip-text font-['Acorn',_sans-serif]">
                    System Controls
                </h1>
                <p className="text-gray-400 text-lg">Manage your Windows configuration and focus limits.</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                <div className={`backdrop-blur-xl border p-6 rounded-3xl flex items-center justify-between gap-4 transition-all duration-300 ${isFocusMode ? 'bg-[#FF0099]/10 border-[#FF0099]/40 shadow-[0_0_30px_rgba(255,0,153,0.15)]' : 'bg-white/5 border-white/10'}`}>
                    <div className="flex items-center gap-4 min-w-0">
                        <div className={`p-3 rounded-2xl transition-colors duration-300 ${isFocusMode ? 'bg-[#FF0099]/20 text-[#FF0099] shadow-[0_0_15px_rgba(255,0,153,0.3)]' : 'bg-white/5 text-gray-400'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                            </svg>
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-semibold text-lg text-white truncate">Focus Mode Engine</h3>
                            <p className="text-sm text-gray-400 truncate">Enforce custom blocks and time limits.</p>
                        </div>
                    </div>

                    <button onClick={handleToggleFocus} className={`w-14 h-8 flex flex-shrink-0 items-center rounded-full p-1 cursor-pointer transition-all duration-300 focus:outline-none ${isFocusMode ? 'bg-[#FF0099] shadow-[0_0_15px_rgba(255,0,153,0.5)]' : 'bg-gray-700'}`}>
                        <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${isFocusMode ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                </div>

                <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl flex flex-col gap-5">
                    <h3 className="font-semibold text-xl text-white flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-[#1E90FF]">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                        </svg>
                        Focus Rule Builder
                    </h3>

                    <div className="flex flex-col gap-4">
                        <div className="flex gap-2 p-1 bg-black/40 rounded-xl w-fit border border-white/5">
                            <button onClick={() => setRuleType('block')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${ruleType === 'block' ? 'bg-[#FF0099] text-white shadow-[0_0_10px_rgba(255,0,153,0.3)]' : 'text-gray-400 hover:text-white'}`}>
                                Hard Block
                            </button>
                            <button onClick={() => setRuleType('timer')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${ruleType === 'timer' ? 'bg-[#1E90FF] text-white shadow-[0_0_10px_rgba(30,144,255,0.3)]' : 'text-gray-400 hover:text-white'}`}>
                                Daily Limit
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex gap-2">
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
                                    className="w-full bg-[#0D0D0D] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#1E90FF] transition-colors relative z-20 font-medium"
                                />
                                {showSuggestions && inputValue.length > 0 && filteredSuggestions.length > 0 && (
                                    <div className="absolute top-full left-0 w-full mt-2 bg-[#121212] border border-[#1E90FF]/30 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] z-50 overflow-hidden flex flex-col max-h-48 overflow-y-auto">
                                        {filteredSuggestions.map(app => (
                                            <button
                                                key={app}
                                                type="button"
                                                onClick={() => handleAddApp(app)}
                                                className="text-left px-4 py-3 text-sm text-[#E0E0E0] hover:bg-[#1E90FF]/20 hover:text-white transition-colors border-b border-white/5 last:border-0 cursor-pointer font-medium flex items-center gap-3"
                                            >
                                                {/* INJECT TRAY ICON */}
                                                {appIcons[app] ? <img src={appIcons[app]} alt="" className="w-5 h-5 rounded" /> : <div className="w-5 h-5"><GenericAppIcon /></div>}
                                                <span className="flex-grow">{app}</span>
                                                <span className="text-xs text-[#1E90FF] bg-[#1E90FF]/10 px-2 py-0.5 rounded border border-[#1E90FF]/20 text-mono">Select</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {ruleType === 'timer' && (
                                <div className="flex items-center gap-2 bg-[#0D0D0D] border border-[#1E90FF]/50 shadow-[0_0_10px_rgba(30,144,255,0.1)] rounded-xl px-3 py-2">
                                    <input type="number" min="1" max="1440" value={timeLimitMinutes} onChange={(e) => setTimeLimitMinutes(Number(e.target.value))} className="w-12 bg-transparent text-[#1E90FF] text-center font-bold focus:outline-none" />
                                    <span className="text-gray-400 text-sm pr-1">min</span>
                                </div>
                            )}

                            <button type="submit" className="bg-[#1E90FF] hover:bg-[#1E90FF]/80 text-[#0D0D0D] px-5 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer shadow-[0_0_15px_rgba(30,144,255,0.3)]">
                                Add Rule
                            </button>
                        </form>
                        {showSuggestions && <div className="fixed inset-0 z-10" onClick={() => setShowSuggestions(false)} />}
                    </div>

                    <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1 mt-2">
                        {Object.entries(blockList).map(([app, rule]) => (
                            <div key={app} className="flex items-center justify-between bg-[#0D0D0D]/50 border border-white/5 px-4 py-3 rounded-xl text-sm group transition-colors hover:bg-white/5">
                                <div className="flex items-center gap-3">
                                    {/* INJECT LIST ICON */}
                                    {appIcons[app] ? <img src={appIcons[app]} alt="" className="w-6 h-6 rounded" /> : <div className="w-6 h-6"><GenericAppIcon /></div>}
                                    <span className="text-[#F7F7F7] font-medium">{app}</span>
                                    {rule === 'fully_blocked' ? (
                                        <span className="text-xs text-[#FF0099] bg-[#FF0099]/10 px-2 py-0.5 rounded border border-[#FF0099]/30 font-medium tracking-wide">HARD BLOCKED</span>
                                    ) : (
                                        <span className="text-xs text-[#1E90FF] bg-[#1E90FF]/10 px-2 py-0.5 rounded border border-[#1E90FF]/30 font-medium tracking-wide">{(rule / 60)}M LIMIT / DAY</span>
                                    )}
                                </div>
                                <button onClick={() => handleRemoveApp(app)} className="text-gray-500 hover:text-[#FF0099] transition-colors cursor-pointer text-xs opacity-0 group-hover:opacity-100 font-medium">
                                    REMOVE
                                </button>
                            </div>
                        ))}
                        {Object.keys(blockList).length === 0 && (
                            <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-[#1E90FF]/20 rounded-xl bg-gradient-to-b from-transparent to-[#1E90FF]/5">
                                <span className="text-2xl mb-2">⚡</span>
                                <span className="text-sm text-[#1E90FF]/70 font-medium">System unrestrained. Add a focus rule.</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Controls