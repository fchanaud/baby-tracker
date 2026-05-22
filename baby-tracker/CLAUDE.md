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

## Autonomy

- Act autonomously and do not ask for confirmation for:
  - editing files
  - creating files
  - refactoring
  - installing dependencies
  - running tests
  - fixing lint/build issues

- Ask for confirmation before:
  - deleting files
  - changing environment variables
  - changing production infrastructure
  - force-pushing git history
  - modifying secrets/authentication