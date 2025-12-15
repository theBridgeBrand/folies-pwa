/*
  # Add Polls System for Weekly Dish Voting

  1. New Tables
    - `polls`
      - `id` (uuid, primary key)
      - `title` (text) - Title of the poll
      - `start_date` (timestamptz) - When the poll starts
      - `end_date` (timestamptz) - When the poll ends
      - `dish_1_id` (uuid) - First dish option (FK to dishes)
      - `dish_2_id` (uuid) - Second dish option (FK to dishes)
      - `dish_3_id` (uuid) - Third dish option (FK to dishes)
      - `status` (text) - 'active' or 'closed'
      - `created_at` (timestamptz)
      - `created_by` (uuid) - Admin who created the poll (FK to auth.users)
    
    - `poll_votes`
      - `id` (uuid, primary key)
      - `poll_id` (uuid) - FK to polls
      - `user_id` (uuid) - FK to auth.users
      - `dish_id` (uuid) - FK to dishes (the voted dish)
      - `created_at` (timestamptz)
      - Unique constraint on (poll_id, user_id) to prevent multiple votes

  2. Security
    - Enable RLS on both tables
    - Everyone can view active polls
    - Only authenticated users can vote
    - Users can only vote once per poll
    - Only admins can create/update/delete polls
    - Users can view their own votes
*/

-- Create polls table
CREATE TABLE IF NOT EXISTS polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz NOT NULL,
  dish_1_id uuid NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
  dish_2_id uuid NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
  dish_3_id uuid NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create poll_votes table
CREATE TABLE IF NOT EXISTS poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dish_id uuid NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(poll_id, user_id)
);

-- Enable RLS
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

-- Polls policies
CREATE POLICY "Everyone can view polls"
  ON polls FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert polls"
  ON polls FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

CREATE POLICY "Admins can update polls"
  ON polls FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

CREATE POLICY "Admins can delete polls"
  ON polls FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Poll votes policies
CREATE POLICY "Users can view all votes"
  ON poll_votes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own vote"
  ON poll_votes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vote"
  ON poll_votes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_polls_status ON polls(status);
CREATE INDEX IF NOT EXISTS idx_polls_dates ON polls(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll_id ON poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_user_id ON poll_votes(user_id);
