import { Link } from "@tanstack/react-router";
import type { Database } from "@/integrations/supabase/types";

type Game = Database["public"]["Tables"]["games"]["Row"];

export function GameCard({ game }: { game: Game }) {
  const code = game.platform === "ps2" ? "PS2" : "PS3";
  return (
    <div className="group relative aspect-[3/4] overflow-hidden rounded-lg bg-surface ring-1 ring-border transition-all hover:ring-accent/50">
      <div className="w-full h-full bg-secondary grid place-items-center opacity-60 group-hover:scale-105 transition-transform duration-500">
        {game.cover_url ? (
          <img src={game.cover_url} alt={game.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            {game.status === "ready" ? "ISO_LOADED" : game.status.toUpperCase()}
          </span>
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <p className="font-mono text-[10px] text-accent mb-1">{code} • {game.status.toUpperCase()}</p>
        <h3 className="font-bold text-lg leading-tight group-hover:text-accent transition-colors line-clamp-2">{game.name}</h3>
        <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
          {game.status === "ready" ? (
            <Link
              to="/play/$gameId"
              params={{ gameId: game.id }}
              className="block w-full text-center py-2 bg-foreground text-background font-extrabold text-xs tracking-tighter uppercase rounded"
            >
              Launch Session
            </Link>
          ) : (
            <button disabled className="w-full py-2 bg-secondary text-muted-foreground font-extrabold text-xs tracking-tighter uppercase rounded cursor-not-allowed">
              {game.status}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
