import { TICKETS, type TicketKey } from "@/lib/tickets";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

const ICONS: Record<TicketKey, React.ReactNode> = {
  flash: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" /></svg>
  ),
  gamer: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="m12 2 2.9 6.9L22 10l-5.5 4.8L18.2 22 12 18.3 5.8 22l1.7-7.2L2 10l7.1-1.1z"/></svg>
  ),
  hardcore: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M3 8l4 10h10l4-10-6 4-3-6-3 6z"/></svg>
  ),
};

export function TicketCard({ tkey, featured, userId }: { tkey: TicketKey; featured?: boolean; userId?: string }) {
  const t = TICKETS[tkey];
  const [loading, setLoading] = useState(false);

  const buy = async () => {
    if (!userId) return;
    setLoading(true);
    const { error } = await supabase.from("payments").insert({
      user_id: userId,
      ticket_type: tkey,
      amount_xof: t.price,
      status: "pending",
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Payment intent created.");
  };

  return (
    <div className={`relative rounded-xl p-4 flex flex-col gap-3 transition-all ${featured ? "panel-neon" : "panel hover:border-[color:var(--neon)]/30"}`}>
      {featured && (
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[8px] font-bold tracking-[0.25em] uppercase bg-[color:var(--neon)] text-[color:var(--accent-foreground)]">
          Most Popular
        </span>
      )}
      <div className="neon-text">{ICONS[tkey]}</div>
      <div>
        <p className="font-display font-extrabold text-[13px] tracking-[0.18em] uppercase">{t.label} {t.duration}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{t.tagline}</p>
      </div>
      <div className="flex items-end gap-1">
        <span className="font-mono font-bold text-2xl neon-text leading-none">{t.price.toLocaleString()}</span>
        <span className="font-mono text-[10px] text-muted-foreground mb-0.5">FCFA</span>
      </div>
      <button
        onClick={buy}
        disabled={loading || !userId}
        className="w-full h-9 rounded-md bg-[color:var(--neon)] text-[color:var(--accent-foreground)] text-[10px] font-black uppercase tracking-[0.2em] disabled:opacity-50 hover:brightness-110 transition-all"
      >
        {loading ? "…" : "Pay with Moneroo"}
      </button>
    </div>
  );
}
