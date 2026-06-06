# IdeaFlow — Accessibility Rules (WCAG 2.1 AA)

## Philosophy
Build accessibly from the start — not as a retrofit. Every component Bolt generates should meet these rules by default. WCAG 2.1 AA is the target standard.

---

## Color & Contrast

### Text contrast ratios (minimum)
| Text type | Minimum ratio |
|-----------|--------------|
| Body text (16px+) | 4.5:1 |
| Large text (18px+ bold or 24px+ regular) | 3:1 |
| UI components and focus indicators | 3:1 |
| Disabled elements | No requirement — but indicate disabled state clearly |

### Rules
- Never use color as the only way to convey information
  - Timer urgency: color change + label text change (e.g. "Time running out!")
  - HMW card selection: border color change + checkmark icon
  - Error states: red color + error icon + text message
- Decorative elements (illustrations, backgrounds) are exempt from contrast requirements
- When you finalize your color palette, check all combinations at https://webaim.org/resources/contrastchecker/

---

## Typography & Readability

- Minimum body font size: 16px
- Line height: minimum 1.5 for body text
- Letter spacing: do not tighten below default
- Do not justify text — use left-aligned text only
- Never convey meaning through font style alone (italic, bold) without a text label
- Timer display: ensure the monospace font renders clearly at large sizes in both color states

---

## Keyboard Navigation

Every interactive element must be reachable and operable by keyboard alone.

### Tab order
- Tab order must follow visual reading order (top to bottom, left to right)
- Never use `tabindex` values above 0 — use natural DOM order instead
- Modal panels (AI suggestion, idea capture) must trap focus while open and restore it on close

### Keyboard interactions
| Element | Key | Action |
|---------|-----|--------|
| Buttons | Enter or Space | Activate |
| HMW selection cards | Enter or Space | Select / deselect |
| Timer preset cards | Enter or Space | Select |
| Pause/Resume timer | Enter or Space | Toggle |
| Modal / panel | Escape | Close |
| Export button | Enter | Download |

### Focus indicators
- Always visible — never `outline: none` without a custom replacement
- Focus ring: minimum 2px solid, using `--color-primary` or high-contrast equivalent
- Focus must be visible on all interactive elements including cards, buttons, and inputs

---

## Semantic HTML

- Use correct HTML elements — `<button>` for actions, `<a>` for navigation, `<input>` for fields
- Never use `<div>` or `<span>` as interactive elements without ARIA roles
- Use heading hierarchy correctly: one `<h1>` per page/phase, then `<h2>`, `<h3>` in order
- Form fields must have associated `<label>` elements — never use placeholder as a label substitute
- Group related fields with `<fieldset>` and `<legend>` (e.g. timer preset options)

---

## ARIA (Use Sparingly)

Only use ARIA when native HTML semantics are not sufficient.

### Required ARIA for IdeaFlow
```html
<!-- Timer — live region so screen readers announce updates -->
<div role="timer" aria-live="polite" aria-label="Round timer">
  01:30
</div>

<!-- HMW selection cards — treat as radio group -->
<div role="radiogroup" aria-labelledby="hmw-group-label">
  <div role="radio" aria-checked="false" tabindex="0">How might we...</div>
</div>

<!-- Loading state -->
<div aria-live="polite" aria-busy="true">
  Generating your How Might We questions...
</div>

<!-- AI suggestion panel -->
<div role="dialog" aria-modal="true" aria-labelledby="suggestion-title">
  <h2 id="suggestion-title">AI suggestion</h2>
  ...
</div>

<!-- Progress through rounds -->
<div aria-label="Round 3 of 8" role="status"></div>
```

### Rules
- `aria-live="polite"` for non-urgent updates (HMW generation complete, title generated)
- `aria-live="assertive"` only for urgent updates (timer critical warning)
- Always pair `aria-live` regions with visible text — never announce to screen readers only
- Do not use `aria-hidden` on elements that receive focus

---

## Images & Icons

- Decorative icons: `aria-hidden="true"` (e.g. decorative sparkle on AI button)
- Functional icons with no visible label: `aria-label` on the button (e.g. `<button aria-label="Export ideas as text">`)
- Functional icons with visible label: `aria-hidden="true"` on the icon (label is sufficient)
- No images in this app — if added later, always include `alt` text

---

## Forms & Inputs

- Every input must have a visible label above it — never rely on placeholder alone
- Error messages must be associated with their field using `aria-describedby`
- Required fields must be indicated visually and with `aria-required="true"`
- Validation: trigger on blur (leaving the field), not on every keystroke

```html
<!-- Example: pain points input -->
<label for="pain-points">Your pain points or research findings</label>
<textarea
  id="pain-points"
  aria-required="true"
  aria-describedby="pain-points-hint pain-points-error"
></textarea>
<span id="pain-points-hint">Minimum 20 characters</span>
<span id="pain-points-error" role="alert"></span>
```

---

## Motion & Animation

- Wrap all animations in `@media (prefers-reduced-motion: no-preference)` — off by default for users who prefer reduced motion
- Timer pulse animation: reduced motion users see only color change, no scaling
- Phase transitions: reduced motion users get an instant swap, no fade/slide

```css
@media (prefers-reduced-motion: no-preference) {
  .phase-transition { transition: opacity 300ms ease-out, transform 300ms ease-out; }
  .timer-pulse { animation: pulse 1s ease-in-out infinite; }
}
```

---

## Touch & Mobile

- Minimum touch target size: 44×44px for all interactive elements
- Buttons must have at least 8px spacing between them
- Do not rely on hover states for critical functionality — all hover affordances must also be available on tap/click

---

## Quick Checklist Before Shipping

- [ ] All text meets contrast ratios (check with browser DevTools or contrast checker)
- [ ] Tab through every screen — is the order logical? Is focus always visible?
- [ ] Test with keyboard only — can you complete a full session?
- [ ] Timer announces urgency to screen readers via `aria-live`
- [ ] All form fields have visible labels
- [ ] All icon-only buttons have `aria-label`
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Touch targets are at least 44×44px
