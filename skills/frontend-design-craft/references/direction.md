# Direction

How to get from a brief to a visual world that isn't the category default. Read this **before**
generating. Everything here happens in prose and decisions; no CSS yet.

**Contents**

- 1. Read the room
- 2. Ask the round that changes the work
- 3. Choose the amount of invention
- 4. Derive candidates without collapsing to the default
- 5. Calibration: the looks generated output lands on
- 6. Commit the world
- 7. The direction contract
- 8. Redesign protocol
- 9. Dials (optional, when you need a shared vocabulary)

---

## 1. Read the room

Before anything else, infer what the user actually wants. Most bad generated design is bad because
the model jumped to a default aesthetic instead of reading the brief.

Signals, in order of weight:

1. **Surface and mode.** See the mode table in `SKILL.md`. Persuade / Operate / Read / Experience.
2. **Reference signals.** URLs they linked, screenshots they pasted, products they named, brands
   they compete with. A named reference outranks your taste, always.
3. **Vibe words they used.** "minimalist", "calm", "Linear-style", "Awwwards", "brutalist", "premium
   consumer", "Apple-y", "playful", "serious B2B", "editorial", "agency-y", "dark tech". These are
   constraints, not suggestions.
4. **Audience.** A B2B procurement panel, a design-conscious consumer, a recruiter scanning a
   portfolio in eleven seconds, a night-shift operator reading a dashboard. The audience picks the
   aesthetic, not you.
5. **Existing brand assets.** Logo, color, type, photography. On a redesign these are starting
   material, not optional input.
6. **Quiet constraints that override everything.** Accessibility-critical audiences, public sector,
   regulated industries, trust-first commerce, kids' products, medical, financial. These beat
   aesthetic preference every time.
7. **The use scene.** Who, where, on what device, under what ambient light, how often. This is what
   decides light vs. dark: not category habit. A field tool used outdoors in sun is not dark mode
   because "developer tools are dark".

**The brief wins.** If the user pinned an aesthetic, era, material, font, or palette, honor it even
when it collides with a warning in this skill. Redirecting a clear brief toward your own taste is
failure, not craft. A pinned world pins the *world*, not its softest rendition: the pinned world's
full material range stays in play.

**State the read in one line before generating.** Format:

> Reading this as: *\<surface\> in \<mode\> for \<audience\>, with a \<vibe\> language, leaning
> toward \<system or aesthetic family\>.*

Examples:

- *B2B SaaS landing (Persuade) for technical buyers, restrained language, leaning toward a
  system-font stack with one signature structural device and near-zero motion.*
- *Solo designer portfolio (Experience) for hiring managers, editorial/kinetic language, leaning
  toward native CSS with scroll-driven type.*
- *Internal ops dashboard (Operate) for warehouse supervisors on shared tablets, high-density
  language, leaning toward an existing component library with tightened spacing and tabular numerals.*

If the read genuinely diverges, ask **one** question. If you can infer it, don't ask: declare the
read and proceed.

---

## 2. Ask the round that changes the work

One round, two or three related questions, then build. Not a questionnaire. Skip anything already
settled.

By mode:

- **Persuade**: who must act, what they must believe, and what real proof, content or asset can
  earn that belief.
- **Operate**: the task, the information needed to do it, the important states, the frequency, the
  constraints.
- **Read**: the reader's actual question, the source material, the structure, the wayfinding.
- **Experience**: what leads, how exploration unfolds, which single interaction or transition
  matters.

Across all modes, three questions are almost always worth asking:

- What does success look like?
- What must stay untouched?
- What would make a polished result feel *wrong*?

**Don't ask for CSS values or aesthetic lanes** ("do you want rounded or sharp corners?", "warm or
cool?"). That outsources the decision you were hired to make. Ask about the product and the people.

---

## 3. Choose the amount of invention

Match the invention to the scope. This is where most work goes wrong in one of two directions:
treating a button variant as an identity exercise, or treating a whole new product surface as a
styling task.

| Scope | What to do |
|---|---|
| A component, state, or section inside an existing surface | Inherit the surface's world completely. Resolve only the new purpose, hierarchy, states, and how it joins its neighbors. Do not open the identity question. |
| A whole new surface inside an established world | Keep the visual system fixed. Derive 5–7 materially different **structures** from the content and task; pick by fit, not novelty. |
| A new or replacement visual world | Run the full derivation in §4. |

A missing `DESIGN.md` (or equivalent) does **not** make a project greenfield. If coherent identity
already exists in the code, inherit and document it rather than inventing a replacement. Visual
authority is evidence, not a filename.

---

## 4. Derive candidates without collapsing to the default

This is the core technique, and it's the thing that separates a designed page from a generated one.

**The failure it prevents:** asked to design anything, a model produces its single highest-probability
answer. That answer is the category default. Ask again and you get the same answer, because the
ranking is deterministic. "Be creative" doesn't change the ranking; it just adds decoration to the
same answer.

### The procedure

1. **Name the rut, and its predictable opposite.** Write down the page this category always ships
   ("dark hero, gradient headline, three feature cards") *and* the obvious rebellion against it
   ("brutalist monospace, black and white, oversized type"). Both are now excluded. The rebellion is
   as predictable as the default: it's the same list read backwards.

2. **Name the subject's literal reading, and cap it at one candidate.** A brief that paints its own
   picture, a product name, a governing metaphor: books wanting a serif, a bookshop wanting hand
   lettering, a dev tool wanting monospace: is the default wearing the subject's clothes. Spend at
   most one candidate on it.

3. **List seven concrete visual systems from the audience's world.** Not moods. Artifacts, places,
   rituals, notation, publications, identity programs, data-graphic traditions, interfaces they read
   daily. Each with one line on why it resonates and how it can carry the product's mechanism.
   - Ask: *what would this thing look like as a physical object? What did its world look like before
     the web?*
   - A nameable abstract system (a school of poster design, a documentation standard, a data-graphics
     tradition, an operating system's UI grammar) counts as concrete.
   - Near-duplicates count once. **If more than three of the seven share one material family, you
     stopped at the subject's most obvious artifact.** Dig until the list spans at least three
     families.

4. **Turn the strongest material into complete directions.** Each direction joins a *reusable visual
   world* to a *concrete first-surface experience*. "Warm and editorial" is not a direction. "Swiss
   railway timetable: monospace numerals, hairline rules, one signal color, information density as
   the aesthetic, hero is a live departures board of the user's actual data" is a direction.

5. **Don't build candidate #1 by reflex.** Your ranking is the same ranking every run produces. Two
   legitimate ways out:
   - **Present 2–3 directions to the user and let them pick.** Best option when the user is
     available. One line of case per direction, plus the honest risk.
   - **Pick by a stated criterion, not by preference.** Score the shortlist on exactly two axes,
     *audience identification* (would this audience recognize this world as theirs?) and *product
     clarity* (does it make the mechanism more legible, or does it fight it?). Write the score down.
     Losing to a strong grounded alternative is a valid outcome; that's the point.

6. **Always keep the standing exit open.** Offer, quietly, the category standard played straight, at
   full craft. It is the *user's* door, never yours: never recommend it, never weigh it against the
   derived directions. When the user takes it, convention becomes the commitment: ask which two or
   three products this should sit alongside, make their craft level the bar, and execute the
   convention at full fidelity, with no irony and no smuggled quirk.

### Viability gate

Every candidate must already be viable before it enters the shortlist:

- Every relationship and claim it visualizes is true.
- It has a real palette and a real component family, not a mood.
- It works at full-surface scale within the available assets, tools, and performance budget.
- It has one product-specific experience a competitor couldn't copy-paste.

A candidate that fails on truth gets replaced, not rescued.

**Truth binds claims, not demonstrations.** In greenfield work, author whatever illustrative content
the concept needs at full fidelity, label it synthetic wherever a visitor could mistake it for real,
and hand the user the replacement list. What stays uninventable: prices, customer names, benchmarks,
capabilities the product does not have, certifications, endpoints. Refusing a strong direction
because its demo data doesn't exist yet is timidity wearing honesty's clothes.

---

## 5. Calibration: the looks generated output lands on

*Snapshot: mid-2026. These rotate. Re-check the specifics; the mechanism doesn't change.*

Regardless of subject, AI-generated interfaces cluster into a handful of looks. All are legitimate
when the brief calls for them. Where the brief leaves the aesthetic free, **landing on one of these
means the self-check failed**.

1. **Warm paper.** Cream/bone ground, high-contrast serif display, terracotta or signal-red accent,
   espresso near-black text. The single most common output.
2. **Neon dark.** Near-black ground, one neon accent, glowing edges, subtle grid background.
3. **Broadsheet editorial.** Hairline rules, italic display serif, small tracked mono labels,
   asymmetric column grid.
4. **Aurora SaaS.** Purple→blue gradient, ambient blur, glass cards, Inter-family sans.
5. **Bento monochrome.** Grey-on-grey tiles of uniform radius, thin icons, one pastel accent.

The self-check: **if someone could guess your aesthetic from the category alone, or from
category-plus-avoidance, rework until neither answer is obvious.**

Two traps worth naming:

- **The subject doesn't license the default.** A bookish, warm, or child-facing subject does not
  force cream and serif. Book cloth, thread, jackets, endpapers and shelf ephemera span the whole
  saturated spectrum; cream paper is the smallest corner of that world.
- **Negative constraints rule out devices, not energy.** "No gamification", "no hype" rules out those
  devices. It does not mean the surface must be quiet. Adjectives describing the *product's behavior*
  ("calm coaching", "quiet support") do not dictate the *surface's* energy.

---

## 6. Commit the world

Before any code, decide these four, in this order.

**Color strategy: how much, before which.**

| Strategy | Definition | Default for |
|---|---|---|
| Restrained | Neutrals plus one accent | Operate, Read |
| Committed | One saturated color carries 30–60% of the surface | Persuade |
| Full palette | 3–4 named roles, each with a job | Persuade, complex Operate |
| Drenched | The surface *is* the color | Experience, campaign |

Color commits at page scale: fields that own whole regions beat accents scattered over a neutral
ground. Details in `references/color.md`.

**Light or dark: from the scene, never the category.** Write one sentence of physical scene (who
uses this, where, under what light) and let it force the answer.

**Type: faces as objects from the subject's world, in the mode's register.** Operate and Read are
well served by system stacks and workhorse UI faces. Persuade and Experience want a face with a
point of view. Details and the reflex-face list: `references/typography.md`.

**Structure: the composition the content needs.** Not the eight-section skeleton. Details:
`references/layout.md`.

---

## 7. The direction contract

Write it into the artifact before any code. Five blocks, ≤150 words, in the emitted markup so it
survives the build.

```html
<!--
THESIS: Departures-board legibility for a logistics dashboard. Refuses the card-grid KPI page.
WORLD:  Near-black ground, amber signal, one grotesque, tabular numerals everywhere, hairline
        rules instead of card borders, zero radius above 4px.
STORY:  Dispatcher sees which loads are late, why, and what to do, in under three seconds.
FIRST VIEWPORT: Full-width live board, 9 rows, status column left-aligned at 2rem; the single
        primary action ("Reassign") sits inline on the focused row, not in a toolbar.
RISK:   Density punishes occasional users. Mitigated by a persistent legend; if the audience turns
        out to be mostly occasional, this direction is wrong and we drop to a summary-first layout.
-->
```

If a block reads like a mood ("clean and modern", "premium feel"), the direction is not decided yet.
Rewrite it until each block names something you could be wrong about.

---

## 8. Redesign protocol

Misclassifying the mode is the single biggest source of bad redesign output.

### Detect the mode first

- **Greenfield**: no existing site, or a full overhaul approved.
- **Refine**: modernize without breaking the brand. Preserve identity, behavior, copy, and
  everything outside scope.
- **Replace**: new visual language on top of existing content. Preserve product truth, content,
  function, native affordances and constraints; treat the old look as *evidence of what the subject
  is*, and as an anti-reference for what it becomes.

Never split the difference into polish applied to a look that's already been discarded. If ambiguous,
ask once: *"Should this preserve the existing brand, or are we starting visually from scratch?"*

### Audit before touching anything

- Brand tokens: primary/accent colors, type stack, logo treatment, radii, spacing scale.
- Information architecture: page tree, primary nav, key conversion or task paths.
- Content blocks: what exists, what's doing work, what's filler.
- Patterns to preserve: signature interactions, recognizable hero, copy voice.
- Patterns to retire: the tells, broken layouts, dead links, generic stock, perf traps.
- SEO baseline: ranking pages, meta titles, structured data, OG cards. **SEO migration is the #1
  redesign risk** and it's invisible until traffic drops.

### Modernization levers, in priority order

Apply in order; stop when the brief is satisfied.

1. Typography refresh: biggest visual lift per unit of risk.
2. Spacing and rhythm: section padding, vertical rhythm, group proximity.
3. Color recalibration: desaturate, unify neutrals, keep the brand accent.
4. Motion layer: mode-appropriate feedback on existing components.
5. Hero and key-section recomposition.
6. Full block replacement: only when the block is unsalvageable.

**IA, content and SEO all sound** → targeted evolution (levers 1–4): roughly 70% of the value at
40% of the risk. **Structural visual debt** (broken IA, no system, broken mobile) → full redesign
with strict content preservation. **The brand itself is changing** → greenfield.

### What never changes silently

Require explicit approval before touching:

- URL structure and route slugs
- Primary nav labels
- Form field names or order (breaks analytics and browser autofill)
- Brand logo or wordmark
- Legal, consent, or cookie copy
- Analytics event names and section IDs downstream tracking depends on
- Existing accessibility wins: focus states, alt text, keyboard nav, contrast

---

## 9. Dials (optional)

Useful when you need a shared vocabulary with the user, or to make an implicit choice explicit.
Three axes, 1–10. Declare the values and the reason; don't silently use a baseline.

- **VARIANCE**: 1 perfect symmetry → 10 asymmetric/chaotic.
- **MOTION**: 1 static → 10 cinematic/physics-driven.
- **DENSITY**: 1 art gallery → 10 cockpit.

| Signal | VARIANCE | MOTION | DENSITY |
|---|---|---|---|
| minimalist / calm / editorial / Linear-style | 5–6 | 3–4 | 2–3 |
| premium consumer / Apple-adjacent / luxury | 7–8 | 5–7 | 3–4 |
| agency / experimental / Awwwards | 9–10 | 8–10 | 3–4 |
| landing page, portfolio (unmodified default) | 7–9 | 6–8 | 3–5 |
| trust-first / public sector / regulated / a11y-critical | 3–4 | 2–3 | 4–5 |
| dashboard, admin, ops tool | 3–5 | 2–4 | 7–9 |
| docs, long-form reading | 4–6 | 2–3 | 3–4 |
| redesign: preserve | match existing | +1 | match |
| redesign: overhaul | +2 | +2 | match |

Two rules that make the dials honest rather than decorative:

- **Motion claimed is motion shown.** A page that declares MOTION 7 and ships static hover states is
  broken. If you can't ship working motion in the available scope, drop the dial to 3 and ship a
  clean static page. Never half-build motion that breaks: cut-off scroll triggers, jumpy entrances,
  missing cleanups.
- **High VARIANCE collapses on mobile.** Any asymmetric composition above `md:` must fall back to a
  strict single column below 768px. Overlaps, rotations and negative margins become touch-target
  conflicts.
