# Typography

The highest leverage, lowest cost differentiation available: and the first thing generated output
throws away. Two-thirds of what people read as "designed" is type.

**Contents**

- 1. The system before the faces
- 2. Choosing faces
- 3. Scale, weight, hierarchy
- 4. Tracking and leading
- 5. Measure and reading
- 6. Numerals and technical type
- 7. Delivery
- 8. Stress tests
- 9. Verify

---

## 1. The system before the faces

Before naming a single font, write down:

- **The roles the interface needs.** Display, heading, body, label, metadata, data/numeric, code.
  Most interfaces need four or five; almost none need eight.
- **The intended contrast between roles.** Can a reader tell a heading from a label from metadata at
  a glance, without reading the words?
- **The reading measure and density.**
- **Which existing faces and weights are authoritative** (on a redesign, or inside an existing world).
- **Constraints**: performance budget, localization, accessibility, platform text scaling.

Use the fewest roles and families that make the hierarchy unmistakable. Name tokens by purpose
(`--text-heading-lg`), never by value (`--text-32`).

**Two faces is the ceiling for almost everything.** A third family needs a job neither of the others
can do: usually tabular data or code. A display + text pair, or a single well-cut variable family
used across the full range, is what most good work actually ships.

---

## 2. Choosing faces

### By mode

- **Operate / Read**: system stacks and workhorse UI faces are *right*, not a cop-out. `system-ui`
  ships optical sizing, hinting, tracking tables and legibility tuning you cannot match, at zero
  bytes and zero layout shift. Override only with a reason you can state.
- **Persuade / Experience**: the surface wants a face with a point of view. This is where the
  decision budget should be spent first.

### The reflex list

*Snapshot: mid-2026.* These are the faces that appear when the model stopped looking. Every one is a
good typeface; that's why they're on the list. Naming one anyway requires a reason no other face
could satisfy: and **a subject association is never that reason.**

> Fraunces · Playfair Display · Cormorant · Lora · Crimson · Newsreader · Instrument Serif ·
> Syne · Space Grotesk · Space Mono · IBM Plex · DM Sans · DM Serif · Outfit · Plus Jakarta Sans ·
> Instrument Sans · Inter-as-display · Geist-as-display · General Sans · Satoshi

The associations this list exists to break: books wanting a serif, bookshops wanting hand-lettering,
tech wanting a mono, "creative" wanting Fraunces, "premium" wanting Playfair.

**Important honesty about this list.** It is a self-check, not a ban. Linear runs Inter and is
partly *responsible* for Inter becoming the SaaS default; it is also one of the best-typeset
products on the web. The principle is **choose**, not **avoid a named font**. If you can say "Inter,
because this product is a dense operational tool where the reader needs neutral, hyper-legible UI
type at 13px and Inter's tall x-height wins at that size": ship Inter. If the honest answer is "it
was there", pick again.

### Serif discipline

The reflex "creative brief → serif" is the most-tested tell in production. Serif is justified when
**one** of these is true:

- The brand brief names a serif, or
- The aesthetic family is genuinely editorial, publication, manuscript, heritage or literary, **and**
  you can articulate why *this specific serif* fits *this specific brand*.

"It feels premium / creative / editorial" is not a reason. For creative agencies, design studios,
modern brands, premium consumer goods, portfolios and lifestyle brands, a sans display face is the
correct default: for the same reason black is the default in fashion.

If a serif *is* justified, rotate: PP Editorial New, GT Sectra, Reckless Neue, Tiempos Headline,
Recoleta, EB Garamond, Canela, Domaine Display, Schnyder, Tobias, ITC Galliard, Saol Display. Don't
reuse the same serif across consecutive projects.

### Pairing

- Pair by **contrast of role**, not contrast of style. The display face should be doing something the
  text face can't; the text face should disappear.
- **Emphasis inside a headline uses italic or bold of the same family.** Injecting a random serif
  word into a sans headline (the "and *spatial* design" move) is amateur mixed-family emphasis.
- A mono is a third family. Give it a real job (code, data, tabular alignment, measurement) or drop
  it.

### Icons travel with type

One icon family per project, one standardized stroke weight (1.5 or 2.0), optically aligned to the
text baseline. Never hand-roll SVG paths to fill a gap: install a second library. Never mix two
icon families in one tree.

---

## 3. Scale, weight, hierarchy

**Hierarchy comes from weight + size + space + color as a set**: not from size alone. Size-only
hierarchy is why so many generated pages have a giant H1 and then five identical-looking things.

- Build a role scale, not a collection of arbitrary values. A ratio (1.2 for dense UI, 1.25–1.333 for
  marketing) keeps steps distinguishable.
- **Adjacent steps must be distinguishable.** 18px next to 17px is not a hierarchy; it's noise. If two
  roles are within ~10% of each other, one of them shouldn't exist.
- **Emphasize with weight before size.** Weight adds presence without consuming space: critical in
  dense UI.
- **Display type caps out.** Above roughly 6rem, headlines stop being read and start being looked at;
  that's a legitimate choice on an Experience surface and a mistake on a Persuade one where the
  sentence has to land.
- **Don't oversize the H1 to signal importance.** Hierarchy is relational. A 96px headline over 16px
  body isn't more hierarchical than 48px over 16px; it's just louder.
- Repeated roles stay identical across screens and states. A card title on one page and the same card
  title on another must be the same token.

Fluid type: `clamp()` is right for display type on marketing surfaces where headline length varies.
It's usually wrong for dense product UI, where predictable spatial behavior beats smooth scaling.

---

## 4. Tracking and leading

**Tracking is size-specific. A single `letter-spacing` value is wrong somewhere.**

- Large display text needs **negative** tracking: letters read too far apart as they scale up.
  -0.02em to -0.03em usually reads best. **-0.04em is the floor**; past that, characters collide and
  the word turns into a shape.
- Body text sits at or near `0`.
- Small text (captions, labels, 11–13px) wants slightly **positive** tracking for legibility.
- Uppercase always wants positive tracking. All-caps at 0 tracking is unreadable.

**Leading tracks size inversely.**

- Large headings: 1.0–1.15.
- Body: 1.5–1.7, wider as the measure widens.
- Dense UI and data: 1.3–1.45.
- Increase for scripts with tall ascenders/descenders (Devanagari, Thai, Vietnamese diacritics).

**Light text on dark surfaces needs compensation on three axes at once**: slightly more line height,
slightly more tracking, and often one step more weight. Light-on-dark optically bleeds and reads
thinner than the same pair inverted.

**Italic descender clearance.** An italic word containing `y g j p q` in display type will clip under
`leading-none` or `leading-[1]`. Use `leading-[1.1]` minimum plus `pb-1` reserve on the wrapper.
Audit every italic word in every display headline before shipping: this is a defect that only shows
up at final render.

**Balance headings.** `text-wrap: balance` on headings, `text-wrap: pretty` on body, prevents the
single-orphan-word line that makes an otherwise good headline look broken.

---

## 5. Measure and reading

- **Body measure: 45–75 characters.** 65–75ch for comfortable long-form, 45–60ch for short
  introductory copy set larger.
- **16px / 1rem is the body floor on web.** Not a preference: iOS Safari force-zooms a focused input
  whose font-size is under 16px, which breaks form layouts. 14px is acceptable for genuinely
  secondary text only.
- Tune line height *inversely* with measure: wider lines need more leading to keep the eye from
  losing its place on return.
- **Pick one paragraph rhythm**: space between paragraphs, *or* first-line indentation. Both together
  double-marks the boundary and looks unedited.
- Respect browser zoom, user font settings, and platform text scaling (Dynamic Type). Size spacing in
  `rem`/`em` so a larger font scales the layout with it instead of overflowing it.

---

## 6. Numerals and technical type

- **Tabular numerals for anything that changes in place**: counters, timers, tickers, live data,
  table columns, prices in a list. `font-variant-numeric: tabular-nums`. Proportional numerals make
  numbers jitter as they update, which reads as broken.
- **Proportional numerals for prose.** Tabular figures in a sentence look mechanical.
- Oldstyle figures belong in editorial body copy where they exist; lining figures in UI.
- Use `font-feature-settings` for the features the face actually ships: fractions, slashed zero
  (essential in code and IDs), case-sensitive forms next to all-caps.
- Currency, dates and numbers go through `Intl.NumberFormat` / `Intl.DateTimeFormat`, never through
  string concatenation. See `production.md`.

---

## 7. Delivery

- **Self-host or use the framework's font pipeline** (`next/font`, `@font-face` with `font-display:
  swap`). Never a bare `<link>` to a font CDN in production: extra connection, layout shift, and a
  third-party dependency on your critical render path.
- **Load only the weights and subsets you use.** Four weights of a variable face is usually one file;
  four weights of a static face is four requests.
- Provide a **metric-compatible fallback** so the swap doesn't reflow the page. Adjust with
  `size-adjust`, `ascent-override`, `descent-override` on the fallback `@font-face`.
- Preload the display face used above the fold; let body faces swap.
- Variable fonts: set `font-optical-sizing: auto` when the face supports it, that's the mechanism
  that makes size-specific tracking automatic.

---

## 8. Stress tests

Run these before shipping. Each one catches a defect that only appears at render.

| Test | What breaks |
|---|---|
| Longest real heading, not lorem | 4-line headlines, hero overflow |
| German or Finnish translation | +30–40% width; button and label overflow |
| One-word and 60-character names | Card layout collapse, truncation with no ellipsis |
| Browser zoom to 200% | Fixed-px layouts, clipped text |
| Font fails to load | Invisible text (FOIT), or a reflow that moves the CTA |
| Narrowest supported container | Measure collapse, orphan words |
| Italic display words with descenders | Clipping |
| CJK and RTL sample text | Line-height too tight, mirroring, font fallback |

---

## 9. Verify

- Primary, secondary, body and metadata roles are recognizable **without reading the copy**.
- No two roles are within 10% of each other in size and weight.
- Body measure is 45–75ch at every breakpoint.
- Tracking is negative on display, ~0 on body, positive on small caps and uppercase.
- Light-on-dark text has been compensated, not just inverted.
- Real copy: not placeholder, has been run at every breakpoint, and nothing overflows.
- Only used font assets load; no FOIT; no reflow that moves an interactive target.
- Zoom, text scaling and focus states all still work.
- The typography would be recognizable as *this* product's with all color removed.
