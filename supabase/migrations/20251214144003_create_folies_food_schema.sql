/*
  # Folies Food PWA Database Schema

  ## Overview
  Complete database schema for the Folies Food fridge showcase PWA application.

  ## New Tables

  ### 1. fridges
  Stores information about each connected fridge location
  - `id` (uuid, primary key)
  - `code` (text, unique) - Unique code displayed on fridge door (e.g., CAROT-123)
  - `name` (text) - Display name of the fridge
  - `location` (text) - Physical location (office, hotel, etc.)
  - `address` (text) - Full address
  - `status` (text) - active, inactive, maintenance
  - `last_restocked` (timestamptz) - Last restock timestamp
  - `opening_hours` (jsonb) - Opening hours data
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. dishes
  Catalog of all available dishes
  - `id` (uuid, primary key)
  - `name` (text) - Dish name
  - `description` (text) - Short description
  - `price` (decimal) - Regular price
  - `category` (text) - breakfast, lunch, snack, dinner
  - `image_url` (text) - Product photo URL
  - `allergens` (text[]) - List of allergens
  - `labels` (text[]) - vegetarian, vegan, gluten-free, etc.
  - `nutritional_info` (jsonb) - Calories, proteins, etc.
  - `is_bestseller` (boolean)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. fridge_inventory
  Links dishes to fridges with stock information
  - `id` (uuid, primary key)
  - `fridge_id` (uuid, foreign key)
  - `dish_id` (uuid, foreign key)
  - `stock` (integer) - Current stock level
  - `promotion_price` (decimal, nullable) - Promotional price if active
  - `is_new` (boolean) - Mark as new arrival
  - `display_order` (integer) - Sort order in fridge
  - `updated_at` (timestamptz)

  ### 4. users
  User accounts for loyalty and preferences
  - `id` (uuid, primary key, references auth.users)
  - `email` (text, unique)
  - `phone` (text, nullable)
  - `loyalty_points` (integer) - Accumulated points
  - `loyalty_tier` (text) - bronze, silver, gold, platinum
  - `favorite_fridges` (uuid[]) - Array of favorite fridge IDs
  - `notification_preferences` (jsonb) - Notification settings
  - `created_at` (timestamptz)
  - `last_active` (timestamptz)

  ### 5. promotions
  Active promotions and special offers
  - `id` (uuid, primary key)
  - `title` (text) - Promotion title
  - `description` (text) - Promotion details
  - `type` (text) - discount, happy_hour, game, contest
  - `image_url` (text, nullable)
  - `fridge_ids` (uuid[], nullable) - Specific fridges or null for all
  - `start_date` (timestamptz)
  - `end_date` (timestamptz)
  - `discount_percentage` (decimal, nullable)
  - `is_active` (boolean)
  - `created_at` (timestamptz)

  ### 6. notifications
  Push notification history and queue
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key, nullable) - Null for broadcast
  - `fridge_id` (uuid, foreign key, nullable) - Related fridge
  - `title` (text)
  - `message` (text)
  - `type` (text) - restock, promotion, game
  - `link_url` (text, nullable)
  - `sent_at` (timestamptz, nullable)
  - `created_at` (timestamptz)

  ### 7. user_activity
  Track user consumption for loyalty (future TPA/TPE integration)
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key)
  - `fridge_id` (uuid, foreign key)
  - `dish_id` (uuid, foreign key)
  - `points_earned` (integer)
  - `transaction_ref` (text, nullable) - Future payment reference
  - `created_at` (timestamptz)

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Policies for authenticated users to access their own data
  - Public read access for fridge and dish information
  - Restricted write access for inventory and promotions
*/

-- Create fridges table
CREATE TABLE IF NOT EXISTS fridges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  location text NOT NULL,
  address text DEFAULT '',
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  last_restocked timestamptz DEFAULT now(),
  opening_hours jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create dishes table
CREATE TABLE IF NOT EXISTS dishes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  price decimal(10,2) NOT NULL,
  category text NOT NULL CHECK (category IN ('breakfast', 'lunch', 'snack', 'dinner', 'dessert')),
  image_url text DEFAULT '',
  allergens text[] DEFAULT '{}',
  labels text[] DEFAULT '{}',
  nutritional_info jsonb DEFAULT '{}',
  is_bestseller boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create fridge_inventory table
CREATE TABLE IF NOT EXISTS fridge_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fridge_id uuid REFERENCES fridges(id) ON DELETE CASCADE NOT NULL,
  dish_id uuid REFERENCES dishes(id) ON DELETE CASCADE NOT NULL,
  stock integer DEFAULT 0,
  promotion_price decimal(10,2),
  is_new boolean DEFAULT false,
  display_order integer DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(fridge_id, dish_id)
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  phone text,
  loyalty_points integer DEFAULT 0,
  loyalty_tier text DEFAULT 'bronze' CHECK (loyalty_tier IN ('bronze', 'silver', 'gold', 'platinum')),
  favorite_fridges uuid[] DEFAULT '{}',
  notification_preferences jsonb DEFAULT '{"restock": true, "promotions": true, "games": true}',
  created_at timestamptz DEFAULT now(),
  last_active timestamptz DEFAULT now()
);

-- Create promotions table
CREATE TABLE IF NOT EXISTS promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  type text NOT NULL CHECK (type IN ('discount', 'happy_hour', 'game', 'contest')),
  image_url text,
  fridge_ids uuid[],
  start_date timestamptz DEFAULT now(),
  end_date timestamptz NOT NULL,
  discount_percentage decimal(5,2),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  fridge_id uuid REFERENCES fridges(id) ON DELETE SET NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL CHECK (type IN ('restock', 'promotion', 'game')),
  link_url text,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create user_activity table
CREATE TABLE IF NOT EXISTS user_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  fridge_id uuid REFERENCES fridges(id) ON DELETE SET NULL NOT NULL,
  dish_id uuid REFERENCES dishes(id) ON DELETE SET NULL NOT NULL,
  points_earned integer DEFAULT 0,
  transaction_ref text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE fridges ENABLE ROW LEVEL SECURITY;
ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fridge_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- RLS Policies for fridges (public read)
CREATE POLICY "Anyone can view active fridges"
  ON fridges FOR SELECT
  TO authenticated, anon
  USING (status = 'active');

-- RLS Policies for dishes (public read)
CREATE POLICY "Anyone can view dishes"
  ON dishes FOR SELECT
  TO authenticated, anon
  USING (true);

-- RLS Policies for fridge_inventory (public read)
CREATE POLICY "Anyone can view fridge inventory"
  ON fridge_inventory FOR SELECT
  TO authenticated, anon
  USING (true);

-- RLS Policies for users (own data only)
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for promotions (public read active promotions)
CREATE POLICY "Anyone can view active promotions"
  ON promotions FOR SELECT
  TO authenticated, anon
  USING (is_active = true AND end_date > now());

-- RLS Policies for notifications (own notifications only)
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);

-- RLS Policies for user_activity (own activity only)
CREATE POLICY "Users can view own activity"
  ON user_activity FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity"
  ON user_activity FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_fridges_code ON fridges(code);
CREATE INDEX IF NOT EXISTS idx_fridges_status ON fridges(status);
CREATE INDEX IF NOT EXISTS idx_fridge_inventory_fridge ON fridge_inventory(fridge_id);
CREATE INDEX IF NOT EXISTS idx_fridge_inventory_dish ON fridge_inventory(dish_id);
CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(is_active, end_date);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_user ON user_activity(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_fridges_updated_at BEFORE UPDATE ON fridges
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dishes_updated_at BEFORE UPDATE ON dishes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fridge_inventory_updated_at BEFORE UPDATE ON fridge_inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();