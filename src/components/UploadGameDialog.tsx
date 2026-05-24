import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function UploadGameDialog({ userId, onUploaded }: { userId: string; onUploaded: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState<"ps2" | "ps3">("ps2");
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from("games").insert({
      user_id: userId,
      name: name.trim().slice(0, 120),
      platform,
      source_url: url.trim(),
      status: "pending",
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Game queued. The GPU worker will download it shortly.");
    setOpen(false);
    setName(""); setUrl("");
    onUploaded();
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center gap-2 px-4 py-2 border border-border rounded text-sm font-medium hover:bg-surface transition-colors">
        <span>+</span> Upload ISO/PKG
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm grid place-items-center p-6" onClick={() => setOpen(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="w-full max-w-md bg-surface rounded-xl p-6 ring-1 ring-border space-y-4">
            <div>
              <h3 className="text-xl font-bold tracking-tight">Inject ISO / PKG link</h3>
              <p className="text-xs text-muted-foreground mt-1">Public Google Drive or Mega direct links supported.</p>
            </div>
            <div className="space-y-2">
              <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Game name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} required className="w-full bg-background border border-border rounded px-3 py-2.5 text-sm focus:outline-none focus:border-accent" />
            </div>
            <div className="space-y-2">
              <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Platform</label>
              <div className="flex gap-2">
                {(["ps2", "ps3"] as const).map((p) => (
                  <button key={p} type="button" onClick={() => setPlatform(p)} className={`flex-1 py-2 rounded text-xs font-bold uppercase ${platform === p ? "bg-accent text-accent-foreground" : "bg-background border border-border text-muted-foreground"}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Source link</label>
              <input value={url} onChange={(e) => setUrl(e.target.value)} type="url" required placeholder="https://mega.nz/file/... or drive.google.com/..." className="w-full bg-background border border-border rounded px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-accent" />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={submitting} className="flex-1 py-3 bg-accent text-accent-foreground rounded font-bold text-sm uppercase tracking-wider disabled:opacity-50">
                {submitting ? "Queueing…" : "Queue download"}
              </button>
              <button type="button" onClick={() => setOpen(false)} className="px-5 py-3 border border-border rounded text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
