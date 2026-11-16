# Production

States, edge cases, accessibility, internationalization and performance. This is the section that
separates a screenshot from a product, and the one generated output skips most reliably: which is
why a missing empty state is a louder tell than any font choice.

**Contents**

- 1. The state matrix
- 2. Designing each state
- 3. Forms
- 4. Edge cases and extremes
- 5. Internationalization
- 6. Accessibility
- 7. Performance
- 8. Verify

---

## 1. The state matrix

Every view that renders data owes all of these. Walk the list explicitly; don't assume.

| State | Question it answers | Most common failure |
|---|---|---|
| **Default** | what does this look like with normal data? | the only state that exists |
| **Loading** | is something happening? | generic spinner where a skeleton belonged |
| **Empty (first use)** | I've never used this: what now? | "No items" with no next action |
| **Empty (zero results)** | my filter matched nothing | conflated with first-use empty |
| **Error** | what broke, and what do I do? | a toast that disappears before it's read |
| **Partial / degraded** | some of it loaded | all-or-nothing rendering |
| **Success** | did that work? | silent success |
| **Disabled** | why can't I do this? | disabled with no explanation |
| **No permission** | am I allowed? | a 403 rendered as an empty list |
| **Offline** | is it me or them? | infinite spinner |
| **Rate limited** | should I wait or retry? | generic error |
| **One item** | does the layout survive n=1? | a 3-col grid with one lonely card |
| **Many items (500+)** | does it stay usable? | no virtualization, no pagination |
| **Long content** | does a 60-char name break it? | overflow, or truncation with no title attribute |

The states that are conflated most often, and shouldn't be: **first-use empty vs. zero-results
empty** (completely different messages and actions), and **error vs. empty** (a failed fetch
rendering as "no data" tells the user something false).

---

## 2. Designing each state

**Loading.** Skeletons that match the final layout's shape, not generic circular spinners. A skeleton
that matches reduces perceived wait *and* prevents layout shift. Show determinate progress when you
actually have it; never invent progress. Loading copy names the real operation ("Importing 1,248
rows"), not "Loading…". If a wait is meaningful, set an honest expectation.

**Empty (first use).** This is an onboarding surface, not a blank slate. It should explain what will
appear here, why it's worth having, and give the single action that populates it. Compose it
properly: a beautifully composed empty state is one of the highest-ROI screens in a product,
because every user sees it exactly once, at the moment they decide whether to continue.

**Empty (zero results).** Name what was searched or filtered, and offer the way out: clear the filter,
broaden the query, or a suggested alternative. Never the same component as first-use empty.

**Error.** An actionable error answers three things in order: **what failed**, **why** (when known and
useful), and **how to recover or what alternative remains**. Plain language, never an error code as
the primary message. Placed near the source of the problem: inline for form fields, contextual for
sections, toast only for transient background failures. Never destroy user input. Never promise a
cause the system can't actually know.

Map API failures to distinct experiences, not one generic screen:

| Status | Experience |
|---|---|
| 400 | Inline validation errors on the specific fields |
| 401 | Re-auth, preserving where they were going |
| 403 | Permission explanation, and who to ask |
| 404 | Not-found state with a route back |
| 429 | Rate-limit message with a wait time if known |
| 5xx | Generic failure, retry action, support path |
| network / timeout | Distinguish "you're offline" from "we're down" |

**Success.** Confirm the outcome. Mention the next consequence only when it changes what the user
should do next. Routine saves should feel certain, not celebrated: a full celebration on the
hundredth save is friction.

**Disabled.** A disabled control must communicate *why*. A tooltip, helper text, or a nearby
explanation. Silently disabled controls are the most frustrating pattern in software.

---

## 3. Forms

- **Label above the input. Always.** Placeholder is never a label: it vanishes the moment the user
  types, taking the field's meaning with it, and it fails contrast almost universally.
- **Helper text present in markup even when optional**, positioned consistently. Format and
  eligibility requirements go *before* submission, not in an error afterwards.
- **Error text below the input**, tied to it with `aria-describedby`, announced to screen readers.
- **Validate on blur and on submit, not on every keystroke.** Character-by-character validation tells
  a user their email is invalid while they're still typing it.
- **Never wipe input on error.** The single most user-hostile default that still ships regularly.
- **Consistent required/optional treatment.** Mark whichever is rarer; marking both is noise.
- **Autocomplete attributes** (`autocomplete="email"`, `"street-address"`, `"one-time-code"`): free
  usability, and on mobile the difference between a 20-second and a 90-second form.
- **`inputmode`** for numeric and decimal fields so mobile keyboards are correct.
- **Destructive actions**: name the object and the consequence on both the message and the button.
  Never `Yes` / `No` / `OK`. Prefer undo over confirmation when recovery is safe: a confirmation
  dialog trains people to click through, so save it for genuinely irreversible actions.
- **Submit buttons show progress and disable during submission**, or the double-submit bug is
  guaranteed.

---

## 4. Edge cases and extremes

Test with, at minimum:

- Very long strings: 60-character names, 200-character titles, URLs with no spaces
- Very short: empty string, single character
- Special characters: emoji, RTL text, combining diacritics, `<script>` in a name field
- Large numbers: millions, billions, negative, zero
- Large collections: 1,000 list items, 50 select options, 30 table columns
- No data at all

Overflow handling: pick deliberately, per element:

```css
.truncate     { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;
                overflow: hidden; }
.wrap         { overflow-wrap: break-word; hyphens: auto; }
```

Truncated text needs the full value available: `title` attribute, tooltip, or a detail view.
Truncation that destroys information with no recovery is a bug, not a style.

**`min-width: 0` on flex and grid children containing text.** Without it they refuse to shrink below
their content and blow out the container. This is the single most common responsive defect in
existence.

Set a **minimum readable size** and honor zoom to 200%. Ensure containers expand with their text
rather than clipping it.

---

## 5. Internationalization

- **Budget 30–40% extra width** for translation. German and Finnish routinely exceed English by that
  much; a fixed-width button that fits "Submit" will not fit "Übermitteln".
- Never fix the width of a text container. `px-4 py-2`, not `w-24`.
- **Logical properties** so RTL works without a second stylesheet: `margin-inline-start`,
  `padding-inline`, `border-inline-end`, `inset-inline-start`. Mirror directional icons under
  `[dir="rtl"]`.
- **Never concatenate translatable strings.** Word order differs between languages; a sentence
  assembled from fragments is untranslatable. Pass variables into a complete message.
- **`Intl` for everything formatted**: dates, numbers, currency, relative time, list joins, plural
  rules. `${count} item${count !== 1 ? 's' : ''}` assumes English pluralization and breaks in
  languages with three or six plural forms.
- CJK needs different line-height and different line-breaking. Test with real CJK sample text, not
  Latin placeholder.
- UTF-8 everywhere; test emoji (multi-byte, and they break naive length checks).

---

## 6. Accessibility

Treat this as craft, not compliance. Most of it also makes the interface better for everyone.

**Keyboard**

- Every interactive element reachable and operable by keyboard alone.
- **Visible focus indicators**, ≥3:1 against their background, in *both* themes. Never
  `outline: none` without a replacement. `:focus-visible` for the modern behavior.
- Logical tab order matching visual order.
- Escape closes overlays. Focus traps in modals, focus returned to the trigger on close.
- Skip link to main content.

**Semantics**

- Real elements: `<button>` for actions, `<a href>` for navigation. A clickable `<div>` needs role,
  tabindex, and both key handlers: at which point you should have used a button.
- Heading structure that describes the document, not one chosen for its font size.
- Labels programmatically tied to inputs. Icon-only controls get accessible names.
- Landmarks: `<main>`, `<nav>`, `<header>`, `<footer>`.
- Live regions for async status changes so screen readers announce loading, success and errors.

**Perception**

- Contrast per `color.md`.
- Nothing communicated by color alone.
- Alt text carries the image's *information*; decorative images get `alt=""`.
- Touch targets ≥44×44pt with spacing between them.
- Works at 200% zoom and with user font-size overrides.
- Respects `prefers-reduced-motion`, `prefers-reduced-transparency`, `prefers-contrast`.

**Test it** with keyboard only, with a screen reader on the primary flow, and at 200% zoom.
Automated tools catch maybe 30% of real issues.

---

## 7. Performance

Targets:

- **LCP < 2.5s**: the hero image is preloaded or marked priority; the display font is preloaded.
- **INP < 200ms**: heavy work off the main thread; no synchronous layout thrash in event handlers.
- **CLS < 0.1**: reserve space for images (width/height or aspect-ratio), fonts (metric-compatible
  fallback), embeds, and ads.

Practices:

- Explicit dimensions or `aspect-ratio` on every image. Layout shift from unsized images is the
  single largest CLS contributor.
- Responsive sources (`srcset`, `sizes`) and modern formats. Lazy-load below the fold; never
  lazy-load the LCP image.
- Code-split by route; lazy-load heavy libraries behind interaction.
- Isolate expensive visual effects (see `motion.md` §10).
- Measure on a mid-range Android over throttled network, not on the dev machine.
- Run Lighthouse before declaring done: and read the diagnostics, not just the score.

---

## 8. Verify

- Every state in the matrix exists, and first-use empty differs from zero-results empty.
- Errors name the problem *and* the recovery, near the source, without destroying input.
- Forms: labels above, no placeholder-as-label, helper text present, autocomplete set,
  double-submit blocked.
- Long strings, one item, 500 items, and empty all render without breaking layout.
- German (or another long language) doesn't overflow any button or label.
- Keyboard-only completion of the primary flow, with visible focus throughout.
- Screen reader announces state changes.
- 200% zoom usable.
- LCP / INP / CLS measured, not assumed.
