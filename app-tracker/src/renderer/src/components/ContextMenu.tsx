import React from 'react'
import { RefreshCw } from './Icons'

interface ContextMenuProps {
    contextMenu: { x: number; y: number; appName: string } | null;
    onClose: () => void;
    onRefreshIcon: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ contextMenu, onClose, onRefreshIcon }) => {
    if (!contextMenu) return null;

    return (
        <>
            <div className="fixed inset-0 z-[100]" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }}></div>
            <div 
                className="fixed z-[101] bg-[var(--panel-bg)] backdrop-blur-3xl border border-[var(--panel-border)] p-1.5 rounded-xl shadow-2xl flex flex-col min-w-[170px] animate-in fade-in zoom-in-95 duration-200"
                style={{ top: Math.min(contextMenu.y, window.innerHeight - 100), left: Math.min(contextMenu.x, window.innerWidth - 180) }}
            >
                <div className="px-3 py-2 text-[11px] font-black text-[var(--text)] opacity-50 uppercase tracking-widest border-b border-[var(--panel-border)] mb-1 truncate drop-shadow-sm">
                    {contextMenu.appName}
                </div>
                <button onClick={onRefreshIcon} className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-[var(--text)] hover:bg-[rgba(var(--a1),0.15)] hover:text-[rgb(var(--a1))] rounded-lg transition-colors text-left">
                    <RefreshCw className="w-4 h-4" />
                    Refresh Icon
                </button>
            </div>
        </>
    );
}

export default ContextMenu;