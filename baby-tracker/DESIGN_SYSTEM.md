# Baby Tracker Design System

## Philosophy: "Warm Simplicity"

This design system transforms the app from a clinical tracking tool into a warm, supportive parenting companion. Inspired by Babee.ai's emotional design approach.

---

## Color Palette

### Activity Colors

Each activity type has a soft pastel color for emotional warmth:

| Activity    | Background | Accent  | Usage                          |
|-------------|-----------|---------|--------------------------------|
| Feed        | #FFE4E4   | #FF6B9D | Breastfeed & bottle feeds      |
| Sleep       | #E4E4FF   | #6B5FFF | Naps & night sleep             |
| Nappy       | #FFF9E4   | #FFB800 | Diaper changes                 |
| Note        | #E4F4FF   | #0088FF | General notes                  |

**Usage:**
```tsx
import { getActivityColor } from '@/lib/colors';

const { bg, accent } = getActivityColor('breastfeed');
// bg: '#FFE4E4', accent: '#FF6B9D'
```

### Neutrals

| Color     | Hex     | Usage                           |
|-----------|---------|---------------------------------|
| Gray 50   | #F9FAFB | Background, subtle surfaces     |
| Gray 100  | #F3F4F6 | Hover states, disabled elements |
| Gray 200  | #E5E7EB | Borders, dividers               |
| Gray 500  | #6B7280 | Secondary text, placeholders    |
| Gray 900  | #111827 | Primary text, headings          |

### Functional

| Color   | Hex     | Usage                        |
|---------|---------|------------------------------|
| Success | #10B981 | Success states, confirmations|
| Warning | #F59E0B | Warnings, alerts             |
| Error   | #EF4444 | Errors, destructive actions  |

---

## Typography

### Font Family
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
```

### Scale

| Size    | Rem      | Pixels | Usage                          |
|---------|----------|--------|--------------------------------|
| xs      | 0.75rem  | 12px   | Timestamps, metadata           |
| sm      | 0.875rem | 14px   | Body text, descriptions        |
| base    | 1rem     | 16px   | Primary text                   |
| lg      | 1.125rem | 18px   | Card titles, subheadings       |
| xl      | 1.25rem  | 20px   | Section headers                |
| 2xl     | 1.5rem   | 24px   | Page titles                    |

**Usage:**
```tsx
<h1 className="text-2xl font-bold">Page Title</h1>
<p className="text-base">Regular paragraph text</p>
<span className="text-xs text-gray-500">Timestamp</span>
```

---

## Spacing

Consistent spacing scale for layouts and components:

| Token     | Rem      | Pixels | Usage                          |
|-----------|----------|--------|--------------------------------|
| space-1   | 0.25rem  | 4px    | Tight spacing                  |
| space-2   | 0.5rem   | 8px    | Small gaps                     |
| space-3   | 0.75rem  | 12px   | Card margins, small padding    |
| space-4   | 1rem     | 16px   | **Card padding (standard)**    |
| space-5   | 1.25rem  | 20px   | Medium gaps                    |
| space-6   | 1.5rem   | 24px   | Large padding                  |
| space-8   | 2rem     | 32px   | **Section spacing (standard)** |
| space-12  | 3rem     | 48px   | Extra large gaps               |

**Guidelines:**
- Card padding: `p-4` (16px)
- Card margin: `m-3` (12px)
- Section spacing: `my-8` (32px vertical)

---

## Border Radius

Soft, rounded corners throughout:

| Token  | Rem      | Pixels | Usage                          |
|--------|----------|--------|--------------------------------|
| sm     | 0.375rem | 6px    | Badges, small chips            |
| md     | 0.5rem   | 8px    | Cards, inputs, buttons         |
| lg     | 0.75rem  | 12px   | Large cards                    |
| xl     | 1rem     | 16px   | Voice button, modals           |
| full   | 9999px   | ∞      | Pills, avatars, circular       |

**Usage:**
```tsx
<div className="rounded-md">Card</div>
<button className="rounded-xl">Voice Button</button>
<img className="rounded-full" />
```

---

## Shadows

Elevation for depth and hierarchy:

| Token | Value                                    | Usage                          |
|-------|------------------------------------------|--------------------------------|
| sm    | `0 1px 2px 0 rgb(0 0 0 / 0.05)`         | Subtle elevation, hover states |
| md    | `0 4px 6px -1px rgb(0 0 0 / 0.1)`       | **Cards, timeline bars**       |
| lg    | `0 10px 15px -3px rgb(0 0 0 / 0.1)`     | Modals, floating elements      |

**Usage:**
```tsx
<div className="shadow-md">Activity Card</div>
<div className="shadow-lg">Modal</div>
```

---

## Components

### Activity Card

Timeline activity cards with color-coded backgrounds:

```tsx
<div className="bg-feed-bg border-l-4 border-feed rounded-md shadow-md p-4">
  <h3 className="text-lg font-semibold text-gray-900">Fed - Left</h3>
  <p className="text-sm text-gray-600">10 min</p>
  <span className="text-xs text-gray-500">2h 15m ago</span>
</div>
```

### Duration Bar

Chart bars with rounded tops:

```tsx
<div 
  className="bg-sleep rounded-t-md"
  style={{ 
    height: '60%', 
    width: '8px'
  }}
/>
```

### Button

Minimum 48px tap target:

```tsx
<button className="min-h-12 min-w-12 bg-feed text-white rounded-xl shadow-md px-6 py-3">
  Save
</button>
```

---

## Accessibility

### Color Contrast

All text meets WCAG 2.1 AA standards:
- Gray 900 on pastel backgrounds: ≥ 4.5:1
- Gray 500 on white: ≥ 4.5:1

Test with: [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

### Touch Targets

Minimum sizes for mobile:
- Interactive elements: 48x48px
- Voice button: 96px+ height
- Timeline bars: 8px width, tappable area 48px

### Motion

Respect `prefers-reduced-motion`:

```tsx
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

<div className={prefersReducedMotion ? '' : 'animate-pulse'}>
  Listening...
</div>
```

---

## Usage Examples

### Timeline Bar Chart

```tsx
import { getActivityColor } from '@/lib/colors';

function DurationBar({ log }) {
  const { bg, accent } = getActivityColor(log.log_type);
  
  return (
    <div
      className="rounded-t-md shadow-md cursor-pointer"
      style={{
        backgroundColor: accent,
        height: `${(log.duration_minutes / 120) * 100}%`,
        width: '8px',
      }}
      onClick={() => showDetails(log)}
    />
  );
}
```

### Activity Filter Chip

```tsx
<button
  className={`
    px-4 py-2 rounded-full text-sm
    ${active ? 'shadow-md opacity-100' : 'opacity-30'}
  `}
  style={{
    backgroundColor: colors.sleep[50],
    color: colors.sleep[500],
  }}
>
  🔵 Sleep
</button>
```

### Date Navigator

```tsx
<div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
  <button className="p-2 rounded-md hover:bg-gray-100">◀</button>
  <span className="text-lg font-semibold text-gray-900">
    TODAY - May 22, 2026
  </span>
  <button className="p-2 rounded-md hover:bg-gray-100">▶</button>
</div>
```

---

## Responsive Breakpoints

Mobile-first approach:

```css
/* Mobile (default) */
@media (min-width: 320px) { /* ... */ }

/* Tablet */
@media (min-width: 768px) { /* ... */ }

/* Desktop */
@media (min-width: 1024px) { /* ... */ }
```

Primary focus: iPhone SE (375px) to iPhone 14 Pro Max (430px)

---

## Design Tokens Reference

All tokens are available as CSS variables in `globals.css` and Tailwind utilities in `tailwind.config.ts`.

**Quick Reference:**
- Colors: `bg-feed`, `text-sleep`, `border-nappy`
- Spacing: `p-4`, `m-3`, `gap-6`
- Radius: `rounded-md`, `rounded-xl`
- Shadows: `shadow-md`, `shadow-lg`
- Text: `text-lg`, `text-xs`
