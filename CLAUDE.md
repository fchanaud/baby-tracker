# Baby Tracker — Claude Context

## Stack
- Next.js 14 (App Router)
- TypeScript (no JS files)
- Tailwind CSS
- Supabase (DB)
- Vercel (hosting)

## Product Intent
Baby tracking app for sleep-deprived parents.  
Goal: allow logging baby activity in <5 seconds, one-handed, mobile-first.  
Focus: speed, simplicity, low cognitive load, minimal UI.

## UX Rules
- One-handed use only
- All core actions ≤ 5 seconds
- Timeline-first dashboard (not form-heavy UI)
- Minimal UI, no clutter
- Tap targets ≥ 48px
- Assume users are sleep-deprived

## NHS-Based Health Logic (Non-Diagnostic)
- Alerts based on NHS newborn guidance patterns
- Wet nappies: ≥6/day (after ~day 5) is normal baseline
- Feeding is on-demand; frequent feeding is normal
- Sleep is NOT used for alerts in newborn phase
- Weight must be interpreted over time, not in isolation
- Never provide medical diagnosis, only pattern-based indicators

## Architecture Rules
- Supabase is the source of truth
- Claude is used only for:
  - natural language parsing → structured logs
  - report generation
- Business logic should not rely on LLM decisions
- Alerts should be deterministic where possible

## Core Data Models
- Feed (breast / bottle)
- Sleep
- Nappy
- Weight
- Note

## Non-Goals (v1)
- No medical diagnosis
- No push notifications
- No multi-baby support
- No WHO growth charts

## Development Rules
- Work on `main` for now
- Never hardcode environment variables (use `.env.local`)