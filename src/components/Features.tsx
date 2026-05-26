const I = (d: string) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const features = [
  { icon: I("M18 10a6 6 0 0 0-11.8-1.5A5 5 0 0 0 7 18h11a4 4 0 0 0 0-8zM8 22l2-4M12 22l2-4M16 22l2-4"), title: "Cloud Saves", body: "Your saves are securely stored in the cloud and synced across sessions." },
  { icon: I("M6 10h12v6a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4zM9 14h.01M15 14h.01"), title: "Gamepad Support", body: "Play with your favorite controller with ultra-low latency." },
  { icon: I("M13 2 3 14h7l-1 8 10-12h-7l1-8z"), title: "Ultra Low Latency", body: "WebRTC technology delivers smooth and responsive gameplay." },
  { icon: I("M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"), title: "Secure Sessions", body: "Heartbeat system protects your time from unexpected disconnects." },
  { icon: I("M18 10a6 6 0 0 0-11.8-1.5A5 5 0 0 0 7 18h11a4 4 0 0 0 0-8zM12 12v6M9 15l3-3 3 3"), title: "Easy Upload", body: "Upload ISO / PKG from Drive, Mega or direct link in seconds." },
];

export function Features() {
  return (
    <section className="panel p-6">
      <h3 className="font-display font-extrabold text-xl tracking-tight mb-5">WHY VIRTUAL CONSOLE ENGINE?</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {features.map((f) => (
          <div key={f.title} className="panel p-4 flex flex-col items-center text-center gap-2 hover:border-[color:var(--neon)]/40 transition-all">
            <div className="size-11 grid place-items-center rounded-lg bg-surface-2 neon-text">{f.icon}</div>
            <h4 className="font-bold text-[11px] tracking-[0.18em] uppercase mt-1">{f.title}</h4>
            <p className="text-[10px] leading-snug text-muted-foreground">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
