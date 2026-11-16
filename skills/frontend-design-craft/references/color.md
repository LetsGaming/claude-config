# Color

The question is **how much**, before **which**. Most generated palettes fail on dosage, not on hue.

**Contents**

- 1. Strategy first
- 2. Roles, not swatches
- 3. Choosing hue
- 4. The saturated defaults
- 5. Building ramps
- 6. Contrast and perception
- 7. Dark mode
- 8. Locks
- 9. Verify

---

## 1. Strategy first

Pick the strategy before picking a single color.

| Strategy | Definition | Where it belongs |
|---|---|---|
| **Restrained** | Neutrals plus one accent, accent used sparingly | Operate, Read. The default when the visitor came to work or to read. |
| **Committed** | One saturated color carries 30–60% of the surface | Persuade. A brand that owns a color. |
| **Full palette** | 3–4 named roles, each with a job | Persuade, complex Operate (status-heavy systems) |
| **Drenched** | The surface *is* the color | Experience, campaign, editorial feature |

**Color commits at page scale.** Fields that own whole regions read as a decision; accents scattered
over a neutral ground read as decoration. Two saturated buttons on a grey page is not a color
strategy.

**Rarity gives an accent its force.** In Restrained mode the accent's job is to mark the one thing
that matters: the primary action, the current selection, the error. Spend it on decoration and it
stops working as a signal, permanently.

---

## 2. Roles, not swatches

Define semantic roles, then map primitives into them. Naming forces every color to earn its place,
and it's what makes theming possible at all.

Minimum viable role set:

```
--surface-canvas          the page ground
--surface-raised          cards, panels, popovers
--surface-sunken          wells, insets, code blocks
--text-primary
--text-secondary
--text-disabled
--border-subtle           dividers, hairlines
--border-strong           inputs, focused containers
--action-primary          + hover / active / disabled
--action-secondary
--focus-ring
--state-success / warning / danger / info   (each with a surface + text + border variant)
--data-1 … --data-n       categorical series, when the product has charts
```

Rules:

- Semantic name, never a value name. `--action-primary`, not `--color-blue-600`, and definitely not
  `--gradient-start`.
- Theme changes remap **semantic roles**, not primitives.
- If a color has no role, it doesn't ship.
- Every state role needs three variants (surface / text / border). A danger color that only exists as
  text produces unreadable error banners.

---

## 3. Choosing hue

Derive hue from **product meaning and the chosen world**, never from a category association. "Fintech
is blue", "health is green", "AI is purple" are the associations to break, not follow.

Useful derivations:

- The physical object or environment the product lives in.
- The materials of the audience's world (see `direction.md` §4).
- The one color the brand already owns, if it owns one.
- Deliberate contrast against the category: genuinely effective, but only once, and only if the rest
  of the page can carry it.

**Neutrals are a decision too.** Pick warm, cool, or true grey and hold it for the whole project.
Fluctuating between warm and cool greys within one product is one of the most common invisible
defects: it reads as "slightly dirty" without anyone being able to say why.

Tinting neutrals with the brand hue (2–6% chroma) creates cohesion cheaply. Pure grey is also valid.
What isn't valid is doing both in the same product.

---

## 4. The saturated defaults

*Snapshot: mid-2026.* These are the palettes generated output lands on regardless of subject. All are
legitimate when the brief asks for them. Where the brief leaves color free, landing on one means the
self-check failed.

**Premium-consumer warm craft**: the single most repeated palette in generated work. Cookware,
wellness, artisan, luxury, heritage, DTC home goods all come out identical:

- Grounds: `#f5f1ea` `#f7f5f1` `#fbf8f1` `#efeae0` `#ece6db` `#faf7f1` (cream / bone / chalk)
- Accents: `#b08947` `#b6553a` `#9a2436` `#9c6e2a` `#bc7c3a` (brass / clay / oxblood / ochre)
- Text: `#1a1714` `#1a1814` `#1b1814` (espresso near-black)

**Aurora SaaS**: purple `#7c3aed`→blue `#2563eb` gradient, ambient blur, glass on near-white.

**Neon dark**: `#0a0a0a` ground, one saturated accent at full chroma, glowing edges.

**Bento monochrome**: grey-on-grey tiles, one pastel accent.

Alternatives to rotate through when the brief is free: not a menu to pick the top item from, a
prompt to derive further:

- Cold luxury: silver-grey, chrome, smoke
- Forest: deep green, bone, amber accent
- Black and tan: true off-black against warm tan, hard contrast, no beige
- Cobalt and cream: one saturated blue against a single neutral
- Terracotta and slate: warm rust against cool grey
- Olive, brick, paper
- Monochrome plus one saturated pop: off-white, off-black, one bright accent

**Rotation rule:** if your last project in this category used a palette family, this one uses a
different one.

**Two absolutes that survive every fashion cycle:** no pure `#000000`, no pure `#ffffff` as the main
ground and text pair. Pure values kill depth, produce halation on OLED, and are harsh at high
brightness. Off-black (`#0a0a0b`–`#18181b`) and off-white (`#fafafa`–`#f8f8f7`) instead.

---

## 5. Building ramps

Use **OKLCH** for new palettes. Lightness and chroma are perceptually independent there, which means
a ramp built by varying `L` actually *looks* evenly stepped: unlike HSL, where a 10% lightness step
means something different at every hue.

```css
--accent-500: oklch(0.62 0.19 258);
--accent-600: oklch(0.54 0.18 258);   /* L down, C slightly down */
--accent-100: oklch(0.94 0.04 258);   /* near-white: chroma must drop hard */
```

- **Reduce chroma near both extremes.** High chroma at L > 0.9 or L < 0.2 produces colors that are
  out of gamut, muddy, or neon depending on the display. Keeping chroma uniform "because the math is
  cleaner" is the classic ramp mistake.
- Hold hue roughly constant along a ramp, or shift it deliberately (warm shadows, cool highlights),
  but decide which.
- **Prefer explicit colors to stacked translucent overlays.** Alpha makes contrast
  context-dependent, so a token that passes on one surface silently fails on another.
- Test ramps against both themes before committing.

---

## 6. Contrast and perception

Minimums, verified on computed values: not eyeballed, not assumed:

| Content | WCAG AA |
|---|---|
| Body text, placeholder text | 4.5:1 |
| Large text (≥18.66px bold, ≥24px regular) | 3:1 |
| Interactive controls, icons, focus indicators, chart elements | 3:1 |

Where this actually breaks, in order of frequency:

1. **Placeholder text.** Almost always fails. It's still text.
2. **Button label against button fill.** White text on a light accent, or a ghost button with no
   border over a photograph. Check every CTA.
3. **Secondary text on a colored surface.** Grey text on a colored ground is the specific failure:
   grey has no relationship to the surface hue, so it reads as dirt. → Derive secondary text from the
   surface hue (same hue, lower chroma, adjusted lightness) or from the foreground with alpha.
4. **Disabled states.** Legitimately lower contrast, but they still need to be readable enough to
   tell *what* is disabled.
5. **Text over images.** Needs a scrim, a gradient, or a solid plate. "It looked fine on the sample
   image" is not a check.
6. **Focus rings** on colored or dark surfaces.

**Never encode information in color alone.** Every color-coded state needs a second channel: text,
icon, shape, position, or pattern. This is not only an accessibility rule: it's what makes a
dashboard readable in a screenshot, in print, and on a bad projector.

Simulate protanopia, deuteranopia and tritanopia on any chart or status system. Red/green status
pairs are the most common failure in the world.

---

## 7. Dark mode

**Design both modes from the start**, or explicitly ship one and say why. Retrofitting dark mode onto
a light-only design produces the washed-out, low-contrast result everyone recognizes.

- **Do not mechanically invert.** Dark mode has its own elevation logic: in light mode, elevation
  comes from shadow; in dark mode, shadow is nearly invisible, so **elevation comes from surface
  lightness**: raised surfaces get *lighter*, not darker.
- Reduce chroma of saturated accents in dark mode. A color that reads correct on white glares on
  near-black.
- Preserve **hierarchy parity**: if the CTA pops in light, it pops in dark. If a section recedes in
  light, it recedes in dark.
- Preserve **brand fidelity**: the primary brand color stays recognizable. Desaturating the brand
  into a grey-blue is a very common silent loss.
- Compensate type: light-on-dark needs slightly more leading, slightly more tracking, sometimes one
  step more weight (see `typography.md` §4).
- Images and logos need dark variants or a treatment. A white-background PNG in dark mode is the
  loudest possible "nobody checked".
- Default to `prefers-color-scheme` unless the brand insists. Add a manual toggle if either mode
  would lose key brand expression.
- **Test in both modes during development.** Not at the end. Half of dark-mode defects are invisible
  until you switch while looking at the actual page.

Pick one token strategy and hold it: Tailwind `dark:` variants everywhere, **or** CSS custom
properties swapped at the root. Mixing both produces components that theme correctly in isolation and
incorrectly in composition.

---

## 8. Locks

Three consistency locks. Each one catches a defect that's invisible while building a single component
and obvious when scrolling the whole page.

- **Accent lock.** One accent, used identically across every section. A warm-grey page does not get a
  blue CTA in section 7. A rose-accented page does not get a teal badge in the footer.
- **Theme lock.** One theme per page. No warm-paper section between two dark sections. Section-level
  tint within the same family (`zinc-950` next to `zinc-900`) is fine; inversion is not. The single
  exception is an explicit, deliberate color-block device used *once*, with a real transition.
- **Neutral lock.** One neutral temperature per project.

Audit all three by scrolling the finished page at 25% zoom.

---

## 9. Verify

- Every color maps to a named role, or has a stated atmospheric purpose in the chosen world.
- Attention lands on the intended action or state: check by squinting, not by reading.
- Computed contrast passes for body, large text, controls, focus, placeholders, disabled, and text
  over images, in **both** themes and in hover/active/focus states.
- No information is conveyed by color alone.
- Both themes are composed, not inverted.
- The three locks hold across the whole page.
- The palette is recognizably *this* product's, not "a colorful treatment".
