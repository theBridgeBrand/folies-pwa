/*
  # Système de cartes restaurant manuelles

  1. Nouvelles Tables
    - `meal_voucher_cards`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `card_name` (text) - Nom donné à la carte par l'utilisateur
      - `card_type` (text) - Type de carte (swile, conecs, edenred, etc.)
      - `card_number` (text) - 4 derniers chiffres de la carte
      - `is_default` (boolean) - Carte par défaut pour les paiements
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Modifications
    - Ajouter `meal_voucher_card_id` dans la table `orders` pour lier les achats aux cartes

  3. Sécurité
    - Enable RLS sur `meal_voucher_cards`
    - Policies pour lecture/écriture par utilisateur authentifié
*/

-- Create meal_voucher_cards table
CREATE TABLE IF NOT EXISTS meal_voucher_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  card_name text NOT NULL DEFAULT '',
  card_type text NOT NULL DEFAULT 'swile',
  card_number text NOT NULL DEFAULT '',
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add meal_voucher_card_id to orders table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'meal_voucher_card_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN meal_voucher_card_id uuid REFERENCES meal_voucher_cards(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE meal_voucher_cards ENABLE ROW LEVEL SECURITY;

-- Policies for meal_voucher_cards
CREATE POLICY "Users can view own meal voucher cards"
  ON meal_voucher_cards FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal voucher cards"
  ON meal_voucher_cards FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal voucher cards"
  ON meal_voucher_cards FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal voucher cards"
  ON meal_voucher_cards FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS meal_voucher_cards_user_id_idx ON meal_voucher_cards(user_id);
CREATE INDEX IF NOT EXISTS orders_meal_voucher_card_id_idx ON orders(meal_voucher_card_id);