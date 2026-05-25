# Test Environment Setup Guide

## What This Does

Adds a Franklin-only environment toggle to switch between production and test databases. This allows you to:
- Test new features while the app is in production use
- Keep production data separate from test data
- Easily switch between environments with one button

## Setup Instructions

### 1. Create Test Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Name it: `baby-tracker-test`
4. Set a password and region
5. Wait for project to be created (~2 minutes)

### 2. Copy Schema to Test Database

1. In your new test project, go to SQL Editor
2. Copy and paste the entire schema from `/tmp/baby-tracker-schema.sql`
3. Run the SQL to create tables and indexes
4. Verify tables exist in Table Editor

### 3. Get Test Database Credentials

1. In test project, go to Settings → API
2. Copy these values:
   - **Project URL** (starts with `https://`)
   - **anon public key** (long JWT token)

### 4. Add Credentials to .env.local

Edit `.env.local` and fill in:

```bash
NEXT_PUBLIC_SUPABASE_TEST_URL=<your-test-project-url>
NEXT_PUBLIC_SUPABASE_TEST_ANON_KEY=<your-test-anon-key>
```

### 5. Restart Dev Server

```bash
npm run dev
```

## How to Use

### Switching Environments

1. Login as Franklin
2. Look at bottom of Dashboard page
3. Click the environment badge to toggle:
   - Green badge = Production database
   - Yellow badge = Test database
4. Page reloads and connects to selected environment

### Environment Indicator

The badge shows:
- **ENV: PRODUCTION** (green) - using production database
- **ENV: TEST** (yellow) - using test database

### Important Notes

- Only Franklin can see the toggle (Maeva won't see it)
- Selection persists in browser localStorage
- Server-side operations always use production
- Both databases have identical schema
- Test database starts empty

## Troubleshooting

**Toggle not visible:**
- Make sure you're logged in as Franklin

**Can't switch environments:**
- Check that test credentials are set in `.env.local`
- Make sure dev server was restarted after adding credentials

**Data not showing after switch:**
- Test database starts empty - this is expected
- Add test data using the app in test mode
