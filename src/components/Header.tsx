import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatHMS } from "@/lib/tickets";

export function Header() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
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
    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [user]);

  const logout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  const navItem = (to: string, label: string) => (
    <Link to={to} className={`text-sm font-medium transition-colors ${path === to ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-md">
      <div className="flex items-center gap-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="size-6 rounded bg-accent flex items-center justify-center">
            <div className="size-2 rounded-full bg-white animate-pulse" />
          </div>
          <span className="font-display font-extrabold tracking-tighter text-xl uppercase">EmuCloud</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          {navItem("/", "Dashboard")}
          {navItem("/store", "Store")}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="flex flex-col items-end">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Time Remaining</span>
            <span className="font-mono text-xl font-bold text-accent">{seconds !== null ? formatHMS(seconds) : "--:--:--"}</span>
          </div>
        )}
        {user ? (
          <>
            <Link to="/store" className="h-10 px-4 inline-flex items-center bg-accent hover:bg-accent/90 text-accent-foreground rounded font-bold text-sm transition-all active:scale-95">
              RECHARGE
            </Link>
            <button onClick={logout} className="text-xs text-muted-foreground hover:text-foreground">Logout</button>
          </>
        ) : (
          <Link to="/login" className="h-10 px-4 inline-flex items-center bg-accent hover:bg-accent/90 text-accent-foreground rounded font-bold text-sm">
            SIGN IN
          </Link>
        )}
      </div>
    </header>
  );
}
