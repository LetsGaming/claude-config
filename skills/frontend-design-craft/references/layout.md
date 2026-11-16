# Layout and composition

Layout turns product priority into reading order, grouping, rhythm and usable space. Diagnose the
structural problem before moving boxes.

**Contents**

- 1. The spatial thesis
- 2. Reading order and the squint test
- 3. Grouping before containers
- 4. Spacing and rhythm
- 5. Structure: choosing the topology
- 6. Hero discipline
- 7. Section composition and pacing
- 8. Density
- 9. Responsive behavior
- 10. Materials, depth and shape
- 11. Verify

---

## 1. The spatial thesis

Before editing anything, name:

- the primary reading or task path;
- what belongs together, and what must stay separate;
- which element leads and which supports;
- the intended density and spacing rhythm;
- how the structure changes across containers, viewports, input modes and content extremes.

Then pick the **simplest structural model** that expresses those relationships. Variation is not a
goal by itself: repetition supports recognition. Break it only when content or priority changes.

---

## 2. Reading order and the squint test

**The squint test is the fastest, highest-yield layout check that exists.** Blur the page (squint,
or apply a 6px blur in devtools). With detail gone, can you still identify:

1. the primary element,
2. the secondary element,
3. the major groups, in order?

If everything reads as equal grey mass, there is no hierarchy: regardless of how carefully the type
scale was built. The usual cause: hierarchy was expressed with size alone, and size differences
disappear under blur while weight, color and *space* survive.

Two corollaries:

- **DOM order must agree with visual order.** Keyboard, screen-reader and tab order follow the DOM.
  A layout that reorders visually with grid or flex `order` and doesn't reorder the source is
  incoherent for anyone not using a mouse.
- **One primary action per view.** Two equally-weighted primary buttons means neither is primary.

---

## 3. Grouping before containers

Proximity is the cheapest and strongest grouping signal. Reach for it first.

Escalation ladder, in order: stop at the first one that works:

1. **Proximity.** Tighten related items, open space between groups.
2. **Alignment.** A shared edge groups more strongly than most people expect.
3. **A divider.** One hairline, used sparingly.
4. **A shared background tint.**
5. **A card.** Only when elevation communicates real hierarchy: the group is genuinely a separate
   surface, is independently actionable, or floats above the content beneath it.

**Cards are the lazy container.** When every group is a card, the cards stop meaning anything, and
you've spent your one elevation signal on nothing. **Nested cards are always wrong**: elevation
declared twice means elevation means nothing.

The reliable diagnostic: if you removed the card borders and the groups were still obvious, the
cards were doing nothing.

---

## 4. Spacing and rhythm

- **Use a documented scale.** A 4px base gives the useful middle steps an 8-only scale misses
  (4, 8, 12, 16, 24, 32, 48, 64, 96, 128). One-off values are how a system dies.
- **More space above a heading than below it.** This single rule fixes more broken vertical rhythm
  than any other. A heading belongs to the content that follows it; equal spacing above and below
  makes it float between two sections.
- **Rhythm is contrast, not repetition.** Deliberate alternation between tight and generous intervals
  creates cadence. One spacing value repeated everywhere gives every element equal weight, which is
  the absence of a system.
- **`gap` for sibling rhythm** when it expresses the relationship more directly than child margins,
  it can't collapse, and it doesn't leak at the edges.
- **Optical corrections come last**, after inspecting the render. Mathematical alignment and optical
  alignment differ for round shapes, icons next to text, and anything with a visual overhang
  (quotation marks, bullets, italic terminals).

Section padding by mode, as a starting point, not a law:

| Mode | Vertical section rhythm |
|---|---|
| Persuade / Experience | `py-24` → `py-40` (dense passage earns a quiet one) |
| Read | `py-16` → `py-24`, with strong intra-section rhythm |
| Operate | `py-8` → `py-16`; the screen is a workspace, not a scroll |

---

## 5. Structure: choosing the topology

Does the topology match the content and task, or is it a framework default?

The question to ask of every repeated structure: **are these items genuinely equivalent?** A 3-column
grid says "these three things are peers of equal weight". If one of them is the main thing, the grid
is lying.

Common topologies and what they actually claim:

| Topology | Claims | Fails when |
|---|---|---|
| Equal grid | items are peers | one item matters more |
| Asymmetric grid / bento | items have different weight | the weights are arbitrary |
| Alternating split | each item deserves a full-width moment | used more than twice consecutively |
| Vertical stack | linear reading | items are actually parallel choices |
| Table | items are comparable across the same attributes | attributes differ per row |
| Horizontal scroll | breadth matters more than depth | the user needs to compare |
| Sticky sidebar + scroll | one persistent context, changing content | the sidebar is just nav |

**Bento grids need exact cell counts.** N items → N cells. A hole in the middle or a blank tile at the
end means the grid shape was chosen before the content. Reshape the grid; never paste an empty tile.
And a bento of six identical white text cards is a list with extra borders: at least two or three
cells need real visual variation (an image, a texture, a tinted ground, a live element).

**Grid over flexbox math.** `grid-cols-3 gap-6` instead of `w-[calc(33.333%-1rem)]`. Percentage math
in flex breaks on every content change and is unreadable six months later.

---

## 6. Hero discipline

Applies to Persuade and Experience surfaces. Operate surfaces don't have heroes; they have a first
task.

- **The hero fits the initial viewport.** Headline ≤2 lines at desktop, subtext ≤20 words and ≤4
  lines, primary action visible without scrolling. If the value proposition needs more than 20 words
  of subtext, the value proposition isn't clear yet: that's the finding, not "the rule is too tight".
- **Plan type scale and asset scale together.** If the hero carries a large visual and the headline
  runs more than six words, don't start at `text-7xl`. Sensible default range: `text-4xl md:text-5xl
  lg:text-6xl`; reserve `text-6xl md:text-7xl` for 3–5 word headlines. **A four-line hero headline is
  always a font-size error, never a copy-length error.**
- **Use wide containers for display type.** `max-w-5xl` / `max-w-6xl` on the H1. Narrow containers
  are the mechanical cause of the six-line headline.
- **Top padding caps around `pt-24`** at desktop. More and the content floats halfway down the
  viewport, which reads as a bug. Need air? Scale the type or the asset, not the padding.
- **Max four text elements**: (eyebrow *or* brand strip *or* neither) · headline · subtext · CTAs
  (one primary, at most one secondary). Trust strips, pricing teasers, feature bullets and micro-
  taglines under the CTAs all move to their own sections below.
- **The logo wall lives under the hero, never inside it.**
- **The hero needs a real visual** on a Persuade surface. Text plus a gradient blob is a placeholder.
  See `content.md`.
- **The first viewport is a thesis, not a header.** If someone left after one viewport, what would
  they describe an hour later? If the honest answer is "a mood", the concept hasn't committed.

---

## 7. Section composition and pacing

- **A layout family appears at most once per page.** Eight sections need at least four different
  families. "Selected commissions" must not look like "What we do".
- **Zigzag caps at two.** The third consecutive image+text split is wallpaper. Break with a
  full-width section, a vertical stack, a bento, or a different family entirely.
- **Pace the scroll like a studio.** Vary density, scale, imagery, motion and quiet inside one
  grammar. A dense passage earns a quiet one. The page ends anchored by a real close, not by
  trailing off.
- **Content shape per section, as a default**: headline ≤8 words + sub-paragraph ≤25 words + one
  visual asset *or* one CTA. Anything more must be justified by that section's job.
- **No data-dump sections.** A 20-row publication list, a 30-item award list, a full pricing matrix
  on a marketing page is the wrong layout, not a long one. → Top 3–5 plus a link to the full list, a
  marquee or carousel for breadth, or a separate page if the data *is* the product.
- **Section headers get one focused message.** The "big left headline + small floating right
  paragraph" split is a default, not a composition; stack them vertically at ≤65ch instead. Reach for
  a two-column header only when the right column carries a real visual or interactive element.

---

## 8. Density

Density should match use frequency, decision complexity and mode: not aesthetic preference.

| Band | Character | Fits |
|---|---|---|
| Airy | huge section gaps, one idea per screen | Experience, luxury, editorial feature |
| Standard | normal web app spacing | Persuade, Read |
| Dense | tight padding, hairlines instead of card boxes, tabular numerals mandatory | Operate: dashboards, tables, monitoring |

Two rules:

- **At high density, generic card containers are banned.** Data metrics breathe in plain layout
  separated by 1px lines. Cards at high density waste 30% of the screen on chrome.
- **Density is a promise about frequency.** A screen someone uses forty times a day should be dense;
  a screen someone uses twice should not. Getting this backwards is the most common dashboard defect.

---

## 9. Responsive behavior

**Responsive is structural, not cosmetic.** Declare, per multi-column layout, what happens below
768px: what reorders, what collapses, what wraps, what scrolls, what stays fixed. "Tailwind handles
it" is not a plan.

Hard rules:

- **`min-h-[100dvh]`, never `h-screen`** for full-height sections. `vh` doesn't account for the iOS
  Safari address bar, so the layout jumps when it collapses.
- **Asymmetric compositions collapse to a strict single column** below 768px. Rotations, overlaps and
  negative margins become touch-target conflicts on a phone.
- **Touch targets ≥44×44pt**, even when the visible mark is smaller. Space them so a thumb can't hit
  two.
- **Primary actions in the thumb zone** on mobile: bottom half of the screen. An important action
  pinned to the top-right of a mobile view is unreachable one-handed.
- **`min-width: 0` on flex and grid children** that contain text. Without it, they refuse to shrink
  below their content and overflow the container. This is the single most common responsive bug.
- Container queries beat viewport queries for components that appear in more than one context.
- Standardize breakpoints and don't invent one-off ones: 640 / 768 / 1024 / 1280 / 1536.
- Contain page layouts: `max-w-7xl mx-auto` or a defined measure. An unbounded layout on a 32" monitor
  is not "responsive", it's unfinished.
- Respect safe-area insets (`env(safe-area-inset-*)`) for anything pinned to a screen edge.

**Test at the intermediate widths, not just the extremes.** 900px is where most layouts break,
because nobody looks at it.

---

## 10. Materials, depth and shape

- **Declare elevation once**: border **or** shadow, not both. A 1px border under a wide soft shadow is
  the ghost card.
- **Shadows carry offset and blur.** A zero-offset colored halo is a glow, which is decoration, not
  elevation. Tint the shadow toward the background hue; pure black shadows on light grounds look
  dirty.
- **Bigger surfaces read as thicker.** A large panel wants stronger blur and a deeper shadow than a
  small chip. Consider context: heavier shadow over busy content for separation, lighter over a plain
  ground.
- **Pick one radius system and hold it.** All-sharp (0), all-soft (12–16px), or a documented rule
  ("buttons pill, cards 16px, inputs 8px") applied everywhere. Round buttons in a square layout is a
  broken system. Cards stay at 12–16px; pills are for small controls.
- **Nested radii must be concentric.** Inner radius = outer radius − padding. `rounded-[2rem]`
  wrapper with `p-2` needs `rounded-[calc(2rem-0.5rem)]` inside, or the corners look wrong in a way
  nobody can name.
- **Translucency conveys hierarchy, when it's used once.** Chrome (nav, toolbar, sheet) floating over
  content that scrolls underneath is what `backdrop-filter` is *for*. Never stack a light translucent
  surface on another: legibility collapses. Always ship a solid fallback under
  `prefers-reduced-transparency`.
- **Scroll edge effects beat hard dividers.** Instead of a 1px border under a sticky header, fade a
  small gradient mask where content meets floating chrome: and only where they actually overlap.
- **Dim to focus, separate to keep flow.** A blocking modal task pairs the surface with a scrim and
  pushes the background back. A parallel, non-blocking panel uses translucency and offset *without* a
  scrim, so the flow isn't broken.

---

## 11. Verify

- The squint test reveals primary, secondary and major groups in order.
- Keyboard, touch and assistive-technology order agree with visual order.
- Related content groups by proximity; containers appear only where elevation means something.
- Tight and generous spacing create intentional rhythm; no single repeated value.
- More space above every heading than below it.
- Density matches use frequency and mode.
- No layout family repeats; no more than two consecutive zigzags.
- Long text, empty states, localization, zoom and dynamic content do not break the structure.
- Every multi-column layout has a declared mobile collapse, verified on a real phone.
- One radius system, concentric nesting, elevation declared once.
