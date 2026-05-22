# Baby Tracker — Claude Context

## Stack
- Next.js 14 (App Router)
- TypeScript (no JS files)
- Tailwind CSS
- Supabase (DB)
- Vercel (hosting)

## Product Intent
Baby tracking app for sleep-deprived parents.  
Goal: allow logging baby activity, one-handed, mobile-first.  
Focus: simplicity, low cognitive load, minimal UI.

## UX Rules
- One-handed use only
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

## Deployment Workflow (Vercel API)

**CRITICAL**: After every `git push`, automatically monitor Vercel deployment and fix errors.

**Process:**
1. After pushing code, use Vercel API to check deployment status
2. Poll every 30-60 seconds until deployment completes
3. If deployment fails:
   - Fetch build logs via Vercel API
   - Identify root cause from error logs
   - Apply minimal necessary fix (no unrelated refactors)
   - Commit and push fix
   - Resume monitoring
4. Stop when:
   - Deployment succeeds (status: READY)
   - Maximum 3 fix attempts reached
   - Architectural issue requires user intervention
5. **Always notify user** of final deployment status with production URL

**Vercel API:**
- List deployments: `GET https://api.vercel.com/v6/deployments?projectId=prj_7gAb5nFMImZO9Yq7tu15kXJCwybE`
- Deployment details: `GET https://api.vercel.com/v13/deployments/{deploymentId}`
- Build logs: `GET https://api.vercel.com/v2/deployments/{deploymentId}/events`
- Auth: Use `VERCEL_TOKEN` env var or read from `.vercel` directory

**Production URL**: https://baby-tracker-zeta-six.vercel.app

## Core Data Models
- Feed (breast / bottle)
- Sleep
- Nappy
- Note

## Non-Goals (v1)
- No medical diagnosis
- No push notifications
- No multi-baby support

## Development Rules
- Work on `main` for now
- Never hardcode environment variables (use `.env.local`)

## Autonomy

- Act autonomously and do not ask for confirmation within claude for:
  - editing files
  - creating files
  - refactoring
  - installing dependencies
  - running tests
  - fixing lint/build issues
  - do curl requests for any service

- Ask for confirmation before:
  - deleting files
  - changing environment variables
  - changing production infrastructure
  - force-pushing git history
  - modifying secrets/authentication

## Feature Implementation Workflow

Every time a feature is implemented:
1. **Crash test** the feature in the running app
2. **Fix all bugs** that arise from testing
3. **Commit the work** only after the feature is verified working