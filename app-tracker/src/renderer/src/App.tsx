import React, { useEffect, useState } from 'react'

interface WindowData {
  name: string;
  title: string;
  focusTime: number; // NEW
}

const App: React.FC = () => {
  const [activeApp, setActiveApp] = useState<WindowData | null>(null);

  useEffect(() => {
    if (window.api) {
      window.api.onWindowUpdate((data: WindowData) => {
        setActiveApp(data);
      });
    }
  }, []);

  // Helper function to format seconds into a clean string
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 overflow-hidden relative">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-50 shadow-2xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-50 shadow-2xl"></div>

      <div className="relative z-10 w-full max-w-3xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text text-center">
          Productivity Monitor
        </h1>
        <p className="text-gray-400 mb-8 text-lg text-center">
          Live System Tracking Active
        </p>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-black/30 border border-white/5 p-6 rounded-2xl flex flex-col items-center justify-center transition-transform hover:scale-105 cursor-default min-h-[140px]">
            <span className="text-gray-400 text-sm mb-2">Current Active App</span>
            <span className="text-2xl font-semibold text-center text-blue-300">
              {activeApp ? activeApp.name : "Waiting for data..."}
            </span>
            <span className="text-xs text-gray-500 mt-2 truncate w-full text-center px-4">
              {activeApp ? activeApp.title : "..."}
            </span>
          </div>
          
          <div className="bg-black/30 border border-white/5 p-6 rounded-2xl flex flex-col items-center justify-center transition-transform hover:scale-105 cursor-default min-h-[140px]">
            <span className="text-gray-400 text-sm mb-2">Focus Time</span>
            <span className="text-2xl font-semibold">
              {/* Display the beautifully formatted time! */}
              {activeApp ? formatTime(activeApp.focusTime) : "0s"}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App