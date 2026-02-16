-- Add 'archived' status to show_status enum
ALTER TYPE show_status ADD VALUE IF NOT EXISTS 'archived';
