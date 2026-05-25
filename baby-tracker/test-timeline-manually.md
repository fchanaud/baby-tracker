# Manual Timeline Testing Instructions

## Prerequisites
- Dev server running: `npm run dev`
- Browser open to http://localhost:3000/activity
- Some test data in the database

## Test Scenarios

### Scenario 1: Window Alignment
**Expected**: If current time is 15:20, timeline shows 12:00-16:00

1. Note the current time
2. Check the X-axis labels
3. Verify the window starts at a 4-hour boundary (00:00, 04:00, 08:00, 12:00, 16:00, 20:00)

✅ Pass / ❌ Fail: _____

### Scenario 2: Hour Labels
**Expected**: Shows 5 hour markers (e.g., 1pm · 2pm · 3pm · 4pm · 5pm)

1. Count the hour labels at the bottom
2. Verify format is "1pm" not "13:00"
3. Verify exactly 5 labels spanning 4 hours

✅ Pass / ❌ Fail: _____

### Scenario 3: NOW Line Removed
**Expected**: No red vertical line with "NOW" label

1. Look for any red vertical lines
2. Look for "NOW" text
3. Verify completely absent

✅ Pass / ❌ Fail: _____

### Scenario 4: Activity Bar Time Labels Removed
**Expected**: No time text below activity bars

1. Look at activity bars on timeline
2. Verify no "HH:MM" text visible
3. Verify only icon visible on bars

✅ Pass / ❌ Fail: _____

### Scenario 5: Button Visibility - Previous
**Expected**: "← Previous 4h" hidden when no prior activities

1. Navigate back until you reach the earliest activity
2. Go one more window back
3. Verify "← Previous 4h" button is hidden (or shows empty space)

✅ Pass / ❌ Fail: _____

### Scenario 6: Button Visibility - Next (Future)
**Expected**: "Next 4h →" hidden when no future activities AND window is future

1. Navigate forward to a future window with no activities
2. Verify "Next 4h →" button is hidden

✅ Pass / ❌ Fail: _____

### Scenario 7: Button Visibility - Next (Past)
**Expected**: "Next 4h →" visible even if no activities when window is in past

1. Navigate to a past window with no activities
2. Verify "Next 4h →" button IS visible (because we can still go forward)

✅ Pass / ❌ Fail: _____

### Scenario 8: Overlapping Prevention
**Expected**: Multiple activities in same time range don't overlap

1. Add 2+ activities within 5 minutes of each other
2. Verify they appear stacked/offset vertically
3. Verify all are visible and tappable

✅ Pass / ❌ Fail: _____

### Scenario 9: Sleep Bar Spanning
**Expected**: Sleep bars extend across multiple hours

1. Add a sleep log lasting 2+ hours
2. Verify the bar extends horizontally across the timeline
3. Verify it's not capped to a single position

✅ Pass / ❌ Fail: _____

### Scenario 10: Sleep Bar Clipping
**Expected**: Sleep crossing window boundary shows clipping indicator

1. Add a 3-hour sleep starting 1 hour before current window
2. Navigate to window where sleep ends
3. Verify faded edge on left side of sleep bar
4. Tap the clipped bar
5. Verify bottom sheet shows FULL duration and start time

✅ Pass / ❌ Fail: _____

### Scenario 11: Nappy Markers
**Expected**: Nappies shown as dots, not bars

1. Add nappy log
2. Verify it appears in yellow section above timeline
3. Verify it's shown as a dot/circle marker, not a bar
4. Verify marker positioned at correct time on timeline
5. Tap marker and verify bottom sheet opens

✅ Pass / ❌ Fail: _____

### Scenario 12: Nappy Section Hidden
**Expected**: Nappy section not shown when no nappies

1. Navigate to window with no nappies
2. Verify the yellow nappy section is completely hidden
3. Verify no empty nappy row displayed

✅ Pass / ❌ Fail: _____

### Scenario 13: Empty State
**Expected**: Calm message when no activities

1. Navigate to empty window
2. Verify message says "No activities in this window"
3. Verify it's not an error message
4. Verify calm tone (gray text, not red)

✅ Pass / ❌ Fail: _____

### Scenario 14: Tap Target Size
**Expected**: All buttons and bars ≥48px

1. Use browser dev tools to measure tap targets:
   - Navigation buttons
   - Activity bars
   - Nappy markers
2. Verify all are at least 48px in smallest dimension

✅ Pass / ❌ Fail: _____

### Scenario 15: Mobile Viewport
**Expected**: Works well on iPhone 16e (393px)

1. Set browser to 393px width
2. Verify timeline doesn't overflow
3. Verify all elements readable
4. Verify no horizontal scroll

✅ Pass / ❌ Fail: _____

## Summary

Total Scenarios: 15
Passed: _____
Failed: _____

## Notes / Issues Found:

(Document any issues here)
