# Baby Tracker — Claude Context

## Product Intent
Baby tracking app for sleep-deprived parents.  
**Goal**: One-handed, mobile-first logging with minimal cognitive load.

## UX Rules
- One-handed use only
- Timeline-first dashboard (not form-heavy UI)
- Minimal UI, no clutter
- Tap targets ≥ 48px
- Test on iPhone 16e specifically

## NHS-Based Health Logic (Non-Diagnostic)
- Alerts based on NHS newborn guidance patterns
- Wet nappies: ≥6/day (after ~day 5) is normal baseline
- Feeding is on-demand; frequent feeding is normal
- Sleep is NOT used for alerts in newborn phase
- Weight must be interpreted over time, not in isolation
- **Never provide medical diagnosis**, only pattern-based indicators

## Architecture Rules
- Supabase is the source of truth
- Claude API is used ONLY for:
  - Natural language parsing → structured logs
  - Report generation
- **Business logic must NOT rely on LLM decisions**
- Alerts should be deterministic where possible

## Deployment Workflow

**After every `git push`**: Automatically monitor Vercel deployment and fix errors.

**Process:**
1. Check deployment status via Vercel API
2. Poll until complete (30-60s intervals)
3. If failed: fetch build logs, identify root cause, apply minimal fix, push
4. Stop when: deployment succeeds, 3 attempts reached, or architectural issue
5. Always notify user with final status + production URL

## Non-Goals (v1)
- No medical diagnosis
- No push notifications
- No multi-baby support

## Feature Implementation Workflow

Every feature must be:
1. **Crash tested** in the running app before commit
2. **Bug-fixed** until working
3. **Committed** only when verified
4. **Deployed** to Vercel with status confirmation