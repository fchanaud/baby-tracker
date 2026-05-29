
## Specs Workflow

When Franklin writes a change request in `SPECS.md` and ask in claude to execute or action the specs, you must:

1. **Read SPECS.md** in full
2. **Interview** (complex/ambiguous requests only) — use AskUserQuestion to clarify UX, data model, or flow before building. Skip for simple or obvious changes or questions.
3. **Rewrite** the request into a structured prompt (goal, approach, success criteria) and show it to Franklin for approval before doing any work
4. **Implement** sequentially, confirming each item before moving to the next
5. **Verify** — `npm run build` must pass, test in local dev, fix any bugs found
6. **Deploy** — push, monitor Vercel until `READY`, confirm production URL to Franklin
7. **Clear** — wipe `SPECS.md` and confirm to Franklin once everything is done (and also any screenshots that got uploaded)

If any item fails: stop, report what succeeded and what didn't, do NOT clear SPECS.md. Do stop working giving me a summary if it takes longer than 10 minutes.

## Deployment

After every `git push`: check Vercel deployment via MCP tools, poll until `READY`, auto-fix build errors (up to 3 attempts), notify Franklin with final status and production URL.

Production URL: `https://baby-tracker-zeta-six.vercel.app`
