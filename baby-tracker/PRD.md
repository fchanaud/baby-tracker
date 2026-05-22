# Baby Tracker — PRD

## Overview
A mobile-first web app for Franklin and Clémence to log and monitor their newborn baby's daily activity for the first 6 months. Built for sleep-deprived parents: one-handed, mobile-first voice input.
The system now includes a NHS-based evaluation layer used to interpret baby logs and generate meaningful health indicators (non-diagnostic).

## Users
- **Franklin** (father) and **Clémence** (mother)
- Identity selected once at first app open via a single large tap button ("I'm Franklin" / "I'm Clémence"), stored in localStorage, no login required
- Logs may also be attributed to other caregivers (e.g. babysitter, grandparents) by selecting or typing a name
- All logs show who logged them

## Core log types and data captured

| Type | Fields |
|---|---|
| Breastfeed | side (left/right/both), duration_minutes, logged_by, logged_at |
| Bottle feed | amount_ml, duration_minutes, logged_by, logged_at |
| Sleep | duration_minutes, logged_by, logged_at |
| Nappy | nappy_type (wet/dirty/mixed), logged_by, logged_at |
| Note | note (freetext), logged_by, logged_at |

- Clémence plans to breastfeed primarily; bottle may be introduced later — both must be supported from day one
- `logged_at` can differ from `created_at` — parents log events after the fact

## Input method
- English only
- Voice input via Web Speech API (large mic button, always visible)
- Text input fallback
- Claude API parses free natural language into structured log entries — no confirmation step, logs immediately
- Backdating supported: if input mentions a past time ("that was 20 minutes ago", "she fed at 6am"), extract and use that as logged_at

## NLP parser — test sentences Claude Code must validate against

The parser must correctly handle all of the following:

```
"breastfed for 20 minutes left side"
"breastfed for 20 minutes left tit"
"she fed on the right for 15 mins"
"fed both sides, about 10 minutes each"
"bottle, 90ml"
"gave her a bottle of 60ml 30 minutes ago"
"she slept for 2 hours"
"baby slept 45 minutes, that was at 3am"
"nappy change, wet"
"dirty nappy just now"
"mixed nappy"
"note: she seemed gassy after the feed"
"fed right tit 8 mins — not sure she latched well"
"quick feed left side maybe 5 minutes, around 6am"
```

Note: list isn't exhaustive at all

Parser must extract: type, side, duration_minutes, amount_ml, nappy_type, weight_grams, note, logged_at (with backdating if mentioned). If confidence is low on any field, set `needs_review: true` on the log entry.

## Alerts logic
Alerts are based on NHS newborn guidance combined with PRD thresholds.
They provide simple recommendations on whether the baby’s current patterns (feeding, nappy output, weight trend) are within expected NHS ranges or may need attention.
All alerts are non-diagnostic indicators.

## Dashboard (today view — default screen)
- Alert banner (top, always visible): surfaces the most urgent issue
- Side alternation prompt: "Last fed: left — start right next"
- 4 metric cards: feeds today (target 8–12), total sleep (target 16h), nappies (target 6+), time awake now
- 24h colour-coded timeline: sleep (blue), feed (green), nappy (grey), awake (amber)
- Recent log feed: last 5 entries, showing type + key detail + author + time

## Reports
- User can ask for any specific report or datapoint he would like to know in plain English
- Claude API generates the report from Supabase data
- Examples: "how many times did she feed yesterday", "show me sleep trend this week", "how long between feeds on average today"


| Condition | Alert |
|---|---|
| No feed logged in >3h | "No feed in 3h+ — consider feeding" |
| Feed duration <10 min | "Short feed flagged — check latch" |
| Nappy count <6 by 20:00 | "Only N nappies today — monitor output" |
| Left/right imbalance >2 over the day | "Feeding imbalance — offer right side next" |

## Tech stack
- Next.js 14 (App Router), TypeScript, Tailwind CSS
- Supabase (Postgres) for persistence — schema applied via Supabase MCP
- Vercel for hosting — deployed via Vercel MCP
- Claude API (claude-sonnet-4-20250514) for NLP parsing and report generation
- Web Speech API (native, no library)
- GitHub repo: github.com/fchanaud/baby-tracker

## Non-functional requirements
- No auth, no subscription, no email
- All tap targets ≥ 48px
- Dashboard loads <2s on mobile
- Works on iOS Safari and Android Chrome
- No hardcoded API keys — environment variables only
- Logs persist across sessions and devices via Supabase

## Out of scope (v1)
- Push notifications
- Photo uploads
- Milestone tracking
- Multi-baby support
- WHO centile chart overlay (add in v2)