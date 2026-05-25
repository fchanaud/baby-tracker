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

## Feedback workflow

1. Franklin writes all comments and change requests in FEEDBACK.md
   at the project root — written naturally, as spoken or dictated,
   no need to structure it.

2. When told "action FEEDBACK.md":
   - Read FEEDBACK.md in full
   - Do ask clarification questions if you need precisions on anything and provide answer for each that makes the more sense to you and ask for my input
   - Rewrite the contents into a structured Claude Code prompt 
     using the established format: goal, context, success criteria, 
     constraints
   - Show the rewritten prompt to Franklin and wait for approval 
     before doing any work
   - If Franklin says something like "looks good" or "go ahead", proceed
   - If Franklin requests changes to the rewrite, update and 
     confirm again before acting

3. Work through every item in the approved prompt sequentially.
   Confirm what was done and the success criteria met before 
   moving to the next item.

4. Before marking work as complete:
   - Test each feature in the running app (local dev server)
   - Verify all functionality works as expected
   - Fix any bugs discovered during testing
   - Do NOT proceed until all features are verified working

5. When ALL items are complete, tested, and verified:
   - Clear FEEDBACK.md entirely
   - Confirm to Franklin that FEEDBACK.md has been cleared

6. If any item cannot be completed or a test fails: stop, report 
   clearly what succeeded and what remains, and do NOT clear 
   FEEDBACK.md until everything is resolved.