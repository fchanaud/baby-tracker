-- Fix nappy_type constraint to allow 'both' value
-- Run this in Supabase SQL Editor if 'both' saves are failing

-- Drop old constraint if it exists
ALTER TABLE logs DROP CONSTRAINT IF EXISTS logs_nappy_type_check;

-- Add new constraint that explicitly allows 'wet', 'poo', and 'both'
ALTER TABLE logs ADD CONSTRAINT logs_nappy_type_check
  CHECK (nappy_type IN ('wet', 'poo', 'both'));
