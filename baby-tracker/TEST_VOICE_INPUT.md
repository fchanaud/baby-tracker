# Voice Input Test Plan

## Test 1: Simple Feed (No Clarification)
1. Tap microphone
2. Say: "baby fed 50ml"
3. **Expected**: Shows "📝 Recorded: 'baby fed 50ml' - Tap again to process"
4. Tap microphone again
5. **Expected**: Processes and saves, shows "✓ Logged: ..."

## Test 2: Breast Feed Requiring Side Clarification
1. Tap microphone
2. Say: "baby fed breast"
3. **Expected**: Shows "📝 Recorded: 'baby fed breast' - Tap again to process"
4. Tap microphone again
5. **Expected**: Shows "🤱 Which side? Say left/right/both - Tap to answer"
6. Tap microphone
7. Say: "left"
8. **Expected**: Shows "📝 Recorded: 'left' - Tap again to confirm"
9. **CRITICAL TEST**: Tap microphone again
10. **Expected**: Processes clarification and saves

## Test 3: Nappy Change Requiring Type Clarification
1. Tap microphone
2. Say: "changed nappy"
3. **Expected**: Shows "📝 Recorded: 'changed nappy' - Tap again to process"
4. Tap microphone again
5. **Expected**: Shows "💩 What type? Say wet only/poo only/both - Tap to answer"
6. Tap microphone
7. Say: "poo only"
8. **Expected**: Shows "📝 Recorded: 'poo only' - Tap again to confirm"
9. Tap microphone again
10. **Expected**: Shows "💩 What consistency? Liquid, normal, or soft? - Tap to answer"
11. Tap microphone
12. Say: "normal"
13. **Expected**: Shows "📝 Recorded: 'normal' - Tap again to confirm"
14. Tap microphone again
15. **Expected**: Processes and saves

## Bug to Verify Fixed
**Before fix**: At steps 7-9 in Test 2, the system would auto-process after saying "left" without waiting for the user to tap again
**After fix**: System should wait for tap at step 9 before processing

## How to Test
1. Open http://localhost:3000
2. Set up a baby profile if needed
3. Test each scenario above
4. Mark PASS/FAIL for each test
