# NHS Newborn Tracking Rules — Claude Context (v1.0)

## ⚠️ Purpose
This file defines **actionable NHS-based thresholds** for evaluating baby logs in the Baby Tracker app.

It is NOT medical advice. It is a heuristic evaluation layer for pattern detection.

Sources:
- https://www.nhs.uk/best-start-in-life/
- https://www.nhs.uk/conditions/baby/
- https://www.nhs.uk/baby/caring-for-a-newborn/

---

# 1. Feeding adequacy rules

## Expected baseline (from ~day 5 onward)
- Typical range: frequent feeds across 24h
- Breastfeeding: on-demand, often 8–12+ feeds/day equivalent pattern
- Bottle feeding: responsive feeding, no forced completion

## WARNING CONDITIONS (track as alerts)

Trigger "low feeding intake pattern" if:
- No feed logged for >3 hours (newborn phase)
- OR unusually low total feeding activity over 24h compared to baseline pattern
- OR repeated short feeds (<10 min breastfeed OR very low volume bottle feeds)

NHS-aligned interpretation:
- Feeding should be frequent and responsive
- No strict schedule exists, but long gaps may indicate reduced intake

Source:
https://www.nhs.uk/best-start-in-life/baby/feeding-your-baby/

---

# 2. Nappy output rules

## Expected baseline (from ~day 5 onward)

- Wet nappies: **≥ 6 per day**
- Dirty nappies: **≥ 1 soft stool per day**

## WARNING CONDITIONS

Trigger "low output pattern" if:
- Wet nappies < 6 in 24h (after day 5)
- OR no dirty nappy over extended period + low feeds

Interpretation:
- Wet nappies are the primary hydration/intake indicator
- Stool frequency is secondary but supportive

Source:
https://www.nhs.uk/conditions/baby/breastfeeding-and-bottle-feeding/

---

# 3. Sleep rules (for interpretation only)

## Expected baseline
- Up to ~18 hours sleep per day (high variability)
- Sleep is fragmented and irregular

## IMPORTANT CONSTRAINT
- No alert should be triggered for sleep alone in newborn phase
- Sleep is not a reliable standalone health metric

Source:
https://www.nhs.uk/baby/caring-for-a-newborn/helping-your-baby-to-sleep/

---

# 4. Combined wellbeing scoring logic (core system rule)

## A baby is likely within expected range if:

- ≥ 6 wet nappies/day (after day 5)
- Regular feeding activity throughout 24h
- At least 1 dirty nappy/day (context dependent)
- No persistent long gaps between feeds

---

## Trigger "monitoring suggested" if ANY 2 of:

- Wet nappies below 6/day
- Reduced feeding frequency vs baseline pattern
- Persistent short/low feeds

---

## Trigger "review recommended" if:

- Wet nappies < 6/day + low feeding activity
- AND symptoms persist across multiple logs (24–48h)

---

# 6. Alert philosophy (critical)

Claude MUST:
- Never diagnose
- Never state illness likelihood
- Only compare against NHS baseline patterns
- Always frame as:
  - “pattern below typical NHS indicators”
  - “monitoring suggested”
  - “consider consulting GP/health visitor”

---

# 5. Key evaluation priority order (important for your app)

1. Wet nappies (highest signal)
2. Feeding frequency + duration/volume
3. Dirty nappies (supporting signal)
4. Sleep (context only, never diagnostic)

---

# 6. System intent

This file is used to:
- compute dashboard alerts
- generate daily summaries
- answer “is my baby okay?” type queries
- compare logs to NHS baseline expectations

It is NOT used for:
- diagnosis
- medical decision-making
- replacing healthcare advice