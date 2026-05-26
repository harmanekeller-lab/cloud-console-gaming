const I = (d: string) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const rows = [
  { icon: I("M2 5h20v12H2zM8 21h8M12 17v4"), label: "Resolution", value: "1280 x 720", tone: "default" as const },
  { icon: I("M4 6h16v12H4zM8 10h8v4H8z"), label: "Codec", value: "H.264", tone: "default" as const },
  { icon: I("M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"), label: "FPS", value: "60 FPS", tone: "default" as const },
  { icon: I("M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0zM12 6v6l4 2"), label: "Latency", value: "18 ms", tone: "neon" as const },
  { icon: I("M6 10h12v6a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4zM9 14h.01M15 14h.01"), label: "Controller", value: "Connected", tone: "success" as const },
  { icon: I("M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"), label: "Microphone", value: "Enabled", tone: "success" as const },
];

export function LiveSessionPanel() {
  return (
    <div className="panel-neon p-5 space-y-4">
      <h3 className="font-display font-extrabold text-xl tracking-tight">LIVE SESSION</h3>

      <div className="grid grid-cols-[1fr_auto] gap-5 items-start">
        <ul className="space-y-2.5">
          {rows.map((r) => (
            <li key={r.label} className="flex items-center justify-between gap-3 h-10 px-3 rounded-md bg-surface/60 border border-border/60">
              <span className="flex items-center gap-2.5 text-xs text-muted-foreground">
                <span className="neon-text">{r.icon}</span>
                {r.label}
              </span>
              <span className={`font-mono text-xs font-bold ${r.tone === "success" ? "text-success" : r.tone === "neon" ? "neon-text" : "text-foreground"}`}>
                {r.value}
              </span>
            </li>
          ))}
        </ul>

        {/* Controller graphic */}
        <div className="flex flex-col items-center gap-3 pt-1">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="neon-text">
            <path d="M5 12a7 7 0 0 1 14 0M8 12a4 4 0 0 1 8 0M11 12h2" />
          </svg>
          <svg width="84" height="64" viewBox="0 0 96 72" fill="none" className="neon-text">
            <path d="M22 18h52a14 14 0 0 1 14 14v8a14 14 0 0 1-14 14H66l-6-8H36l-6 8H22A14 14 0 0 1 8 40v-8a14 14 0 0 1 14-14z"
              stroke="currentColor" strokeWidth="2" fill="hsl(222 55% 8%)"/>
            <circle cx="28" cy="34" r="2" fill="currentColor"/>
            <circle cx="68" cy="34" r="2" fill="currentColor"/>
            <path d="M40 32h6M43 29v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            <circle cx="60" cy="30" r="1.5" fill="currentColor"/>
            <circle cx="64" cy="34" r="1.5" fill="currentColor"/>
            <circle cx="56" cy="34" r="1.5" fill="currentColor"/>
            <circle cx="60" cy="38" r="1.5" fill="currentColor"/>
          </svg>
        </div>
      </div>

      <button className="w-full h-11 panel border border-border hover:border-[color:var(--neon)]/50 rounded-lg flex items-center justify-center gap-2 font-bold text-[12px] tracking-[0.2em] uppercase transition-all">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="6" width="12" height="12"/></svg>
        Disconnect session
      </button>
    </div>
  );
}
