import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Header } from "@/components/Header";
import { TicketCard } from "@/components/TicketCard";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/store")({
  head: () => ({ meta: [{ title: "Store — EmuCloud" }] }),
  component: Store,
});

function Store() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (!loading && !user) navigate({ to: "/login" }); }, [loading, user, navigate]);
  if (!user) return <div className="min-h-screen bg-background" />;
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="mx-auto max-w-3xl p-6 lg:p-10 animate-in">
        <h1 className="font-display text-4xl font-extrabold tracking-tighter">SESSION TICKETS</h1>
        <p className="text-muted-foreground mt-2">Paid via Moneroo Mobile Money. Credit applied instantly on webhook confirmation.</p>
        <div className="mt-8 grid gap-4">
          <TicketCard tkey="flash" userId={user.id} />
          <TicketCard tkey="gamer" featured userId={user.id} />
          <TicketCard tkey="hardcore" userId={user.id} />
        </div>
      </main>
    </div>
  );
}
