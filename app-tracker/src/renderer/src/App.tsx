import React from 'react'

const App: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 overflow-hidden relative">
      
      
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-50 shadow-2xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-50 shadow-2xl"></div>

      
      <div className="relative z-10 w-full max-w-3xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
          Productivity Monitor
        </h1>
        <p className="text-gray-400 mb-8 text-lg">
          Welcome to your dark-themed workspace. System tracking will appear here.
        </p>

        
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-black/30 border border-white/5 p-6 rounded-2xl flex flex-col items-center transition-transform hover:scale-105 cursor-default">
            <span className="text-gray-400 text-sm mb-2">Most Used App</span>
            <span className="text-2xl font-semibold">VS Code</span>
          </div>
          <div className="bg-black/30 border border-white/5 p-6 rounded-2xl flex flex-col items-center transition-transform hover:scale-105 cursor-default">
            <span className="text-gray-400 text-sm mb-2">Focus Time</span>
            <span className="text-2xl font-semibold">2h 45m</span>
          </div>
        </div>
      </div>
      
    </div>
  )
}

export default App