# Baby Tracker

Mobile-first baby activity tracking app for sleep-deprived parents. One-handed tap-based logging for feeds, sleep, and nappies.

## Features

- **Tap-based multi-step logging** for feeds, sleep, and nappies — one-handed, mobile-first
- **Optional notes** on any activity — added as a last step before saving
- **Backdating support** — select "Earlier" and specify hours ago
- **Mobile-first dashboard** with metrics, timeline, and recent activity
- **Insights** — ask natural language questions about baby data via Claude API
- **No authentication** — simple identity selection (Franklin/Clémence)

## Prerequisites

- Node.js 18+
- Supabase account
- Anthropic API key
- Vercel account (for deployment)

## Local Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase Database

1. Go to [supabase.com](https://supabase.com) and open your project
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase/schema.sql`
4. Click **Run** to apply the schema

### 3. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Update `.env.local` with your actual values (already configured if following this guide).

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment to Vercel

### 1. Push to GitHub

The repo is ready to push. Run:

```bash
git add .
git commit -m "Initial commit: Baby Tracker v1"
git push origin main
```

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **New Project**
3. Import your GitHub repository `fchanaud/baby-tracker`
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
   - `ANTHROPIC_API_KEY`: Your Anthropic API key
5. Click **Deploy**

### 3. Test on Mobile

Once deployed, open the Vercel URL on your phone (iOS Safari or Android Chrome).

## Troubleshooting

### Parse API errors

- **Check Anthropic API key**: Verify it's set in `.env.local` and Vercel
- **Check rate limits**: Anthropic has rate limits on API calls
- **Fallback to regex**: If Claude API fails, the app uses regex parsing (sets `needs_review: true`)

### Supabase connection errors

- **Check credentials**: Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Check RLS policies**: Schema includes permissive policy for v1 (no auth)
- **Check schema**: Run `supabase/schema.sql` in SQL Editor

## Architecture

```
/src
  /app
    /api
      /query     # Claude API natural language Q&A
      /report    # Claude API report generator
    layout.tsx   # Root layout
    page.tsx     # Dashboard route
  /components
    Dashboard.tsx       # Main UI
    ActivityForm.tsx    # Multi-step tap logging (feed/sleep/nappy + optional note)
    MetricCards.tsx     # Feed/sleep/nappy metrics
    RecentLogs.tsx      # Last 5 entries (📝 icon if note attached)
    ActivityBottomSheet.tsx  # Activity detail view (shows note if present)
    IdentityPicker.tsx  # Franklin/Clémence selector
  /lib
    supabase.ts    # Supabase client
    claude.ts      # Anthropic client
    types.ts       # TypeScript types
  /hooks
    useIdentity.ts # localStorage identity
    useLogs.ts     # SWR Supabase logs
```

## License

MIT

## Support

For issues or questions, open a GitHub issue at [github.com/fchanaud/baby-tracker](https://github.com/fchanaud/baby-tracker).
