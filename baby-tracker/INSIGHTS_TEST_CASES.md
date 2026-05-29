# Insights API Test Cases

## Test Setup
1. Switch to **Production** environment
2. Verify you have known data (e.g., 2 feeds, 1 sleep, 3 nappies today)

## Simple Queries (Database Only - No Claude API)

### Feed Counts
- **Query**: "how many feeds today?"
- **Expected**: Exact count from production data
- **Type**: Simple (local)

### Nappy Counts  
- **Query**: "how many nappies today?"
- **Expected**: Exact count with wet nappy breakdown
- **Type**: Simple (local)

### Sleep Total
- **Query**: "total sleep today?"
- **Expected**: Sum of all sleep durations today
- **Type**: Simple (local)

### Last Feed
- **Query**: "when was the last feed?"
- **Expected**: Time ago + feed type + who logged it
- **Type**: Simple (local)

### Average Time Between Feeds
- **Query**: "average time between feeds?"
- **Expected**: Calculated from today's feed timestamps
- **Type**: Simple (local)

## NHS-Based Queries (Local Logic - No Claude API)

### Overall Track
- **Query**: "am I on track?"
- **Expected**: NHS-based assessment with ✅/⚠️/🔴 for feeds, nappies, sleep
- **Type**: NHS-based (local)

### Nappies Track
- **Query**: "am I on track with nappies?"
- **Expected**: NHS wet nappy guidance (6+ per day after day 5)
- **Type**: NHS-based (local)

### Feeds Track
- **Query**: "on track with feeds?"
- **Expected**: NHS feeding guidance (8-12 per day)
- **Type**: NHS-based (local)

## Complex Queries (Claude API)

### Trends
- **Query**: "show sleep trend this week"
- **Expected**: Analysis of sleep patterns over 7 days
- **Type**: Complex (Claude API)

### Comparisons
- **Query**: "am I feeding more today than yesterday?"
- **Expected**: Comparison with reasoning
- **Type**: Complex (Claude API)

## Verification Steps

1. **Environment Check**: Before each test, verify the environment toggle shows "Production"
2. **Known State**: Log 2 feeds in production, then ask "how many feeds today?" → should return "2"
3. **Cross-Environment**: Switch to Test, log 5 feeds, switch back to Production, ask again → should still return "2"
4. **API vs Local**: 
   - Simple queries should return instantly (<100ms)
   - Complex queries may take 1-3 seconds (Claude API)

## Bug Report Template

If a query returns incorrect data:

```
**Query**: "how many feeds today?"
**Environment**: Production
**Expected**: 2 feeds
**Actual**: 3 feeds (showed test data)
**Logged data**: [describe what you logged]
**Timestamp**: [when you tested]
```
