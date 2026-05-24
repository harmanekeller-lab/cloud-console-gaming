import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — EmuCloud" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { display_name: name || "Player" },
        },
      });
      setLoading(false);
      if (error) return toast.error(error.message);
      toast.success("Account created. You got 1h free trial — check your email to confirm if required.");
      navigate({ to: "/" });
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) return toast.error(error.message);
      navigate({ to: "/" });
    }
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) return toast.error("Google sign-in failed");
    if (!r.redirected) navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen grid place-items-center px-6 bg-background">
      <div className="w-full max-w-md animate-in">
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <div className="size-7 rounded bg-accent grid place-items-center">
            <div className="size-2 rounded-full bg-white animate-pulse" />
          </div>
          <span className="font-display font-extrabold tracking-tighter text-2xl uppercase">EmuCloud</span>
        </Link>

        <div className="bg-surface border border-border rounded-xl p-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{mode === "signin" ? "Welcome back" : "Create account"}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === "signin" ? "Resume your station." : "Get 1 hour free on signup."}
            </p>
          </div>

          <button onClick={google} className="w-full py-3 bg-foreground text-background rounded font-bold text-sm hover:opacity-90">
            Continue with Google
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest"><span className="bg-surface px-3 text-muted-foreground font-mono">or email</span></div>
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === "signup" && (
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Display name" maxLength={40} className="w-full bg-background border border-border rounded px-3 py-2.5 text-sm focus:outline-none focus:border-accent" />
            )}
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="Email" className="w-full bg-background border border-border rounded px-3 py-2.5 text-sm focus:outline-none focus:border-accent" />
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required minLength={6} placeholder="Password (min. 6)" className="w-full bg-background border border-border rounded px-3 py-2.5 text-sm focus:outline-none focus:border-accent" />
            <button disabled={loading} className="w-full py-3 bg-accent text-accent-foreground rounded font-bold text-sm uppercase tracking-wider disabled:opacity-50">
              {loading ? "…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="w-full text-xs text-muted-foreground hover:text-foreground">
            {mode === "signin" ? "No account? Create one" : "Already have an account? Sign in"}
          </button>
        </div>

        <p className="mt-6 text-center text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Phone OTP login requires Twilio config in backend.
        </p>
      </div>
    </div>
  );
}
