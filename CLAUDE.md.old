## Specs workflow

1. Franklin writes all comments and change requests in SPECS.md
   at the project root — written naturally, as spoken or dictated,
   no need to structure it.

2. When told "action SPECS.md" or "execute feedback.md" or "execute specs":
   
   **Phase 1: Deep Discovery Interview**
   - Read SPECS.md in full
   - **ALWAYS use AskUserQuestion tool** to conduct an in-depth interview
   - Ask non-obvious, probing questions about:
     * **UX/UI Details**: Layout, positioning, styling, responsive behavior, animations
     * **User Flow**: Step-by-step journey, edge cases, error states, loading states
     * **Data Model**: What data is stored, where, format, relationships
     * **Business Logic**: Validation rules, calculations, conditions, thresholds
     * **Integration Points**: Which APIs/components interact, data flow between them
     * **Testing Strategy**: How to verify success, what edge cases to test
     * **Performance**: Expected load, caching needs, optimization concerns
     * **Accessibility**: Mobile-first considerations, tap targets, keyboard nav
   - **Continue interviewing** until you have a complete picture:
     * Ask 3-5 questions per round using AskUserQuestion
     * After Franklin answers, ask follow-up questions if gaps remain
     * Do NOT skip this phase even for "simple" requests
     * Stop only when you can confidently write a detailed implementation plan
   
   **Phase 2: Prompt Rewrite**
   - Synthesize all interview answers into a structured prompt with:
     * **Goal**: Clear 1-2 sentence objective
     * **Context**: Why this matters, what problem it solves
     * **User Stories**: "As a [user], I want [feature] so that [benefit]"
     * **Technical Approach**: Architecture decisions, files to modify, data flow
     * **Success Criteria**: Measurable outcomes, acceptance tests
     * **Edge Cases**: Error handling, validation, boundary conditions
     * **Constraints**: Performance, compatibility, security considerations
   - Show the rewritten prompt to Franklin and wait for approval
   - If Franklin says "looks good" or "go ahead", proceed to Phase 3
   - If Franklin requests changes, update and confirm again

3. **Phase 3: Implementation**
   Work through every item in the approved prompt sequentially.
   Confirm what was done and the success criteria met before 
   moving to the next item.

4. **Phase 4: Verification**
   Before marking work as complete:
   - Test each feature in the running app (local dev server)
   - Verify all functionality works as expected
   - Fix any bugs discovered during testing
   - Commit changes only when verified working
   - Deploy to Vercel and verify deployment succeeds (per Deployment Workflow above)
   - Do NOT proceed until all features are tested and deployed

5. **Phase 5: Cleanup**
   When ALL items are complete, tested, and deployed:
   - Clear SPECS.md entirely and any screenshot uploaded also
   - Confirm to Franklin that SPECS.md has been cleared

6. **Phase 6: Exception Handling**
   If any item cannot be completed or a test fails: stop, report 
   clearly what succeeded and what remains, and do NOT clear 
   SPECS.md until everything is resolved.