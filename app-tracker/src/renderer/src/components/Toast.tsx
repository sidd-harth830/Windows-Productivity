import React from 'react'
import { Check } from './Icons'

interface ToastProps {
    toastMessage: { title: string; message: string } | null;
}

const Toast: React.FC<ToastProps> = ({ toastMessage }) => {
    if (!toastMessage) return null;

    return (
        <div className="fixed bottom-8 right-8 bg-gradient-to-br from-[rgb(var(--a1))] to-[rgb(var(--a2))] p-[1px] rounded-2xl shadow-2xl z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300">
            <div className="bg-[var(--bg)] px-6 py-4 rounded-[15px] flex items-center gap-4 border border-[var(--panel-border)]">
                <div className="w-8 h-8 rounded-full bg-[rgba(var(--a1),0.2)] flex items-center justify-center text-[rgb(var(--a1))]">
                    <Check className="w-5 h-5" strokeWidth={3} />
                </div>
                <div>
                    <h4 className="text-[var(--text)] font-bold text-sm tracking-wide">{toastMessage.title}</h4>
                    <p className="text-[var(--text)] opacity-60 text-xs font-medium mt-0.5">{toastMessage.message}</p>
                </div>
            </div>
        </div>
    );
}

export default Toast;