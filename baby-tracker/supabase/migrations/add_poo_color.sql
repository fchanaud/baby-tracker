-- Add poo_color column to logs table
ALTER TABLE logs
ADD COLUMN IF NOT EXISTS poo_color TEXT
CHECK (poo_color IN ('yellow', 'green', 'brown', 'red', 'black', 'white', 'gray'));

-- Add comment for documentation
COMMENT ON COLUMN logs.poo_color IS 'Color of poo for nappy logs (NHS-based guidance)';
