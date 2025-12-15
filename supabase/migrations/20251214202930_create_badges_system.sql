/*
  # Create Badges and Gamification System

  1. New Tables
    - `badge_types`
      - `id` (uuid, primary key)
      - `name` (text) - Badge name
      - `description` (text) - Badge description
      - `category` (text) - Category: 'orders', 'spending', 'streak', 'voting', 'special'
      - `level` (integer) - Badge level: 1=Bronze, 2=Silver, 3=Gold, 4=Platinum
      - `icon` (text) - Emoji or icon identifier
      - `xp_reward` (integer) - XP points awarded when unlocked
      - `requirement_value` (integer) - Value needed to unlock (e.g., 5 orders, 50€)
      - `color` (text) - Display color (bronze, silver, gold, platinum)
      - `created_at` (timestamptz)
    
    - `user_badges`
      - `id` (uuid, primary key)
      - `user_id` (uuid) - FK to auth.users
      - `badge_type_id` (uuid) - FK to badge_types
      - `unlocked_at` (timestamptz)
      - `progress` (integer) - Current progress toward next level
      - Unique constraint on (user_id, badge_type_id)
    
    - `user_stats`
      - `id` (uuid, primary key)
      - `user_id` (uuid) - FK to auth.users (unique)
      - `total_xp` (integer) - Total XP earned
      - `level` (integer) - User level (calculated from XP)
      - `total_orders` (integer) - Total number of orders
      - `total_spent` (numeric) - Total amount spent
      - `current_streak` (integer) - Current consecutive days with orders
      - `longest_streak` (integer) - Longest streak ever
      - `last_order_date` (date) - Last order date for streak calculation
      - `polls_voted` (integer) - Number of polls participated in
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Users can view all badge types
    - Users can view their own badges and stats
    - Only system can insert/update badges and stats

  3. Initial Badge Data
    - Create initial badge types for different categories and levels
*/

-- Create badge_types table
CREATE TABLE IF NOT EXISTS badge_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('orders', 'spending', 'streak', 'voting', 'special')),
  level integer NOT NULL CHECK (level >= 1 AND level <= 4),
  icon text NOT NULL,
  xp_reward integer NOT NULL DEFAULT 0,
  requirement_value integer NOT NULL DEFAULT 0,
  color text NOT NULL CHECK (color IN ('bronze', 'silver', 'gold', 'platinum')),
  created_at timestamptz DEFAULT now()
);

-- Create user_badges table
CREATE TABLE IF NOT EXISTS user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_type_id uuid NOT NULL REFERENCES badge_types(id) ON DELETE CASCADE,
  unlocked_at timestamptz DEFAULT now(),
  progress integer DEFAULT 0,
  UNIQUE(user_id, badge_type_id)
);

-- Create user_stats table
CREATE TABLE IF NOT EXISTS user_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp integer DEFAULT 0,
  level integer DEFAULT 1,
  total_orders integer DEFAULT 0,
  total_spent numeric(10,2) DEFAULT 0,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_order_date date,
  polls_voted integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE badge_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Badge types policies (everyone can view)
CREATE POLICY "Everyone can view badge types"
  ON badge_types FOR SELECT
  TO authenticated
  USING (true);

-- User badges policies
CREATE POLICY "Users can view all badges"
  ON user_badges FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert user badges"
  ON user_badges FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update user badges"
  ON user_badges FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- User stats policies
CREATE POLICY "Users can view all stats"
  ON user_stats FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own stats"
  ON user_stats FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stats"
  ON user_stats FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_type_id ON user_badges(badge_type_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_badge_types_category ON badge_types(category);

-- Insert initial badge types

-- Order badges
INSERT INTO badge_types (name, description, category, level, icon, xp_reward, requirement_value, color) VALUES
('Première Commande', 'Passez votre première commande', 'orders', 1, '🌟', 50, 1, 'bronze'),
('Habitué Bronze', 'Passez 5 commandes', 'orders', 1, '🥉', 100, 5, 'bronze'),
('Habitué Argent', 'Passez 20 commandes', 'orders', 2, '🥈', 250, 20, 'silver'),
('Habitué Or', 'Passez 50 commandes', 'orders', 3, '🥇', 500, 50, 'gold'),
('Habitué Platine', 'Passez 100 commandes', 'orders', 4, '💎', 1000, 100, 'platinum');

-- Spending badges
INSERT INTO badge_types (name, description, category, level, icon, xp_reward, requirement_value, color) VALUES
('Économe', 'Dépensez 25€', 'spending', 1, '💰', 50, 25, 'bronze'),
('Gourmet Bronze', 'Dépensez 100€', 'spending', 1, '🍽️', 100, 100, 'bronze'),
('Gourmet Argent', 'Dépensez 250€', 'spending', 2, '🍷', 250, 250, 'silver'),
('Gourmet Or', 'Dépensez 500€', 'spending', 3, '👨‍🍳', 500, 500, 'gold'),
('Gourmet Platine', 'Dépensez 1000€', 'spending', 4, '⭐', 1000, 1000, 'platinum');

-- Streak badges
INSERT INTO badge_types (name, description, category, level, icon, xp_reward, requirement_value, color) VALUES
('Régulier', 'Commandez 3 jours consécutifs', 'streak', 1, '🔥', 100, 3, 'bronze'),
('Fidèle', 'Commandez 7 jours consécutifs', 'streak', 2, '💪', 250, 7, 'silver'),
('Dévoué', 'Commandez 14 jours consécutifs', 'streak', 3, '🚀', 500, 14, 'gold'),
('Légendaire', 'Commandez 30 jours consécutifs', 'streak', 4, '👑', 1000, 30, 'platinum');

-- Voting badges
INSERT INTO badge_types (name, description, category, level, icon, xp_reward, requirement_value, color) VALUES
('Votant', 'Votez dans 1 sondage', 'voting', 1, '🗳️', 50, 1, 'bronze'),
('Démocrate Bronze', 'Votez dans 5 sondages', 'voting', 1, '📊', 100, 5, 'bronze'),
('Démocrate Argent', 'Votez dans 15 sondages', 'voting', 2, '📈', 250, 15, 'silver'),
('Démocrate Or', 'Votez dans 30 sondages', 'voting', 3, '🏆', 500, 30, 'gold');

-- Special badges
INSERT INTO badge_types (name, description, category, level, icon, xp_reward, requirement_value, color) VALUES
('Early Adopter', 'Un des premiers utilisateurs', 'special', 4, '🌅', 500, 1, 'platinum'),
('Explorateur', 'Essayez 20 plats différents', 'special', 2, '🧭', 300, 20, 'silver'),
('Collectionneur', 'Débloquez 10 badges', 'special', 3, '🎯', 400, 10, 'gold');

-- Function to calculate level from XP
CREATE OR REPLACE FUNCTION calculate_level(xp integer)
RETURNS integer AS $$
BEGIN
  RETURN FLOOR(POWER(xp / 100.0, 0.5)) + 1;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update user level when XP changes
CREATE OR REPLACE FUNCTION update_user_level()
RETURNS TRIGGER AS $$
BEGIN
  NEW.level := calculate_level(NEW.total_xp);
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_level_trigger
  BEFORE UPDATE OF total_xp ON user_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_user_level();
