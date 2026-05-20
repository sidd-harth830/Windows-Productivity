import React, { useState } from 'react'

interface ControlsProps {
    isFocusMode: boolean;
    setIsFocusMode: (enabled: boolean) => void;
    blockList: string[];
    setBlockList: (list: string[]) => void;
}

// Built-in database of common distracting executables for the Autocomplete Tray
const COMMON_APPS = [
    'chrome.exe', 'msedge.exe', 'brave.exe', 'firefox.exe', 'opera.exe',
    'discord.exe', 'spotify.exe', 'steam.exe', 'epicgameslauncher.exe',
    'vlc.exe', 'telegram.exe', 'whatsapp.exe', 'netflix.exe', 'notepad.exe'
];

const Controls: React.FC<ControlsProps> = ({ isFocusMode, setIsFocusMode, blockList, setBlockList }) => {
    const [inputValue, setInputValue] = useState<string>('');
    const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

    const handleToggleFocus = () => {
        const nextState = !isFocusMode;
        setIsFocusMode(nextState);
        if (window.api && window.api.toggleFocusMode) {
            window.api.toggleFocusMode(nextState);
        }
    };

    const handleAddApp = (appToAdd: string) => {
        let trimmed = appToAdd.trim().toLowerCase();

        // Auto-append .exe if the user forgot to type it
        if (trimmed && !trimmed.endsWith('.exe')) {
            trimmed += '.exe';
        }

        if (trimmed && !blockList.includes(trimmed)) {
            const updatedList = [...blockList, trimmed];
            setBlockList(updatedList);
            setInputValue('');
            setShowSuggestions(false);

            // Send the updated array across the IPC channel to Windows backend
            if (window.api && window.api.updateBlockList) {
                window.api.updateBlockList(updatedList);
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleAddApp(inputValue);
    };

    const handleRemoveApp = (appToRemove: string) => {
        const updatedList = blockList.filter(app => app !== appToRemove);
        setBlockList(updatedList);

        if (window.api && window.api.updateBlockList) {
            window.api.updateBlockList(updatedList);
        }
    };

    // Filter suggestions based on what the user is typing
    const filteredSuggestions = COMMON_APPS.filter(app =>
        app.includes(inputValue.toLowerCase()) && !blockList.includes(app)
    );

    return (
        <div className="flex flex-col gap-8">
            <div>
                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
                    System Controls
                </h1>
                <p className="text-gray-400 text-lg">Manage your Windows configuration and focus limits.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* Focus Mode Left Card */}
                <div className={`backdrop-blur-xl border p-6 rounded-3xl flex items-center justify-between gap-4 transition-all duration-300 ${isFocusMode
                    ? 'bg-purple-500/10 border-purple-500/40 shadow-[0_0_25px_rgba(139,92,246,0.15)]'
                    : 'bg-white/5 border-white/10'
                    }`}>
                    <div className="flex items-center gap-4 min-w-0">
                        <div className={`p-3 rounded-2xl transition-colors duration-300 ${isFocusMode ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-gray-400'
                            }`}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                            </svg>
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-semibold text-lg truncate">Focus Mode</h3>
                            <p className="text-sm text-gray-400 truncate">Blocks distracting apps automatically.</p>
                        </div>
                    </div>

                    {/* PERFECT ROUNDED TOGGLE BUTTON */}
                    <button
                        onClick={handleToggleFocus}
                        className={`w-14 h-8 flex flex-shrink-0 items-center rounded-full p-1 cursor-pointer transition-colors duration-300 focus:outline-none ${isFocusMode ? 'bg-purple-500' : 'bg-gray-600'
                            }`}
                    >
                        <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${isFocusMode ? 'translate-x-6' : 'translate-x-0'
                            }`} />
                    </button>
                </div>

                {/* Dynamic Blocklist Management Card Right Side */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl flex flex-col gap-4">
                    <h3 className="font-semibold text-xl text-gray-200 flex items-center gap-2">
                        🛡️ Custom App Blocklist
                    </h3>

                    {/* AUTOCOMPLETE FORM */}
                    <div className="relative">
                        <form onSubmit={handleSubmit} className="flex gap-2">
                            <input
                                type="text"
                                value={inputValue}
                                onFocus={() => setShowSuggestions(true)}
                                onChange={(e) => {
                                    setInputValue(e.target.value);
                                    setShowSuggestions(true);
                                }}
                                placeholder="Search apps (e.g. spotify)"
                                className="flex-grow bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors relative z-20"
                            />
                            <button
                                type="submit"
                                className="bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer relative z-20"
                            >
                                Add
                            </button>
                        </form>

                        {/* THE TRAY (Dropdown Menu) */}
                        {showSuggestions && inputValue.length > 0 && filteredSuggestions.length > 0 && (
                            <div className="absolute top-full left-0 w-[calc(100%-70px)] mt-2 bg-[#1e293b] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col">
                                {filteredSuggestions.slice(0, 5).map(app => (
                                    <button
                                        key={app}
                                        type="button"
                                        onClick={() => handleAddApp(app)}
                                        className="text-left px-4 py-3 text-sm text-gray-300 hover:bg-purple-500/20 hover:text-white transition-colors border-b border-white/5 last:border-0 cursor-pointer flex justify-between items-center"
                                    >
                                        <span>{app}</span>
                                        <span className="text-xs text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded">.exe</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Click-away backdrop to close the tray */}
                        {showSuggestions && (
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setShowSuggestions(false)}
                            />
                        )}
                    </div>

                    {/* List Display */}
                    <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1 mt-2">
                        {blockList.map((app) => (
                            <div key={app} className="flex items-center justify-between bg-white/5 border border-white/5 px-4 py-2 rounded-xl text-sm">
                                <span className="text-gray-300 font-mono">{app}</span>
                                <button
                                    onClick={() => handleRemoveApp(app)}
                                    className="text-gray-500 hover:text-rose-400 transition-colors cursor-pointer text-xs"
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                        {blockList.length === 0 && (
                            <span className="text-xs text-gray-500 text-center py-4">No apps blocked yet. Add one above!</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Controls