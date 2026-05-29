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
- Tap-based multi-step form (feed/sleep/nappy)
- Optional note field as last step before saving — rarely used, captures context like "seemed gassy" or "didn't latch well"
- Backdating supported: user selects "Earlier" and specifies hours ago

## Dashboard (today view — default screen)
- Side alternation prompt: "Last fed: left — start right next"
- 4 metric cards: feeds today (target 8–12), total sleep (target 16h), nappies (target 6+), time awake now
- 24h colour-coded timeline: sleep (blue), feed (green), nappy (grey), awake (amber)
- Recent log feed: last 5 entries, showing type + key detail + author + time + 📝 icon if note attached

## Reports
- User can ask for any specific report or datapoint he would like to know in plain English
- Claude API generates the report from Supabase data
- Examples: "how many times did she feed yesterday", "show me sleep trend this week", "how long between feeds on average today"



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