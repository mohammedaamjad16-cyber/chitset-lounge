-- ============ enums ============
CREATE TYPE public.friend_status AS ENUM ('pending', 'accepted', 'blocked');
CREATE TYPE public.presence_status AS ENUM ('offline', 'online', 'in_lobby', 'in_match');

-- ============ shared trigger fn ============
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ profiles ============
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL,
  avatar_emoji text NOT NULL DEFAULT '🎲',
  avatar_url text,
  bio text,
  level integer NOT NULL DEFAULT 1,
  xp integer NOT NULL DEFAULT 0,
  presence public.presence_status NOT NULL DEFAULT 'offline',
  last_seen timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX profiles_username_lower_idx ON public.profiles (lower(username));
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles readable by signed in users" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ player stats ============
CREATE TABLE public.player_stats (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_matches integer NOT NULL DEFAULT 0,
  wins integer NOT NULL DEFAULT 0,
  losses integer NOT NULL DEFAULT 0,
  total_play_seconds integer NOT NULL DEFAULT 0,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  fastest_win_seconds integer,
  favorite_category text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.player_stats TO authenticated;
GRANT ALL ON public.player_stats TO service_role;
ALTER TABLE public.player_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stats readable by signed in users" ON public.player_stats FOR SELECT TO authenticated USING (true);
CREATE POLICY "own stats insert" ON public.player_stats FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own stats update" ON public.player_stats FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER player_stats_touch BEFORE UPDATE ON public.player_stats FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ new user bootstrap ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE base_name text; final_name text; n integer := 0;
BEGIN
  base_name := coalesce(
    nullif(trim(NEW.raw_user_meta_data ->> 'username'), ''),
    nullif(trim(NEW.raw_user_meta_data ->> 'full_name'), ''),
    split_part(coalesce(NEW.email, 'player'), '@', 1)
  );
  final_name := base_name;
  WHILE EXISTS (SELECT 1 FROM public.profiles p WHERE lower(p.username) = lower(final_name)) LOOP
    n := n + 1;
    final_name := base_name || n::text;
  END LOOP;
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (NEW.id, final_name, NEW.raw_user_meta_data ->> 'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.player_stats (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ matches ============
CREATE TABLE public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code text NOT NULL,
  category_id text NOT NULL,
  winner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  winner_name text NOT NULL,
  winning_label text,
  duration_seconds integer NOT NULL DEFAULT 0,
  turns integer NOT NULL DEFAULT 0,
  player_count integer NOT NULL DEFAULT 0,
  players jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX matches_created_at_idx ON public.matches (created_at DESC);
GRANT SELECT, INSERT ON public.matches TO authenticated;
GRANT ALL ON public.matches TO service_role;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "matches readable by signed in users" ON public.matches FOR SELECT TO authenticated USING (true);
CREATE POLICY "matches insert by participants" ON public.matches FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE TABLE public.match_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name text NOT NULL,
  is_winner boolean NOT NULL DEFAULT false,
  xp_awarded integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX match_players_user_idx ON public.match_players (user_id, created_at DESC);
GRANT SELECT, INSERT ON public.match_players TO authenticated;
GRANT ALL ON public.match_players TO service_role;
ALTER TABLE public.match_players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "match players readable by signed in users" ON public.match_players FOR SELECT TO authenticated USING (true);
CREATE POLICY "match players insert by signed in users" ON public.match_players FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- ============ achievements ============
CREATE TABLE public.achievements (
  code text PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT 'trophy',
  tier text NOT NULL DEFAULT 'bronze',
  sort_order integer NOT NULL DEFAULT 0
);
GRANT SELECT ON public.achievements TO authenticated, anon;
GRANT ALL ON public.achievements TO service_role;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "achievements are public" ON public.achievements FOR SELECT TO authenticated, anon USING (true);

INSERT INTO public.achievements (code, title, description, icon, tier, sort_order) VALUES
  ('first_victory', 'First Victory', 'Win your very first ChitSet match.', 'trophy', 'bronze', 1),
  ('ten_wins', '10 Wins', 'Win ten matches.', 'medal', 'silver', 2),
  ('fifty_wins', '50 Wins', 'Win fifty matches.', 'crown', 'gold', 3),
  ('hundred_matches', 'Century Club', 'Play one hundred matches.', 'gamepad-2', 'gold', 4),
  ('perfect_show', 'Perfect Show', 'Call a valid Show on your very first attempt.', 'sparkles', 'silver', 5),
  ('streak_five', 'On Fire', 'Win five matches in a row.', 'flame', 'gold', 6),
  ('speed_winner', 'Speed Winner', 'Win a match in under 60 seconds.', 'zap', 'silver', 7),
  ('category_master', 'Category Master', 'Win in every available category.', 'library', 'gold', 8);

CREATE TABLE public.user_achievements (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL REFERENCES public.achievements(code) ON DELETE CASCADE,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, code)
);
GRANT SELECT, INSERT ON public.user_achievements TO authenticated;
GRANT ALL ON public.user_achievements TO service_role;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "unlocked achievements readable" ON public.user_achievements FOR SELECT TO authenticated USING (true);
CREATE POLICY "own achievements insert" ON public.user_achievements FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============ friendships ============
CREATE TABLE public.friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.friend_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT friendships_not_self CHECK (requester_id <> addressee_id),
  CONSTRAINT friendships_unique_pair UNIQUE (requester_id, addressee_id)
);
CREATE INDEX friendships_addressee_idx ON public.friendships (addressee_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.friendships TO authenticated;
GRANT ALL ON public.friendships TO service_role;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "friendships visible to both sides" ON public.friendships FOR SELECT TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE POLICY "send friend request" ON public.friendships FOR INSERT TO authenticated WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "respond to friend request" ON public.friendships FOR UPDATE TO authenticated
  USING (auth.uid() = addressee_id OR auth.uid() = requester_id)
  WITH CHECK (auth.uid() = addressee_id OR auth.uid() = requester_id);
CREATE POLICY "remove friendship" ON public.friendships FOR DELETE TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE TRIGGER friendships_touch BEFORE UPDATE ON public.friendships FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ rooms ============
CREATE TABLE public.rooms (
  code text PRIMARY KEY,
  name text NOT NULL,
  host_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id text NOT NULL DEFAULT 'fruits',
  game_mode text NOT NULL DEFAULT 'classic',
  visibility text NOT NULL DEFAULT 'private',
  max_players integer NOT NULL DEFAULT 4,
  status text NOT NULL DEFAULT 'lobby',
  state jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rooms TO authenticated;
GRANT ALL ON public.rooms TO service_role;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rooms readable by signed in users" ON public.rooms FOR SELECT TO authenticated USING (true);
CREATE POLICY "create own room" ON public.rooms FOR INSERT TO authenticated WITH CHECK (auth.uid() = host_id);
CREATE POLICY "host updates room" ON public.rooms FOR UPDATE TO authenticated USING (auth.uid() = host_id) WITH CHECK (auth.uid() = host_id);
CREATE POLICY "host deletes room" ON public.rooms FOR DELETE TO authenticated USING (auth.uid() = host_id);
CREATE TRIGGER rooms_touch BEFORE UPDATE ON public.rooms FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.room_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code text NOT NULL REFERENCES public.rooms(code) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  avatar_emoji text NOT NULL DEFAULT '🎲',
  is_host boolean NOT NULL DEFAULT false,
  is_ready boolean NOT NULL DEFAULT false,
  is_spectator boolean NOT NULL DEFAULT false,
  connection text NOT NULL DEFAULT 'connected',
  seat integer NOT NULL DEFAULT 0,
  last_seen timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT room_players_unique UNIQUE (room_code, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.room_players TO authenticated;
GRANT ALL ON public.room_players TO service_role;
ALTER TABLE public.room_players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "room players readable by signed in users" ON public.room_players FOR SELECT TO authenticated USING (true);
CREATE POLICY "join room as self" ON public.room_players FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own seat or host manages" ON public.room_players FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = (SELECT r.host_id FROM public.rooms r WHERE r.code = room_code))
  WITH CHECK (auth.uid() = user_id OR auth.uid() = (SELECT r.host_id FROM public.rooms r WHERE r.code = room_code));
CREATE POLICY "leave room or host removes" ON public.room_players FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = (SELECT r.host_id FROM public.rooms r WHERE r.code = room_code));

-- ============ chat ============
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name text NOT NULL,
  body text NOT NULL,
  kind text NOT NULL DEFAULT 'text',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chat_body_length CHECK (char_length(body) BETWEEN 1 AND 400)
);
CREATE INDEX chat_messages_room_idx ON public.chat_messages (room_code, created_at);
GRANT SELECT, INSERT ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat readable by signed in users" ON public.chat_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "send chat as self" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============ realtime ============
ALTER TABLE public.rooms REPLICA IDENTITY FULL;
ALTER TABLE public.room_players REPLICA IDENTITY FULL;
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER TABLE public.friendships REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.friendships;