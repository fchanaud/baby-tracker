-- Baby Tracker Database Schema
-- Apply this in Supabase SQL Editor

CREATE TABLE logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  logged_by TEXT NOT NULL,
  log_type TEXT NOT NULL CHECK (log_type IN ('breastfeed', 'bottle', 'sleep', 'nappy', 'weight', 'note')),

  -- Feed-specific fields
  side TEXT CHECK (side IN ('left', 'right', 'both')),
  duration_minutes INTEGER,
  amount_ml INTEGER,

  -- Nappy-specific fields
  nappy_type TEXT CHECK (nappy_type IN ('wet', 'dirty', 'mixed')),

  -- Weight-specific fields
  weight_grams INTEGER,

  -- Note-specific fields
  note TEXT,

  -- Parser confidence flag
  needs_review BOOLEAN DEFAULT FALSE,

  -- Type-specific validation constraints
  CONSTRAINT valid_breastfeed CHECK (
    log_type != 'breastfeed' OR (side IS NOT NULL AND duration_minutes IS NOT NULL)
  ),
  CONSTRAINT valid_bottle CHECK (
    log_type != 'bottle' OR (amount_ml IS NOT NULL)
  ),
  CONSTRAINT valid_sleep CHECK (
    log_type != 'sleep' OR (duration_minutes IS NOT NULL)
  ),
  CONSTRAINT valid_nappy CHECK (
    log_type != 'nappy' OR (nappy_type IS NOT NULL)
  ),
  CONSTRAINT valid_weight CHECK (
    log_type != 'weight' OR (weight_grams IS NOT NULL)
  )
);

-- Indexes for dashboard queries
CREATE INDEX idx_logs_logged_at ON logs(logged_at DESC);
CREATE INDEX idx_logs_log_type ON logs(log_type);
CREATE INDEX idx_logs_created_at ON logs(created_at DESC);

-- Enable Row Level Security (RLS) but allow all operations for now
-- In production, you'd add policies based on user authentication
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- Allow all operations (since no auth in v1)
CREATE POLICY "Allow all operations" ON logs FOR ALL USING (true);
