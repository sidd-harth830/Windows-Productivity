import React, { useState } from 'react'

interface ControlsProps {
    isFocusMode: boolean;
    setIsFocusMode: (enabled: boolean) => void;
    blockList: string[];
    setBlockList: (list: string[]) => void;
}

const Controls: React.FC<ControlsProps> = ({ isFocusMode, setIsFocusMode, blockList, setBlockList }) => {
    const [inputValue, setInputValue] = useState<string>('');

    const handleToggleFocus = () => {
        const nextState = !isFocusMode;
        setIsFocusMode(nextState);
        if (window.api && window.api.toggleFocusMode) {
            window.api.toggleFocusMode(nextState);
        }
    };

    const handleAddApp = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = inputValue.trim().toLowerCase();

        if (trimmed && !blockList.includes(trimmed)) {
            const updatedList = [...blockList, trimmed];
            setBlockList(updatedList);
            setInputValue('');

            // Send the updated array across the IPC channel to Windows backend
            if (window.api && window.api.updateBlockList) {
                window.api.updateBlockList(updatedList);
            }
        }
    };

    const handleRemoveApp = (appToRemove: string) => {
        const updatedList = blockList.filter(app => app !== appToRemove);
        setBlockList(updatedList);

        if (window.api && window.api.updateBlockList) {
            window.api.updateBlockList(updatedList);
        }
    };

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

                    {/* Form Entry */}
                    <form onSubmit={handleAddApp} className="flex gap-2">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="e.g. spotify.exe, notepad"
                            className="flex-grow bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                        />
                        <button
                            type="submit"
                            className="bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer"
                        >
                            Add
                        </button>
                    </form>

                    {/* List Display */}
                    <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
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