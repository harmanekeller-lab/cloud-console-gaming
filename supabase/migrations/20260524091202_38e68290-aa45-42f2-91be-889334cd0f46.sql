
-- Enums
CREATE TYPE public.platform AS ENUM ('ps2', 'ps3');
CREATE TYPE public.game_status AS ENUM ('pending', 'downloading', 'ready', 'failed');
CREATE TYPE public.session_status AS ENUM ('active', 'ended', 'expired');
CREATE TYPE public.ticket_type AS ENUM ('flash', 'gamer', 'hardcore');
CREATE TYPE public.payment_status AS ENUM ('pending', 'completed', 'failed');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT UNIQUE,
  display_name TEXT,
  free_trial_used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Balances (seconds)
CREATE TABLE public.balances (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  seconds_remaining INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.balances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own balance read" ON public.balances FOR SELECT USING (auth.uid() = user_id);

-- Games
CREATE TABLE public.games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  platform platform NOT NULL,
  source_url TEXT NOT NULL,
  status game_status NOT NULL DEFAULT 'pending',
  cover_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own games read" ON public.games FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own games insert" ON public.games FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own games update" ON public.games FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own games delete" ON public.games FOR DELETE USING (auth.uid() = user_id);

-- Sessions
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id UUID REFERENCES public.games(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  seconds_consumed INTEGER NOT NULL DEFAULT 0,
  status session_status NOT NULL DEFAULT 'active'
);
CREATE INDEX ON public.sessions(user_id, status);
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sessions read" ON public.sessions FOR SELECT USING (auth.uid() = user_id);

-- Payments
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticket_type ticket_type NOT NULL,
  amount_xof INTEGER NOT NULL,
  status payment_status NOT NULL DEFAULT 'pending',
  moneroo_ref TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own payments read" ON public.payments FOR SELECT USING (auth.uid() = user_id);

-- Auto-create profile + 1h free trial on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, phone, display_name)
  VALUES (NEW.id, NEW.phone, COALESCE(NEW.raw_user_meta_data->>'display_name', 'Player'));
  INSERT INTO public.balances (user_id, seconds_remaining) VALUES (NEW.id, 3600);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
