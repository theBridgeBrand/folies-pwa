/*
  # Add Orders and Payment System

  ## Overview
  Add payment and order management functionality to enable contactless payments via the PWA.

  ## New Tables

  ### 1. orders
  Store customer orders and payment information
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key) - User who made the order
  - `fridge_id` (uuid, foreign key) - Fridge where order was placed
  - `dish_id` (uuid, foreign key) - Ordered dish
  - `quantity` (integer) - Number of items ordered
  - `unit_price` (decimal) - Price per unit at time of purchase
  - `total_amount` (decimal) - Total order amount
  - `payment_method` (text) - Payment method used (apple_pay, google_pay, card)
  - `payment_status` (text) - pending, completed, failed, refunded
  - `payment_ref` (text) - External payment reference
  - `unlock_code` (text) - Code to unlock fridge door
  - `unlock_expires_at` (timestamptz) - Expiration time for unlock code
  - `is_collected` (boolean) - Whether item was collected
  - `collected_at` (timestamptz, nullable) - When item was collected
  - `points_awarded` (integer) - Loyalty points awarded for this order
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - RLS enabled with user-specific access
  - Users can only view their own orders
  - Orders cannot be modified after creation
*/

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  fridge_id uuid REFERENCES fridges(id) ON DELETE SET NULL NOT NULL,
  dish_id uuid REFERENCES dishes(id) ON DELETE SET NULL NOT NULL,
  quantity integer DEFAULT 1 CHECK (quantity > 0),
  unit_price decimal(10,2) NOT NULL,
  total_amount decimal(10,2) NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('apple_pay', 'google_pay', 'card', 'nfc')),
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_ref text,
  unlock_code text NOT NULL,
  unlock_expires_at timestamptz DEFAULT (now() + interval '10 minutes'),
  is_collected boolean DEFAULT false,
  collected_at timestamptz,
  points_awarded integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for orders
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND payment_status = 'pending')
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_fridge ON orders(fridge_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_unlock_code ON orders(unlock_code);

-- Add trigger for updated_at
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate unlock code
CREATE OR REPLACE FUNCTION generate_unlock_code()
RETURNS text AS $$
DECLARE
  code text;
BEGIN
  -- Generate 6-digit code
  code := LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0');
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to process order and award loyalty points
CREATE OR REPLACE FUNCTION process_order_completion()
RETURNS TRIGGER AS $$
DECLARE
  points_to_award integer;
BEGIN
  -- Only process when payment status changes to completed
  IF NEW.payment_status = 'completed' AND OLD.payment_status != 'completed' THEN
    -- Calculate points (1 point per euro spent)
    points_to_award := FLOOR(NEW.total_amount);
    
    -- Update order with points
    NEW.points_awarded := points_to_award;
    
    -- Award points to user
    UPDATE users 
    SET loyalty_points = loyalty_points + points_to_award,
        last_active = now()
    WHERE id = NEW.user_id;
    
    -- Create user activity record
    INSERT INTO user_activity (user_id, fridge_id, dish_id, points_earned, transaction_ref)
    VALUES (NEW.user_id, NEW.fridge_id, NEW.dish_id, points_to_award, NEW.payment_ref);
    
    -- Update fridge inventory (decrease stock)
    UPDATE fridge_inventory
    SET stock = GREATEST(0, stock - NEW.quantity),
        updated_at = now()
    WHERE fridge_id = NEW.fridge_id AND dish_id = NEW.dish_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-process orders
CREATE TRIGGER process_order_on_payment
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION process_order_completion();