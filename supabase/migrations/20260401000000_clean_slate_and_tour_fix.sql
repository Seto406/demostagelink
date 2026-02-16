-- Mass Purge: Clear all data from shows, tickets, and favorites tables
TRUNCATE TABLE tickets, shows, favorites CASCADE;

-- Schema Update: Add has_completed_tour column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS has_completed_tour BOOLEAN DEFAULT FALSE;
