-- Migration: Add poo_consistency column and update nappy_type constraint
-- Apply in Supabase SQL Editor

-- Add poo_consistency column
ALTER TABLE logs ADD COLUMN IF NOT EXISTS poo_consistency TEXT CHECK (poo_consistency IN ('liquid', 'normal', 'soft'));

-- Drop old nappy_type constraint
ALTER TABLE logs DROP CONSTRAINT IF EXISTS logs_nappy_type_check;

-- Add new nappy_type constraint
ALTER TABLE logs ADD CONSTRAINT logs_nappy_type_check CHECK (nappy_type IN ('wet', 'poo', 'both'));
