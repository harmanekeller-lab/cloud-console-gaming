import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useGamepad } from "@/hooks/useGamepad";
import { formatHMS } from "@/lib/tickets";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/play/$gameId")({
  head: () => ({ meta: [{ title: "Session — EmuCloud" }] }),
  component: PlayPage,
});

function PlayPage() {
  const { gameId } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [seconds, setSeconds] = useState<number | null>(null);
  const [gameName, setGameName] = useState("");

  const { connected, name: padName } = useGamepad((frame) => {
    // Hook into WebRTC DataChannel.send(JSON.stringify(frame)) once backend is wired.
    void frame;
  });

  useEffect(() => { if (!loading && !user) navigate({ to: "/login" }); }, [loading, user, navigate]);

  // Load game + balance, then start a session row and tick down locally.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;
    let heartbeat: ReturnType<typeof setInterval> | null = null;
    let sessionId: string | null = null;

    (async () => {
      const [{ data: game }, { data: bal }] = await Promise.all([
        supabase.from("games").select("name").eq("id", gameId).maybeSingle(),
        supabase.from("balances").select("seconds_remaining").eq("user_id", user.id).maybeSingle(),
      ]);
      if (cancelled) return;
      setGameName(game?.name ?? "Unknown");
      setSeconds(bal?.seconds_remaining ?? 0);

      const { data: sess } = await supabase
        .from("sessions")
        .insert({ user_id: user.id, game_id: gameId, status: "active" })
        .select("id")
        .single();
      sessionId = sess?.id ?? null;

      interval = setInterval(() => {
        setSeconds((s) => (s === null ? s : Math.max(0, s - 1)));
      }, 1000);
      heartbeat = setInterval(async () => {
        if (sessionId) {
          await supabase.from("sessions").update({ last_heartbeat: new Date().toISOString() }).eq("id", sessionId);
        }
      }, 60_000);
    })();

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      if (heartbeat) clearInterval(heartbeat);
      if (sessionId) {
        supabase.from("sessions").update({ status: "ended", ended_at: new Date().toISOString() }).eq("id", sessionId).then();
      }
    };
  }, [user, gameId]);

  if (!user) return <div className="min-h-screen bg-background" />;

  return (
    <div className="min-h-screen bg-black text-foreground">
      <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
        <Link to="/" className="px-3 py-1.5 rounded bg-black/60 border border-border text-xs font-mono uppercase tracking-widest backdrop-blur hover:bg-black/80">
          ← Exit
        </Link>
        <span className="text-sm font-bold">{gameName}</span>
      </div>

      <div className="relative w-screen h-screen grid place-items-center">
        <video ref={videoRef} className="w-full h-full object-contain bg-black" autoPlay playsInline muted />
        <div className="absolute inset-0 grid place-items-center pointer-events-none">
          <div className="text-center space-y-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">WebRTC stream pending</p>
            <p className="text-xs text-muted-foreground max-w-md">Awaiting GPU worker signaling. Configure your FastAPI signaling endpoint to attach the remote track.</p>
          </div>
        </div>
      </div>

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-8 bg-black/90 px-6 py-3 rounded-full border border-accent/50 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className={`size-2 rounded-full ${connected ? "bg-success pulse-glow" : "bg-muted-foreground"}`} />
          <span className="font-mono text-[10px] uppercase tracking-tight">{connected ? `Pad: ${padName?.slice(0, 18) ?? "ON"}` : "No pad"}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-muted-foreground">REMAINING:</span>
          <span className="font-mono font-bold text-accent">{seconds !== null ? formatHMS(seconds) : "--:--:--"}</span>
        </div>
        <Link to="/" className="text-[10px] font-black uppercase text-destructive hover:opacity-80 tracking-widest">Terminate</Link>
      </div>
    </div>
  );
}
