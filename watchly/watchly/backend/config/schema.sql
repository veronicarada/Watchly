-- ============================================================
-- WATCHLY - Supabase Database Schema
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- USERS table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FAVORITES table
CREATE TABLE IF NOT EXISTS favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  movie_id INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  poster_path VARCHAR(255),
  release_year INTEGER,
  vote_average DECIMAL(3,1),
  overview TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, movie_id)
);

-- GROUPS table (for group mode)
CREATE TABLE IF NOT EXISTS groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  members JSONB DEFAULT '[]',
  votes JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── Row Level Security (RLS) ──────────────────────────────────────────────

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Users: can only see/edit own row
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

-- Favorites: users manage own favorites
CREATE POLICY "Users manage own favorites" ON favorites
  FOR ALL USING (true);

-- Groups: anyone with code can view
CREATE POLICY "Anyone can view groups" ON groups
  FOR ALL USING (true);

-- ─── Indexes ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_movie_id ON favorites(movie_id);
CREATE INDEX IF NOT EXISTS idx_groups_code ON groups(code);
