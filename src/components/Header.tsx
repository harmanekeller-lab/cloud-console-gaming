import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatHMS } from "@/lib/tickets";
import { Logo } from "@/components/Logo";

function HeaderButton({
  to,
  onClick,
  children,
  icon,
  variant = "ghost",
}: {
  to?: string;
  onClick?: () => void;
  children: React.ReactNode;
  icon: React.ReactNode;
  variant?: "ghost" | "neon";
}) {
  const cls =
    variant === "neon"
      ? "panel-neon text-foreground hover:brightness-110"
      : "panel text-foreground hover:border-[color:var(--neon)]/40";
  const inner = (
    <span className={`inline-flex items-center gap-2 h-11 px-5 rounded-lg font-bold text-[12px] tracking-[0.18em] uppercase transition-all ${cls}`}>
      <span className="neon-text">{icon}</span>
      {children}
    </span>
  );
  if (to) return <Link to={to}>{inner}</Link>;
  return <button onClick={onClick}>{inner}</button>;
}

export function Header() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [seconds, setSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const fetchBal = async () => {
      const { data } = await supabase.from("balances").select("seconds_remaining").eq("user_id", user.id).maybeSingle();
      if (!cancelled) setSeconds(data?.seconds_remaining ?? 0);
    };
    fetchBal();
    const ch = supabase
      .channel("balance-" + user.id)
      .on("postgres_changes", { event: "*", schema: "public", table: "balances", filter: `user_id=eq.${user.id}` }, (p) => {
        const row = p.new as { seconds_remaining?: number };
        if (row?.seconds_remaining !== undefined) setSeconds(row.seconds_remaining);
      })
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [user]);

  const logout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  const hms = seconds !== null ? formatHMS(seconds) : "00:00:00";
  const [h, m, s] = hms.split(":");

  return (
    <header className="sticky top-0 z-50 flex h-24 items-center justify-between px-8 border-b border-border bg-background/85 backdrop-blur-xl">
      <Link to="/"><Logo size={48} /></Link>

      {/* Center timer */}
      <div className="panel-neon px-8 py-2 flex flex-col items-center min-w-[260px]">
        <span className="font-mono text-[10px] tracking-[0.35em] uppercase text-muted-foreground">Time Remaining</span>
        <div className="flex items-end gap-1 font-mono font-bold text-3xl neon-text leading-none mt-1">
          <span>{h}</span><span className="opacity-60">:</span>
          <span>{m}</span><span className="opacity-60">:</span>
          <span>{s}</span>
        </div>
        <div className="flex gap-6 mt-1 font-mono text-[9px] tracking-[0.3em] text-muted-foreground">
          <span>HH</span><span>MM</span><span>SS</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {user ? (
          <>
            <HeaderButton to="/store" variant="neon" icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" /></svg>
            }>Recharge credits</HeaderButton>
            <HeaderButton to="/" icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
            }>My library</HeaderButton>
            <HeaderButton onClick={logout} icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
            }>Logout</HeaderButton>
          </>
        ) : (
          <HeaderButton to="/login" variant="neon" icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/></svg>
          }>Sign in</HeaderButton>
        )}
      </div>
    </header>
  );
}
