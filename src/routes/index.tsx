import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Header } from "@/components/Header";
import { AppSidebar } from "@/components/AppSidebar";
import { LiveSessionPanel } from "@/components/LiveSessionPanel";
import { Features } from "@/components/Features";
import { UploadGameDialog } from "@/components/UploadGameDialog";
import { TicketCard } from "@/components/TicketCard";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import heroImg from "@/assets/ps-cloud-hero.jpg";

type Game = Database["public"]["Tables"]["games"]["Row"];

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Virtual Console Engine — Cloud Gaming PS2 & PS3" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [games, setGames] = useState<Game[]>([]);
  const [link, setLink] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("games").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setGames(data ?? []);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  if (!user) return <div className="min-h-screen bg-background" />;

  const firstGame = games[0];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <div className="flex">
        <AppSidebar />

        <main className="flex-1 p-6 lg:p-8 space-y-6 animate-in overflow-x-hidden">
          {/* Hero */}
          <section className="panel-neon relative overflow-hidden">
            <div className="grid md:grid-cols-2 items-center">
              <div className="p-8 md:p-10 z-10">
                <h1 className="font-display font-extrabold text-4xl md:text-5xl tracking-tight leading-[1.05]">
                  PLAY PS2 & PS3
                </h1>
                <p className="font-display font-extrabold text-2xl md:text-3xl neon-text tracking-tight mt-1">
                  INSTANTLY IN THE CLOUD
                </p>
                <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
                  No downloads. No installations.<br />Just pure gaming performance.
                </p>
                <div className="flex flex-wrap gap-3 mt-7">
                  {firstGame?.status === "ready" ? (
                    <Link
                      to="/play/$gameId"
                      params={{ gameId: firstGame.id }}
                      className="inline-flex items-center gap-2 h-12 px-6 rounded-lg bg-[color:var(--neon)] text-[color:var(--accent-foreground)] font-bold text-[12px] tracking-[0.2em] uppercase hover:brightness-110 transition-all shadow-[0_0_30px_var(--neon-soft)]"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                      Start playing
                    </Link>
                  ) : (
                    <button
                      onClick={() => document.querySelector<HTMLButtonElement>("[data-upload-trigger]")?.click()}
                      className="inline-flex items-center gap-2 h-12 px-6 rounded-lg bg-[color:var(--neon)] text-[color:var(--accent-foreground)] font-bold text-[12px] tracking-[0.2em] uppercase hover:brightness-110 transition-all shadow-[0_0_30px_var(--neon-soft)]"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                      Start playing
                    </button>
                  )}
                  <button
                    onClick={() => document.querySelector<HTMLButtonElement>("[data-upload-trigger]")?.click()}
                    className="inline-flex items-center gap-2 h-12 px-6 rounded-lg panel text-foreground font-bold text-[12px] tracking-[0.2em] uppercase hover:border-[color:var(--neon)]/40 transition-all"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 16V4M6 10l6-6 6 6M4 20h16"/></svg>
                    Upload game
                  </button>
                </div>
              </div>
              <div className="relative h-[260px] md:h-[340px]">
                <img src={heroImg} alt="PS2 and PS3 floating in a neon cloud" className="absolute inset-0 w-full h-full object-cover object-center" />
                <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent md:via-background/10" />
              </div>
            </div>
          </section>

          {/* Your Station + Live Session */}
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6">
            <section className="space-y-4">
              <h2 className="font-display font-extrabold text-xl tracking-tight">YOUR STATION</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Featured game */}
                <div className="panel overflow-hidden flex flex-col">
                  <div className="relative aspect-[3/4] bg-surface-2">
                    {firstGame?.cover_url ? (
                      <img src={firstGame.cover_url} alt={firstGame.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-muted-foreground text-xs font-mono">NO GAME</div>
                    )}
                    {firstGame && (
                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-background/80 border border-border">
                          {firstGame.platform.toUpperCase()}
                        </span>
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-success/20 text-success border border-success/40">
                          {firstGame.status.toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-3 flex items-center justify-between gap-2">
                    <span className="font-bold text-sm truncate">{firstGame?.name ?? "No game loaded"}</span>
                    {firstGame?.status === "ready" && (
                      <Link
                        to="/play/$gameId"
                        params={{ gameId: firstGame.id }}
                        className="text-[10px] font-bold tracking-[0.2em] uppercase neon-text hover:brightness-110"
                      >
                        Launch ›
                      </Link>
                    )}
                  </div>
                </div>

                {/* Upload card */}
                <button
                  onClick={() => document.querySelector<HTMLButtonElement>("[data-upload-trigger]")?.click()}
                  className="panel p-6 flex flex-col items-center justify-center gap-3 hover:border-[color:var(--neon)]/40 transition-all min-h-[260px]"
                >
                  <div className="size-14 rounded-full grid place-items-center neon-text border border-[color:var(--neon)]/40">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 10a6 6 0 0 0-11.8-1.5A5 5 0 0 0 7 18h11a4 4 0 0 0 0-8zM12 12v6M9 15l3-3 3 3"/></svg>
                  </div>
                  <p className="font-bold text-[12px] tracking-[0.18em] uppercase">Upload<br/>ISO / PKG</p>
                  <p className="text-[10px] text-muted-foreground text-center leading-snug">Drag &amp; drop your file here<br/>or click to browse</p>
                </button>

                {/* Link card */}
                <div className="panel p-6 flex flex-col items-center gap-3 min-h-[260px]">
                  <div className="size-14 rounded-full grid place-items-center neon-text border border-[color:var(--neon)]/40">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>
                  </div>
                  <p className="font-bold text-[12px] tracking-[0.18em] uppercase text-center">Add ISO<br/>via link</p>
                  <input
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="Paste your link here…"
                    className="w-full h-9 px-3 rounded-md bg-surface-2 border border-border text-xs focus:border-[color:var(--neon)]/60 outline-none"
                  />
                  <button className="w-full h-9 rounded-md bg-[color:var(--neon)] text-[color:var(--accent-foreground)] text-[10px] font-black uppercase tracking-[0.2em] hover:brightness-110">
                    Add game
                  </button>
                </div>
              </div>
              <div className="hidden"><UploadGameDialog userId={user.id} onUploaded={load} /></div>
            </section>

            <LiveSessionPanel />
          </div>

          {/* Features + Recharge */}
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6">
            <Features />
            <section className="panel p-5 space-y-4">
              <h3 className="font-display font-extrabold text-xl tracking-tight">RECHARGE CREDITS</h3>
              <div className="grid grid-cols-3 gap-3">
                <TicketCard tkey="flash" userId={user.id} />
                <TicketCard tkey="gamer" featured userId={user.id} />
                <TicketCard tkey="hardcore" userId={user.id} />
              </div>
            </section>
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-border text-[10px] font-mono tracking-[0.25em] uppercase text-muted-foreground">
            <span>© 2026 Virtual Console Engine. All rights reserved.</span>
            <span className="flex flex-wrap gap-4">
              <span>Powered by FastAPI</span><span>·</span><span>Firebase</span><span>·</span><span>WebRTC</span><span>·</span><span>VirtualGL</span><span>·</span><span>RPCS3</span><span>·</span><span>PCSX2</span>
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}
