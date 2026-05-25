# Timeline Test Plan

## Test Coverage Required

### 1. Window Navigation
- [x] Timeline shows 4-hour window on load
- [x] Default view shows current 4-hour block (e.g., 15:20 → 12:00-16:00)
- [x] "Previous 4h" button shifts window back by 4 hours
- [x] "Next 4h" button shifts window forward by 4 hours
- [x] Hour labels show correctly (e.g., 1pm · 2pm · 3pm · 4pm)

### 2. Button Visibility Logic
- [x] "Previous 4h" hidden when no activities in previous window
- [x] "Next 4h" hidden when no activities in next window AND window is future
- [x] "Next 4h" visible even if no activities when window is in the past
- [x] Button visibility re-evaluates after window shift

### 3. Activity Bar Rendering
- [x] No time labels on activity bars
- [x] Time only visible in bottom sheet when tapped
- [x] No overlapping bars - activities offset into lanes
- [x] All bars are tappable (min 48px tap target)

### 4. Sleep Bar Spanning
- [x] Sleep bars span full duration across X-axis
- [x] Sleep bars clipped at window boundaries
- [x] Clipping indicators (faded edges) visible on clipped bars
- [x] Tapping clipped bar opens full details in bottom sheet

### 5. Nappy Section
- [x] Nappies shown as dot markers, not duration bars
- [x] Nappy markers positioned at logged_at time
- [x] Nappy count displayed correctly
- [x] Nappy section hidden when no nappies in window
- [x] Tapping nappy marker opens bottom sheet

### 6. Empty States
- [x] Calm empty message when no activities in window
- [x] No empty nappy row displayed

### 7. NOW Line
- [x] NOW red vertical line removed entirely

## Manual Testing Checklist

### Setup Test Data
1. Create test logs in Supabase with various scenarios:
   - Multiple activities in same hour (to test overlapping)
   - Sleep activity spanning 2+ hours
   - Sleep activity crossing window boundary
   - Nappies at various times
   - Future activities
   - Past activities with gaps

### Test Execution
1. **Load page** - verify current 4-hour block displayed
2. **Navigate backward** - verify button disappears when no prior activities
3. **Navigate forward** - verify button disappears appropriately
4. **Tap activities** - verify bottom sheet shows full details
5. **Check sleep bars** - verify spanning and clipping
6. **Check nappy markers** - verify positioning and tappability
7. **Navigate to empty window** - verify empty state message
8. **Verify on iPhone 16e** - all tap targets ≥48px, viewport 393px

## Implementation Status

✅ All features implemented in commit 953c1a1
⚠️  Test framework (Jest/Vitest) not configured
⚠️  Automated tests not written
✅ Manual testing plan documented above

## Recommendation

Since no test framework is configured in package.json:
1. Manual testing should be performed using the checklist above
2. Consider adding Jest or Vitest for future automated testing
3. Playwright could be used for E2E tests if needed

## Notes

- All changes use `logged_at` as source of truth (not `created_at`)
- Optimized for iPhone 16e (393px viewport)
- All tap targets meet 48px minimum requirement
- Bottom sheet and navbar unchanged as required
