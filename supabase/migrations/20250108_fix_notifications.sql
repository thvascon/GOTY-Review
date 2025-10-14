-- Fix notifications table to use auth.uid() instead of people.id
-- This migration drops and recreates the notifications table with the correct structure

-- Drop existing table
DROP TABLE IF EXISTS notifications CASCADE;

-- Create notifications table with correct user_id reference
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL, -- This should be auth.users.id, not people.id
  type TEXT NOT NULL CHECK (type IN ('level_up', 'review_like', 'review_comment', 'new_member')),
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX notifications_user_id_idx ON notifications(user_id);
CREATE INDEX notifications_read_idx ON notifications(read);
CREATE INDEX notifications_created_at_idx ON notifications(created_at DESC);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view only their own notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Users can update only their own notifications
CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Policy: Allow system to insert notifications (authenticated users can insert)
CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);
