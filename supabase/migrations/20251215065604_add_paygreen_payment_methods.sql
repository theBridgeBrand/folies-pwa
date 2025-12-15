/*
  # Add PayGreen Payment Methods

  This migration adds support for storing PayGreen restaurant card tokens
  and payment method preferences for users.

  1. New Columns in users table
    - `paygreen_card_id` (text) - Stores the PayGreen card token/ID
    - `paygreen_card_last4` (text) - Last 4 digits of the card for display
    - `paygreen_card_type` (text) - Type of card (e.g., 'conecs', 'swile', etc.)
    - `default_payment_method` (text) - User's preferred payment method ('nfc' or 'paygreen')
    
  2. Security
    - Only users can view and update their own payment methods
*/

-- Add PayGreen payment method columns to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'paygreen_card_id'
  ) THEN
    ALTER TABLE users ADD COLUMN paygreen_card_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'paygreen_card_last4'
  ) THEN
    ALTER TABLE users ADD COLUMN paygreen_card_last4 text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'paygreen_card_type'
  ) THEN
    ALTER TABLE users ADD COLUMN paygreen_card_type text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'default_payment_method'
  ) THEN
    ALTER TABLE users ADD COLUMN default_payment_method text DEFAULT 'nfc';
  END IF;
END $$;