import React from 'react'

export const GenericAppIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-full h-full text-[rgb(var(--a1))] opacity-60">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 0120.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
  </svg>
)

export const ZeitraLogo = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 130 175" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="zeitra_grad_1" x1="20.01" x2="102.2" y1="10.06" y2="7.304" gradientUnits="userSpaceOnUse">
        <stop stopColor="rgb(var(--a1))" offset="0" />
        <stop stopColor="rgb(var(--a2))" stopOpacity="1" offset="1" />
      </linearGradient>
      <linearGradient id="zeitra_grad_2" x1="71.06" x2="110.2" y1="22.79" y2="21.63" gradientUnits="userSpaceOnUse">
        <stop stopColor="rgb(var(--a1))" offset="0" />
        <stop stopColor="rgb(var(--a2))" stopOpacity="1" offset="1" />
      </linearGradient>
      <linearGradient id="zeitra_grad_3" x1="19.11" x2="57.99" y1="74.68" y2="74.68" gradientUnits="userSpaceOnUse">
        <stop stopColor="rgb(var(--a1))" offset="0" />
        <stop stopColor="rgb(var(--a2))" stopOpacity="1" offset="1" />
      </linearGradient>
    </defs>
    <path fill="url(#zeitra_grad_1)" d="m105.3 2.5h-84.3c-1.5 2.7-1.3 6.8-0.4 10.1h72.4l0.1-0.1h1l7.1-8.1 1.2-1.4 2.9-0.5z" />
    <path fill="rgb(var(--a2))" d="m113.3 27.7c-1.8-1.9-5.7-2.5-8.5 0l-20.9 23.3c-2.7 3.1-7.3 3.8-9.7 0.4-1.5-1.8-7.7-8.9-11.3-13-2.8-3-6.4-5.8-12.5-5.8-5.5 0-9.4 2-12.8 5.3l-21.5 24.5c-1.7 1.7-1.4 5.4 1.1 7.2 1.9 1.5 5.6 1.5 7-0.5l21.1-24.3c1.8-2.4 7.3-3.4 9.5-0.6 2.1 2.1 9.3 10.9 11.5 13.9 3.1 3.6 7.3 6.9 12.9 6.9 6.4 0 10.1-1.7 13.2-4.9l20.9-25.5c2-2 1.7-5.2 0-6.9z"/>
    <path fill="url(#zeitra_grad_2)" d="m105.3 2.5-2.9 0.5-21.3 24.1-9.2 9.5c-1.1 1-1.4 3.2 0 4.4l1.7 2c1.4 1.6 5 1.8 6.5 0l29.4-32.7c0.9-1 0.9-1 0.6-1 2-3-0.3-7.1-4.8-6.8z" />
    <path fill="url(#zeitra_grad_3)" d="m57.3 56.4c-0.9-1.4-1.9-3.1-3.4-3.9-1.8-0.7-4-0.4-5 1l-28.4 33.4c-2.4 2.1-2.1 5.6 0.5 7.7 1.5 1 3.7 1.3 5.5 0.5l1.4-0.7 29.4-33.6c0.8-1.2 1.1-3.2 0-4.4z" />
    <path fill="var(--text)" opacity="1" d="m36.2 134.9v4.5h-20.1v-3.5l12.8-14.9h-12.3v-4.4h19.1v3.4l-12.6 14.9h13.1zm18.8-6v10.2h-4.6v-2.1c-0.9 1.6-2.7 2.5-5.4 2.5-4 0-6.9-2.1-6.9-5.5 0-3 2.3-5.1 7.6-5.1h4.3c0-1.9-1.4-3.3-4-3.3-1.8 0-3.6 0.5-5.3 1.5l-2.1-3.3c2-1.4 5-2.1 8-2.1 5.3 0 8.4 2.4 8.4 7.2zm-5 4.7v-1.9h-3.4c-2.2 0-3.4 0.9-3.4 2.2 0 1.2 1 2.1 2.7 2.1s3.5-0.9 4.1-2.4zm8.7-16.9c0-1.3 1-2.8 3.2-2.8 1.8 0 3.1 1.2 3.1 2.7s-1.3 3-3.1 3c-2.2 0-3.2-1.2-3.2-2.9zm0.7 5.3h5.1v17.4h-5.1v-17.4zm20.8 16.6c-1 0.8-2.6 0.9-4.2 0.9-3.9 0-6.5-1.9-6.6-5.9v-7.5h-2.5v-3.7h2.6v-4.4h5.3v4.4h4.3v3.7h-4.2v7.5c0 1.3 0.8 2 2 1.9 0.7 0 1.5-0.1 2.2-0.6l1.1 3.7zm13.7-16.9v4.4c-3.8-0.5-5.5 1.5-5.5 4.9v8.4h-5.2v-17.4h4.8v2.1c1.1-1.5 3.1-2.4 5.9-2.4zm18.8 6.9v10.8h-5v-2.4c-0.8 1.6-2.6 2.5-5.2 2.5-3.9 0-7-1.9-7-5.5 0-3 2.4-5.1 7.6-5.1h4.1c0-2.3-1.5-3.3-4.1-3.3-1.6 0-3.4 0.5-4.9 1.5l-2.1-3.3c1.9-1.4 4.8-2.1 7.5-2.1 5.4-0.1 9.1 2.3 9.1 6.9zm-5.6 5.3v-2.2h-3.4c-2.1 0-3.2 1.2-3.2 2.2 0 1.2 1.1 2.1 2.9 2.1 1.6 0 3.2-0.6 3.7-2.1z" />
  </svg>
)

export const LayoutDashboard = ({ className = "w-5 h-5", strokeWidth = 2 }: { className?: string, strokeWidth?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
);

export const LineChart = ({ className = "w-5 h-5", strokeWidth = 2 }: { className?: string, strokeWidth?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
);

export const ShieldAlert = ({ className = "w-5 h-5", strokeWidth = 2 }: { className?: string, strokeWidth?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2-1 4-2 7-2 2.5 0 4.5 1 7 2a1 1 0 0 1 1 1z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
);

export const Settings = ({ className = "w-5 h-5", strokeWidth = 2 }: { className?: string, strokeWidth?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
);

export const Download = ({ className = "w-5 h-5", strokeWidth = 2 }: { className?: string, strokeWidth?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
);

export const Monitor = ({ className = "w-5 h-5", strokeWidth = 2 }: { className?: string, strokeWidth?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>
);

export const Sun = ({ className = "w-5 h-5", strokeWidth = 2 }: { className?: string, strokeWidth?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
);

export const Moon = ({ className = "w-5 h-5", strokeWidth = 2 }: { className?: string, strokeWidth?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
);

export const HardDrive = ({ className = "w-5 h-5", strokeWidth = 2 }: { className?: string, strokeWidth?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="22" x2="2" y1="12" y2="12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><line x1="6" x2="6.01" y1="16" y2="16"/><line x1="10" x2="10.01" y1="16" y2="16"/></svg>
);

export const Eye = ({ className = "w-5 h-5", strokeWidth = 2 }: { className?: string, strokeWidth?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
);

export const EyeOff = ({ className = "w-5 h-5", strokeWidth = 2 }: { className?: string, strokeWidth?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
);

export const RefreshCw = ({ className = "w-5 h-5", strokeWidth = 2 }: { className?: string, strokeWidth?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
);

export const Check = ({ className = "w-5 h-5", strokeWidth = 2 }: { className?: string, strokeWidth?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 6 9 17l-5-5"/></svg>
);

export const X = ({ className = "w-5 h-5", strokeWidth = 2 }: { className?: string, strokeWidth?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
);

export const Clock = ({ className = "w-5 h-5", strokeWidth = 2 }: { className?: string, strokeWidth?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);

export const ShieldBan = ({ className = "w-5 h-5", strokeWidth = 2 }: { className?: string, strokeWidth?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2-1 4-2 7-2 2.5 0 4.5 1 7 2a1 1 0 0 1 1 1z"/><path d="m4.7 5 14 13.5"/></svg>
);

export const FolderOpen = ({ className = "w-5 h-5", strokeWidth = 2 }: { className?: string, strokeWidth?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2"/></svg>
);

export const Flame = ({ className = "w-5 h-5", strokeWidth = 2 }: { className?: string, strokeWidth?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
);

export const Play = ({ className = "w-5 h-5", strokeWidth = 2 }: { className?: string, strokeWidth?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="6 3 20 12 6 21 6 3"/></svg>
);

export const Square = ({ className = "w-5 h-5", strokeWidth = 2 }: { className?: string, strokeWidth?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="14" height="14" x="5" y="5" rx="2"/></svg>
);

export const Maximize2 = ({ className = "w-5 h-5", strokeWidth = 2 }: { className?: string, strokeWidth?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" x2="14" y1="3" y2="10"/><line x1="3" x2="10" y1="21" y2="14"/></svg>
);