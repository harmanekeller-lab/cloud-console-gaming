import { TICKETS, type TicketKey } from "@/lib/tickets";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

export function TicketCard({ tkey, featured, userId }: { tkey: TicketKey; featured?: boolean; userId?: string }) {
  const t = TICKETS[tkey];
  const [loading, setLoading] = useState(false);

  const buy = async () => {
    if (!userId) return;
    setLoading(true);
    // Record pending payment. Real Moneroo redirect happens server-side later.
    const { error } = await supabase.from("payments").insert({
      user_id: userId,
      ticket_type: tkey,
      amount_xof: t.price,
      status: "pending",
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Payment intent created. Moneroo redirect will open here once the backend is wired.");
  };

  return (
    <div className={`group relative overflow-hidden rounded-lg p-4 border transition-all ${featured ? "bg-gradient-to-r from-accent/20 to-transparent border-accent/40" : "bg-surface border-border hover:border-muted-foreground/40"}`}>
      {featured && (
        <span className="absolute top-2 right-2 font-mono text-[9px] tracking-widest uppercase text-accent">Most popular</span>
      )}
      <div className="flex justify-between items-start">
        <div>
          <p className="font-display font-extrabold text-lg">{t.label} {t.duration}</p>
          <p className="text-xs text-muted-foreground">{t.tagline}</p>
        </div>
        <span className={`font-mono text-sm font-bold ${featured ? "text-accent" : ""}`}>{t.price.toLocaleString()} FCFA</span>
      </div>
      <button onClick={buy} disabled={loading || !userId} className="mt-4 w-full py-2 rounded bg-accent text-accent-foreground text-[10px] font-black uppercase tracking-widest disabled:opacity-50">
        {loading ? "…" : "Buy with Moneroo"}
      </button>
    </div>
  );
}
