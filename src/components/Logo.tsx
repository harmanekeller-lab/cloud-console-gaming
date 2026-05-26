export function Logo({ size = 44 }: { size?: number }) {
  return (
    <div className="flex items-center gap-3">
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className="neon-pulse">
        <defs>
          <linearGradient id="lg" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="hsl(193 100% 70%)" />
            <stop offset="100%" stopColor="hsl(217 91% 60%)" />
          </linearGradient>
        </defs>
        {/* cloud outline */}
        <path
          d="M18 38a10 10 0 0 1 2-19.8A14 14 0 0 1 46 20a9 9 0 0 1 2 17.8H18z"
          stroke="url(#lg)"
          strokeWidth="2.2"
          fill="none"
        />
        {/* gamepad */}
        <g stroke="url(#lg)" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <rect x="18" y="32" width="28" height="14" rx="6" />
          <line x1="26" y1="38" x2="30" y2="38" />
          <line x1="28" y1="36" x2="28" y2="40" />
          <circle cx="40" cy="38" r="1.4" fill="url(#lg)" />
        </g>
      </svg>
      <div className="leading-tight">
        <div className="font-display font-extrabold tracking-[0.18em] text-[15px] neon-text">VIRTUAL</div>
        <div className="font-display font-bold tracking-[0.22em] text-[10px] text-foreground/80">CONSOLE ENGINE</div>
      </div>
    </div>
  );
}
