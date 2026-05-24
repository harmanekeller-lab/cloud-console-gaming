import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Header } from "@/components/Header";
import { GameCard } from "@/components/GameCard";
import { UploadGameDialog } from "@/components/UploadGameDialog";
import { TicketCard } from "@/components/TicketCard";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Game = Database["public"]["Tables"]["games"]["Row"];

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Dashboard — EmuCloud" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [games, setGames] = useState<Game[]>([]);

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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="mx-auto max-w-[1440px] p-6 lg:p-10 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">
        <section className="space-y-8 animate-in">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="font-display text-4xl font-extrabold tracking-tighter">YOUR STATION</h1>
              <p className="text-muted-foreground mt-1">PS2/PS3 Library • {games.length} game{games.length === 1 ? "" : "s"}</p>
            </div>
            <UploadGameDialog userId={user.id} onUploaded={load} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {games.map((g) => <GameCard key={g.id} game={g} />)}
            <button
              onClick={() => document.querySelector<HTMLButtonElement>("[data-upload-trigger]")?.click()}
              className="group aspect-[3/4] flex flex-col items-center justify-center rounded-lg border border-dashed border-border hover:border-accent hover:bg-accent/5 transition-all"
            >
              <div className="size-12 rounded-full border border-border grid place-items-center mb-4 group-hover:border-accent group-hover:scale-110 transition-all">
                <span className="text-2xl text-muted-foreground group-hover:text-accent">+</span>
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground group-hover:text-accent">Add ISO via link</span>
            </button>
          </div>
        </section>

        <aside className="space-y-6 animate-in">
          <div className="rounded-xl bg-surface p-5 border border-border">
            <h4 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-4">Hardware connection</h4>
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-accent/20 grid place-items-center text-accent">
                <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5z" /></svg>
              </div>
              <div>
                <p className="text-sm font-bold">Plug a gamepad</p>
                <p className="text-[10px] font-mono text-muted-foreground tracking-tight">Detected in-session</p>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-2">
              <div className="bg-background/50 rounded p-2 border border-border">
                <p className="font-mono text-[9px] text-muted-foreground uppercase">Region</p>
                <p className="font-mono text-xs">EU-West</p>
              </div>
              <div className="bg-background/50 rounded p-2 border border-border">
                <p className="font-mono text-[9px] text-muted-foreground uppercase">Codec</p>
                <p className="font-mono text-xs">H264</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Recharge credits</h4>
            <TicketCard tkey="flash" featured userId={user.id} />
            <TicketCard tkey="gamer" userId={user.id} />
            <TicketCard tkey="hardcore" userId={user.id} />
          </div>
        </aside>
      </main>
    </div>
  );
}
