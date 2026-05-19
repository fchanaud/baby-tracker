# Baby Tracker

Mobile-first baby activity tracking app for sleep-deprived parents. Log feeds, sleep, nappies, and weight via voice input in under 5 seconds.

## Features

- **Voice-only input** using Web Speech API (Chrome mobile, iOS Safari, Android Chrome)
- **Natural language parsing** via Claude API — "breastfed for 20 minutes left side" → structured log
- **NHS-based alerts** for feeding patterns, nappy output, and side alternation
- **Mobile-first dashboard** with metrics, timeline, and recent activity
- **Backdating support** — "bottle 60ml 30 minutes ago" logs correct time
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

## Testing NLP Parser

Test all 15 example sentences from the PRD:

```bash
# Breastfeed examples
curl -X POST http://localhost:3000/api/parse \
  -H "Content-Type: application/json" \
  -d '{"text":"breastfed for 20 minutes left side","logged_by":"Franklin"}'

curl -X POST http://localhost:3000/api/parse \
  -H "Content-Type: application/json" \
  -d '{"text":"breastfed for 20 minutes left tit","logged_by":"Franklin"}'

curl -X POST http://localhost:3000/api/parse \
  -H "Content-Type: application/json" \
  -d '{"text":"she fed on the right for 15 mins","logged_by":"Clémence"}'

curl -X POST http://localhost:3000/api/parse \
  -H "Content-Type: application/json" \
  -d '{"text":"fed both sides, about 10 minutes each","logged_by":"Franklin"}'

# Bottle examples
curl -X POST http://localhost:3000/api/parse \
  -H "Content-Type: application/json" \
  -d '{"text":"bottle, 90ml","logged_by":"Franklin"}'

curl -X POST http://localhost:3000/api/parse \
  -H "Content-Type: application/json" \
  -d '{"text":"gave her a bottle of 60ml 30 minutes ago","logged_by":"Clémence"}'

# Sleep examples
curl -X POST http://localhost:3000/api/parse \
  -H "Content-Type: application/json" \
  -d '{"text":"she slept for 2 hours","logged_by":"Franklin"}'

curl -X POST http://localhost:3000/api/parse \
  -H "Content-Type: application/json" \
  -d '{"text":"baby slept 45 minutes, that was at 3am","logged_by":"Clémence"}'

# Nappy examples
curl -X POST http://localhost:3000/api/parse \
  -H "Content-Type: application/json" \
  -d '{"text":"nappy change, wet","logged_by":"Franklin"}'

curl -X POST http://localhost:3000/api/parse \
  -H "Content-Type: application/json" \
  -d '{"text":"dirty nappy just now","logged_by":"Clémence"}'

curl -X POST http://localhost:3000/api/parse \
  -H "Content-Type: application/json" \
  -d '{"text":"mixed nappy","logged_by":"Franklin"}'

# Weight examples
curl -X POST http://localhost:3000/api/parse \
  -H "Content-Type: application/json" \
  -d '{"text":"she weighs 3.8 kilos","logged_by":"Clémence"}'

curl -X POST http://localhost:3000/api/parse \
  -H "Content-Type: application/json" \
  -d '{"text":"weight check: 4100 grams","logged_by":"Franklin"}'

# Note examples
curl -X POST http://localhost:3000/api/parse \
  -H "Content-Type: application/json" \
  -d '{"text":"note: she seemed gassy after the feed","logged_by":"Clémence"}'

curl -X POST http://localhost:3000/api/parse \
  -H "Content-Type: application/json" \
  -d '{"text":"fed right tit 8 mins — not sure she latched well","logged_by":"Franklin"}'

curl -X POST http://localhost:3000/api/parse \
  -H "Content-Type: application/json" \
  -d '{"text":"quick feed left side maybe 5 minutes, around 6am","logged_by":"Clémence"}'
```

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

Once deployed, open the Vercel URL on your phone (iOS Safari or Android Chrome) to test voice input.

## NHS Alert Rules

The app implements these NHS-based alerts (non-diagnostic):

1. **No feed in 3h+**: Warning if no feed logged for 3+ hours
2. **Short feed (<10min)**: Info if most recent breastfeed was <10 minutes
3. **Low nappy count**: Warning if <6 wet nappies by 8pm
4. **Side imbalance**: Info if left/right breastfeed difference >2 today

## Browser Support

| Feature | Chrome (mobile) | Safari (iOS) | Chrome (desktop) | Firefox | Safari (macOS) |
|---------|----------------|--------------|------------------|---------|----------------|
| Voice Input | ✅ | ✅ | ✅ | ❌ | ❌ |
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |

**Voice input requires Chrome or iOS Safari.** Other browsers will show an error message.

## Troubleshooting

### Voice input not working

- **Check browser**: Must be Chrome (mobile/desktop) or iOS Safari
- **Check permissions**: Allow microphone access when prompted
- **Check HTTPS**: Web Speech API requires HTTPS (works on localhost in dev)

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
      /parse     # Claude API NLP parser
      /report    # Claude API report generator
    layout.tsx   # Root layout
    page.tsx     # Dashboard route
  /components
    Dashboard.tsx       # Main UI
    VoiceInput.tsx      # Web Speech API integration
    AlertBanner.tsx     # NHS alerts
    MetricCards.tsx     # Feed/sleep/nappy metrics
    Timeline.tsx        # 24h colour-coded timeline
    RecentLogs.tsx      # Last 5 entries
    IdentityPicker.tsx  # Franklin/Clémence selector
  /lib
    supabase.ts    # Supabase client
    claude.ts      # Anthropic client
    alerts.ts      # NHS alert logic (deterministic)
    types.ts       # TypeScript types
  /hooks
    useIdentity.ts # localStorage identity
    useLogs.ts     # SWR Supabase logs
```

## License

MIT

## Support

For issues or questions, open a GitHub issue at [github.com/fchanaud/baby-tracker](https://github.com/fchanaud/baby-tracker).
