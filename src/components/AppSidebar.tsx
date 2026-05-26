import { Link, useRouterState } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";

type Item = { to: string; label: string; icon: React.ReactNode };

const I = (d: string) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const items: Item[] = [
  { to: "/", label: "Dashboard", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="6"/><circle cx="8" cy="12" r="1.2" fill="currentColor"/><circle cx="16" cy="12" r="1.2" fill="currentColor"/>
    </svg>
  ) },
  { to: "/", label: "My Games", icon: I("M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z") },
  { to: "/", label: "Upload Game", icon: I("M12 16V4M6 10l6-6 6 6M4 20h16") },
  { to: "/", label: "Sessions", icon: I("M12 8v4l3 2M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20z") },
  { to: "/store", label: "Transactions", icon: I("M3 7h18v10H3zM3 11h18") },
  { to: "/", label: "Settings", icon: I("M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2-1.2L14 3h-4l-.6 2.5a7 7 0 0 0-2 1.2L5 5.8 3 9.2l2 1.5A7 7 0 0 0 4.9 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-.9a7 7 0 0 0 2 1.2L10 21h4l.6-2.5a7 7 0 0 0 2-1.2l2.3.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z") },
  { to: "/", label: "Support", icon: I("M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0zM8 12h.01M12 12h.01M16 12h.01") },
];

export function AppSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="hidden lg:flex flex-col w-[240px] shrink-0 border-r border-border bg-background/40 px-4 py-6 gap-6">
      <nav className="flex flex-col gap-1.5">
        {items.map((it, i) => {
          const active = i === 0 && path === "/";
          return (
            <Link
              key={i}
              to={it.to}
              className={`flex items-center gap-3 h-11 px-4 rounded-lg text-[12px] font-bold tracking-[0.18em] uppercase transition-all
                ${active ? "panel-neon text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-surface/60"}`}
            >
              <span className={active ? "neon-text" : ""}>{it.icon}</span>
              {it.label}
            </Link>
          );
        })}
      </nav>

      {/* GPU Status */}
      <div className="panel p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground">GPU Server Status</span>
        </div>
        <div className="flex items-center gap-2 text-success text-xs font-bold">
          <span className="size-2 rounded-full bg-success pulse-glow" /> ONLINE
        </div>
        <div className="space-y-2 text-xs">
          <Row label="Region" value="EU-West" />
          <Row label="Server Load" value="23%" />
          <Row label="GPU" value="NVIDIA RTX 4090" />
          <Row label="Uptime" value="99.9%" />
        </div>
      </div>

      {/* Brand card */}
      <div className="panel-neon p-5 flex flex-col items-center text-center mt-auto">
        <Logo size={56} />
        <p className="mt-3 font-mono text-[9px] tracking-[0.3em] uppercase text-muted-foreground">Cloud Gaming Revolution</p>
      </div>
    </aside>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-foreground/90">{value}</span>
    </div>
  );
}
