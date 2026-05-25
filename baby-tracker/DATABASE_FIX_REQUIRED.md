# Database Migration Required

## Issue
Nappy type "both" fails to save with error: "Failed to save log"

## Root Cause
Production Supabase database has an outdated `nappy_type` constraint that may not include 'both' value.

## Fix Required
Apply this SQL migration in Supabase SQL Editor:

```sql
-- Drop old constraint
ALTER TABLE logs DROP CONSTRAINT IF EXISTS logs_nappy_type_check;

-- Add new constraint with 'both' explicitly allowed
ALTER TABLE logs ADD CONSTRAINT logs_nappy_type_check
  CHECK (nappy_type IN ('wet', 'poo', 'both'));
```

## How to Apply

1. Go to https://supabase.com/dashboard
2. Select your project: `oropgrlnfimvnqsaucrs`
3. Click "SQL Editor" in left sidebar
4. Run the migration from: `supabase/migrations/fix_nappy_both_constraint.sql`
5. Test by logging a "Both" nappy in production app

## Verification

After applying, test with:
```bash
curl -X POST "https://baby-tracker-zeta-six.vercel.app/api/logs" \
  -H "Content-Type: application/json" \
  -d '{
    "logged_by": "test",
    "log_type": "nappy",
    "nappy_type": "both",
    "logged_at": "2026-05-25T10:30:00.000Z",
    "needs_review": false
  }'
```

Should return: `{"success":true,"log":{...}}`
