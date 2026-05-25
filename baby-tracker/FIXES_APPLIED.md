# Fixes Applied - 2026-05-25

## Issues Reported
1. ❌ Nappy → Both option failed to save
2. ❌ Sleep duration needs 30-minute intervals up to 3 hours
3. ❌ Sleep 4+ hours should ask for precise number

## Root Causes
1. **Nappy Issue**: Production database uses different enum values
   - Schema expects: `'wet' | 'poo' | 'both'`
   - Production has: `'wet' | 'dirty' | 'mixed'`
   
2. **Sleep Duration**: Original options were not granular enough
   - Had: 15min, 30min, 1hr, 2hrs, 3hrs, 4hrs
   - Needed: 30-minute intervals up to 3 hours

## Solutions Applied

### 1. Nappy Type Fix
**Before**: Wet / Poo / Both  
**After**: Wet / Dirty / Mixed

Changed nappy type values to match production database:
- `'wet'` → kept as-is
- `'poo'` → changed to `'dirty'`
- `'both'` → changed to `'mixed'`

### 2. Sleep Duration Options
**Before**:
- 15 min, 30 min, 1 hour, 2 hours, 3 hours, 4+ hours

**After**:
- 30 min
- 1 hour
- 1.5 hrs
- 2 hours
- 2.5 hrs
- 3 hours
- 4+ hrs (prompts for custom input)

### 3. Custom Sleep Duration (4+ hours)
When user taps "4+ hrs" button:
1. Shows prompt: "How many hours?"
2. User enters number (e.g., 5, 6.5, 8)
3. Converts to minutes (e.g., 5 → 300 min)
4. Saves to database

## Testing Results

All endpoints tested successfully:

```bash
# Nappy - Dirty
✅ POST /api/logs {"nappy_type": "dirty"} → success

# Nappy - Mixed
✅ POST /api/logs {"nappy_type": "mixed"} → success

# Sleep - 1.5 hours
✅ POST /api/logs {"duration_minutes": 90} → success

# Sleep - Custom (5 hours)
✅ POST /api/logs {"duration_minutes": 300} → success
```

## Deployment

- **Commit**: 8f4cc00
- **Pushed**: 2026-05-25 08:16 UTC
- **Status**: Deploying to production
- **URL**: https://baby-tracker-zeta-six.vercel.app/

## Verification Checklist

Test on your device after deployment:

- [ ] Nappy → Wet → Saves successfully
- [ ] Nappy → Dirty → Saves successfully
- [ ] Nappy → Mixed → Saves successfully
- [ ] Sleep → 30 min → Saves successfully
- [ ] Sleep → 1.5 hrs → Saves successfully
- [ ] Sleep → 2.5 hrs → Saves successfully
- [ ] Sleep → 3 hours → Saves successfully
- [ ] Sleep → 4+ hrs → Shows prompt
- [ ] Sleep → 4+ hrs → Enter "5" → Saves 5 hours
- [ ] Sleep → 4+ hrs → Enter "6.5" → Saves 6.5 hours
