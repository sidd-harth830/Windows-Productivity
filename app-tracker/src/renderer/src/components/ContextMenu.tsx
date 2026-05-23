import React, { useEffect, useRef } from 'react';

interface ContextMenuProps {
  contextMenu: { x: number; y: number; appName: string } | null;
  onClose: () => void;
  onRefreshIcon: () => void;
  onHideApp: () => void;
  onOpenLocation: () => void;
  onOpenCategory: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ contextMenu, onClose, onRefreshIcon, onHideApp, onOpenLocation, onOpenCategory }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    };
    if (contextMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [contextMenu, onClose]);

  if (!contextMenu) return null;

  return (
    <div ref={menuRef} className="fixed z-[9999] bg-[var(--panel-bg)] backdrop-blur-3xl border border-[var(--panel-border)] p-1.5 rounded-xl shadow-2xl flex flex-col min-w-[200px]" style={{ top: contextMenu.y, left: contextMenu.x }}>
      <div className="px-3 py-2 text-xs font-black text-[var(--text)] opacity-50 uppercase tracking-widest border-b border-[var(--panel-border)] mb-1 truncate">
        {contextMenu.appName}
      </div>
      <button onClick={onOpenLocation} className="flex items-center gap-3 px-3 py-2 text-sm font-bold text-[var(--text)] hover:bg-[rgba(var(--a1),0.15)] rounded-lg transition-colors cursor-pointer text-left">
        Open File Location
      </button>
      <button onClick={onRefreshIcon} className="flex items-center gap-3 px-3 py-2 text-sm font-bold text-[var(--text)] hover:bg-[rgba(var(--a1),0.15)] rounded-lg transition-colors cursor-pointer text-left">
        Refresh App Icon
      </button>
      <button onClick={onOpenCategory} className="flex items-center gap-3 px-3 py-2 text-sm font-bold text-[var(--text)] hover:bg-[rgba(var(--a1),0.15)] rounded-lg transition-colors cursor-pointer text-left">
        Change Category
      </button>
      <button onClick={onHideApp} className="flex items-center gap-3 px-3 py-2 text-sm font-bold text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer text-left mt-1 border-t border-[var(--panel-border)] pt-2">
        Hide Application
      </button>
    </div>
  );
};
export default ContextMenu;