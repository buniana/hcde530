# IdeaFlow — Design System Rules

## Personality
The UI should feel like a modern workshop tool — energetic, clean, and purposeful.
Think: FigJam meets Notion meets a game show timer.
Avoid: corporate SaaS, clinical white, generic AI chatbot aesthetics.

---

## Color Palette

The palette is warm and energetic — a cream background anchors the layout like workshop paper, orange drives action, and cyan provides a fresh secondary accent. The yellow and pink are reserved for highlights and decorative moments.

| Role | Token name | Hex |
|------|------------|-----|
| Primary action | `--color-primary` | `#FF9122` |
| Primary hover | `--color-primary-dark` | `#E07A10` |
| Primary light / tint | `--color-primary-light` | `#FFB05A` |
| Secondary / supporting | `--color-secondary` | `#01B5D4` |
| Accent / highlight | `--color-accent` | `#FDE658` |
| Accent pink / decorative | `--color-accent-pink` | `#FFABB0` |
| Timer warning | `--color-warning` | `#E07A10` |
| Timer critical | `--color-danger` | `#D2001E` |
| Background | `--color-bg` | `#FFFCF6` |
| Surface | `--color-surface` | `#FFFFFF` |
| Border | `--color-border` | `#E8E0D4` |
| Text primary | `--color-text` | `#1A1A1A` |
| Text secondary | `--color-text-muted` | `#666666` |
| Text disabled | `--color-text-disabled` | `#AAAAAA` |

> **Note on success / confirm:** There is no dedicated `--color-success` token yet. Use `--color-secondary` (`#01B5D4`) as a stand-in for completed states until a green is introduced.

**Keep timer warning and danger colors semantically distinct** — `--color-warning` is the same hue as `--color-primary-dark` (a deep amber-orange), while `--color-danger` is a sharp red. Users must feel the urgency shift even without reading the clock.

---

## Typography

- **Font families:**
  - Body / UI: `Google Sans Flex`, `Google Sans`, `system-ui` — clean and readable at all sizes
  - Display / headline: `Luckiest Guy` (class `.font-headline`) — used for phase titles and splash moments; gives the workshop an expressive, game-show energy
- **Scale:**
  - Display / Phase title: 32px, bold (700), `.font-headline`
  - Section heading: 20px, semibold (600), Google Sans
  - Body: 16px, regular (400)
  - Label / caption: 13px, medium (500)
  - Timer: 48px, bold (700), monospace

---

## Spacing System
Use multiples of 4px throughout.

| Token | Value |
|-------|-------|
| xs | 4px |
| sm | 8px |
| md | 16px |
| lg | 24px |
| xl | 32px |
| 2xl | 48px |
| 3xl | 64px |

---

## Components

### Buttons
- **Primary:** `--color-primary` fill, white text, rounded-lg (8px), px-6 py-3
- **Secondary:** White fill, `--color-primary` border, `--color-primary` text
- **Ghost:** No border, `--color-primary` text, hover background subtle
- **Destructive:** `--color-danger` fill, white text
- All buttons: transition 150ms ease, hover darken 10%

### Cards
- `--color-surface` background, `--color-border` border, border-radius 12px
- Shadow: `0 1px 3px rgba(0,0,0,0.08)`
- Padding: 24px
- Selected state: `--color-primary` border (2px), light tint of `--color-primary` background

### Input fields
- Border: `--color-border`, border-radius 8px, padding 12px 16px
- Focus: `--color-primary` border (2px), no outline
- Placeholder: `--color-text-disabled`
- Textarea: min-height 120px, resize vertical

### Timer display
- Large monospace number, centered
- Color transitions: `--color-primary` → `--color-warning` (last 30s) → `--color-danger` (last 10s)
- Subtle pulse animation when critical

### Phase indicator
- Step dots or a horizontal progress bar at the top
- Active step: `--color-primary` fill
- Completed step: `--color-secondary` (`#01B5D4`) fill with checkmark (stand-in until a dedicated `--color-success` green is added)
- Upcoming step: `--color-text-disabled`

---

## Motion & Animation
- Phase transitions: fade + slight upward slide, 300ms ease-out
- Button interactions: scale(0.97) on press
- Timer pulse: subtle scale(1.02) on each second when critical
- Card selection: border color transition 150ms

---

## Do Not
- Use more than 2 font weights on a single screen
- Use pure black (#000000) for text — use `--color-text` (`#1A1A1A`) instead
- Use drop shadows heavier than 0 4px 12px rgba(0,0,0,0.12)
- Mix border-radius values randomly — pick 8px or 12px and stay consistent
- Use placeholder text as a label substitute
