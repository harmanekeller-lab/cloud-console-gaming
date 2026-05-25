import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useGamepad } from "@/hooks/useGamepad";
import { formatHMS } from "@/lib/tickets";
import { supabase } from "@/integrations/supabase/client";
import { api } from "@/lib/api";

export const Route = createFileRoute("/play/$gameId")({
  head: () => ({ meta: [{ title: "Session — EmuCloud" }] }),
  component: PlayPage,
});

function PlayPage() {
  const { gameId } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);

  const [seconds, setSeconds] = useState<number | null>(null);
  const [gameName, setGameName] = useState("");
  const [status, setStatus] = useState<"starting" | "connecting" | "connected" | "error">("starting");
  const [errorMsg, setErrorMsg] = useState("");

  const { connected, name: padName } = useGamepad((frame) => {
    if (dcRef.current && dcRef.current.readyState === "open") {
      dcRef.current.send(JSON.stringify(frame));
    }
  });

  useEffect(() => { if (!loading && !user) navigate({ to: "/login" }); }, [loading, user, navigate]);

  const cleanup = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    dcRef.current?.close();
    dcRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
  }, []);

  // Start session + WebRTC + signaling
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;
    let heartbeat: ReturnType<typeof setInterval> | null = null;
    let sessionId: string | null = null;
    let workerId: string | null = null;

    (async () => {
      try {
        // Load game name + balance from Supabase
        const [{ data: game }, { data: bal }] = await Promise.all([
          supabase.from("games").select("name").eq("id", gameId).maybeSingle(),
          supabase.from("balances").select("seconds_remaining").eq("user_id", user.id).maybeSingle(),
        ]);
        if (cancelled) return;
        setGameName(game?.name ?? "Unknown");
        setSeconds(bal?.seconds_remaining ?? 0);

        // Start backend session (provisions GPU worker)
        const startRes = await api.post("/session/start", { game_id: gameId });
        sessionId = startRes.session_id;
        workerId = startRes.worker_id;
        setStatus("connecting");

        // Setup WebRTC
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });
        pcRef.current = pc;

        pc.ontrack = (evt) => {
          if (videoRef.current && evt.streams[0]) {
            videoRef.current.srcObject = evt.streams[0];
          }
        };

        // DataChannel for gamepad inputs
        const dc = pc.createDataChannel("gamepad", { ordered: true });
        dcRef.current = dc;

        // Connect signaling WebSocket
        const ws = new WebSocket(api.wsSignalingUrl(sessionId!));
        wsRef.current = ws;

        ws.onopen = async () => {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          ws.send(JSON.stringify({ type: "offer", sdp: offer.sdp }));
        };

        ws.onmessage = async (event) => {
          const msg = JSON.parse(event.data);
          if (msg.type === "answer" && msg.sdp) {
            await pc.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp: msg.sdp }));
          } else if (msg.type === "ice" && msg.candidate) {
            await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
          } else if (msg.type === "launch_ack") {
            setStatus("connected");
          }
        };

        ws.onerror = () => {
          setStatus("error");
          setErrorMsg("Signaling error");
        };

        ws.onclose = () => {
          if (status !== "connected") {
            setStatus("error");
            setErrorMsg("Signaling closed unexpectedly");
          }
        };

        pc.onicecandidate = (evt) => {
          if (evt.candidate && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ice", candidate: evt.candidate }));
          }
        };

        // Local countdown ticker
        interval = setInterval(() => {
          setSeconds((s) => (s === null ? s : Math.max(0, s - 1)));
        }, 1000);

        // Heartbeat to backend every 60s
        heartbeat = setInterval(async () => {
          if (sessionId) {
            try {
              const hbRes = await api.post("/session/heartbeat", { session_id: sessionId, elapsed_seconds: 60 });
              setSeconds(hbRes.balance_seconds);
              if (hbRes.balance_seconds === 0) {
                cleanup();
                navigate({ to: "/store" });
              }
            } catch (e) {
              console.error("[heartbeat]", e);
            }
          }
        }, 60_000);
      } catch (e: any) {
        setStatus("error");
        setErrorMsg(e.message ?? "Failed to start session");
      }
    })();

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      if (heartbeat) clearInterval(heartbeat);
      if (sessionId) {
        api.post("/session/stop", { session_id: sessionId }).catch(() => {});
      }
      cleanup();
    };
  }, [user, gameId, navigate, cleanup]);

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

        {status !== "connected" && (
          <div className="absolute inset-0 grid place-items-center pointer-events-none">
            <div className="text-center space-y-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                {status === "starting" ? "Provisioning GPU worker…" : status === "connecting" ? "WebRTC connecting…" : "Connection error"}
              </p>
              {errorMsg && (
                <p className="text-xs text-destructive max-w-md">{errorMsg}</p>
              )}
              {!errorMsg && (
                <p className="text-xs text-muted-foreground max-w-md">
                  {status === "starting"
                    ? "Spinning up a GPU instance. This may take 30–60 seconds."
                    : "Negotiating peer connection via signaling relay."}
                </p>
              )}
            </div>
          </div>
        )}
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
