# Test Environment Setup Guide

## What This Does

Adds a Franklin-only environment toggle to switch between production and test data within the same Supabase database. This allows you to:
- Test new features while the app is in production use
- Keep production data separate from test data using an `environment` column
- Easily switch between environments with one button
- Use the same Supabase project (no need for a second project)

## Setup Instructions

### 1. Add Environment Column to Database

1. Go to https://supabase.com/dashboard
2. Open your baby-tracker project
3. Go to SQL Editor
4. Run this SQL:

```sql
ALTER TABLE logs ADD COLUMN IF NOT EXISTS environment TEXT DEFAULT 'production' CHECK (environment IN ('production', 'test'));
CREATE INDEX IF NOT EXISTS idx_logs_environment ON logs(environment);
```

### 2. Verify Setup

1. Go to Table Editor → logs table
2. Confirm the `environment` column exists
3. All existing rows should have `environment='production'`

### 3. Restart Dev Server (if running locally)

```bash
npm run dev
```

## How to Use

### Switching Environments

1. Login as Franklin
2. Look at bottom center of Dashboard page
3. Click the environment badge to toggle:
   - **Green badge "ENV: PRODUCTION"** = Production data
   - **Yellow badge "ENV: TEST"** = Test data
4. Page reloads and shows data for selected environment

### What Happens When You Switch

- **Production mode**: Shows all logs where `environment='production'`
- **Test mode**: Shows all logs where `environment='test'`
- New logs are tagged with the current environment
- Maeva only sees production data (toggle not visible to her)

### Starting Fresh in Test Mode

1. Switch to test environment
2. Test environment starts empty (no data)
3. Use the app normally - all new logs go to test environment
4. Switch back to production anytime

## Architecture

- **Same database, same tables** - no separate test project needed
- **Environment column** - filters data by `production` or `test`
- **Client-side filtering** - `useLogs` hook filters by environment
- **Server-side always production** - API routes (Insights, Normal Check) use production only
- **localStorage persistence** - environment choice saved in browser

## Important Notes

- Only Franklin can see and use the toggle (Maeva won't see it)
- Selection persists in browser localStorage per device
- Server-side API calls always use production data
- Both environments share the same schema
- Test data is isolated from production data

## Troubleshooting

**Toggle not visible:**
- Make sure you're logged in as Franklin
- Check browser console for errors

**No data after switching to test:**
- This is expected - test environment starts empty
- Add test data by using the app in test mode

**Data not filtering correctly:**
- Check that environment column was added successfully
- Verify index was created (improves query performance)
- Clear localStorage and try again: `localStorage.removeItem('baby-tracker-environment')`

## Cleaning Up Test Data

To delete all test data:

```sql
DELETE FROM logs WHERE environment = 'test';
```

This keeps production data intact.
