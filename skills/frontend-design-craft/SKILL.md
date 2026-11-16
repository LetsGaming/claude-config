---
name: frontend-design-craft
description: >
  Use for interface work where the result has to be good, not just functional: landing pages,
  marketing sites, portfolios, dashboards, product UI, components, forms, onboarding, empty states,
  docs. Covers direction (reading the brief, choosing a visual world, avoiding the category
  default), craft (typography, color, layout, spacing, materials), motion (easing, duration,
  springs, gestures, interruptibility, reduced motion), production (states, edge cases, a11y, i18n,
  performance), content (copy, imagery, demo data), and review (heuristic scoring, personas,
  cognitive load, the tell inventory). Triggers: "make it not look AI-generated", "AI slop", "make
  it look designed", "sieht nach KI aus", "review this UI", "why does this feel cheap", "make this
  bolder/quieter/simpler", "the animation feels off", and any UI work where look or feel matters,
  even if unsaid. Also for judging if a site reads as generated. Read BEFORE generating. Supersedes
  anti-ai-frontend-design; layer code-standards and human-writing-style.
---

# Frontend design craft

## The actual problem

None of the tells in this skill mean "a model made this". They mean **nobody made a decision**. A
model emits the median of its training data: so does a Squarespace template, so does a tired dev
reaching for the shadcn default at 17:45. Template-built sites have looked interchangeable for well
over a decade. AI didn't invent the median, it just made it free.

Two consequences, and they're the whole point:

- A generated page where every default was overridden is undetectable. There's nothing left to spot.
- A hand-coded page that accepted every default is slop anyway. The tool is irrelevant.

So this is not a checklist for evading detection. It's a map of the places where a decision is
missing, plus what to decide there instead. Strip the surface tells without deciding anything and
you get the same page in a different palette.

## Two ways to fail

- **Under-correction**: ship the median. Inter, aurora gradient, centered hero with two CTAs, four
  card grids, glass panels, "Transform your workflow". Competent, invisible, forgotten before the
  tab closes.
- **Over-correction**: flee the median. Four competing display fonts, parallax on every section,
  custom cursor, brutalist edges for no reason, animations that must finish before the user can
  read. This reads as *no taste* just as loudly as slop does, and now the thing is also unusable.
  The canonical version: someone re-prompts an AI builder until the output "doesn't look AI", ships
  a page that looks like 1998, and gets told so by everyone who sees it.

The target is **intentional**, not *different*. Linear, Stripe and Notion are distinctive through
*fewer* and harder choices, not more of them. Restraint reads as confidence; noise reads as panic.

## Step 0: name the mode

Everything downstream depends on this, and getting it wrong is the most expensive mistake available.
The mode names what success looks like **for this surface**, not for the product.

| Mode | The visitor... | Design's job | Typical surfaces |
|---|---|---|---|
| **Persuade** | decides and acts | earn attention, then action; design *is* the product | landing, marketing, pricing, campaign |
| **Operate** | completes a task | scanability, consistency, native expectation; brand lives in precise details | app UI, dashboards, editors, admin, settings |
| **Read** | understands something | structure for comprehension, then make staying pleasant | docs, articles, guides, changelogs, help |
| **Experience** | is inside the work | the artifact leads from the first viewport; the interface recedes | portfolio, gallery, showcase, case study |

Pick from the **surface**, not the company. A dev tool's landing page is Persuade. A fashion house's
documentation is Read. A docs index is Read, not Persuade. A settings screen inside a beautiful
marketing brand is Operate.

The mode sets the budget: Persuade and Experience get expression, Operate and Read get precision.
Expression that obscures a task on an Operate surface is a defect, not boldness. Precision without
any point of view on a Persuade surface is a wasted page.

## The decision budget

Pick a small number of things to be genuinely distinctive about. Take the boring conventional
default everywhere else, **on purpose**, and be able to say why.

- Persuade / Experience: **three** distinctive axes.
- Operate / Read: **one or two**. The rest of the budget goes into density, state coverage, and
  interaction precision: which is where those modes actually win.

Ranked by differentiation per unit of effort:

1. **Typography.** Highest leverage, lowest cost. One display face with a point of view, one text
   face that disappears. Chosen because it fits the subject, not because it was on a "best fonts
   2026" list. → `references/typography.md`
2. **Color strategy.** Not "which colors": *how much*. Restrained, Committed, Full-palette, or
   Drenched. Colors that mean something (`--color-action-primary`) beat colors that decorate
   (`--color-gradient-start`). → `references/color.md`
3. **One motion signature.** One kind of movement, applied where it communicates state: not a
   fade-in-with-Y-transform stapled to every element on scroll. → `references/motion.md`
4. **Real content.** Actual screenshots, actual numbers, actual names. Specificity is the one thing
   a model can't average its way to. → `references/content.md`
5. **Composition.** A structure derived from *this* content, rather than the eight-section skeleton
   every page in the training set shares. → `references/layout.md`

Everything outside the budget: conventional, quiet, correct. A centered hero is fine. Cards are
fine. The problem was never the pattern, it was picking every pattern by not picking.

## Workflow

1. **Get the constraints before generating anything.** What does it do, who buys or uses it, what's
   the one action or task, what's actually true (real metrics, real customers, real screenshots),
   what's fixed (brand, stack, a11y, i18n, legal, existing components). Without this, output
   defaults to the median because the median is the only thing left to fall back on. If the user
   hasn't given you this, ask: one round of two or three questions beats three redesigns. In a
   repo, this belongs in `CLAUDE.md`.
2. **Derive a direction, don't accept your first one.** Your first idea is the category default
   wearing the subject's clothes. `references/direction.md` has the derivation procedure, the
   anti-mode-collapse rule, and the calibration list of looks that AI output collapses into.
3. **Write the direction contract** (below) before writing any CSS. Five short blocks. If a block
   reads like a mood, the direction isn't decided yet.
4. **Build, committed.** Land the first build fully committed to the direction. The passes that
   follow exist to make the committed thing *clear*, never to dilute it back to safe. Follow
   `code-standards` + `references/stacks.md`. Design tokens only, no hardcoded style values.
5. **Verify against the craft floor** (below). These are checks on the rendered result, not
   intentions.
6. **Run the review gate** (below), then hand over.

Reviewing someone else's page rather than building? Skip to `references/review.md` and
`references/tells.md`.

**Bounded verification, not a loop.** Build fully, inspect once (desktop and mobile together in one
batched round), fix everything that round shows in one batch, confirm with at most one more round,
stop. Open-ended self-QA burns time and money re-finding the same three issues.

## The direction contract

Write this into the artifact's opening comment before any code. Five blocks, 150 words total, in a
form that survives the build (an HTML comment in emitted markup, not frontmatter the compiler
strips).

- **THESIS**: the one idea this surface owns, and the category-default arrangement it refuses.
- **WORLD**: the palette and component language, specific enough to be recognizable with all
  content removed.
- **STORY**: what the visitor understands, believes, and does.
- **FIRST VIEWPORT**: the exact composition: what is where, at what scale, where the primary action
  or first task sits.
- **RISK**: the honest downside of this direction, and what it costs if the bet is wrong.

The contract is what the finishing review audits the render against. Without it, "does this look
good" has no answer, and every review turns into taste ping-pong.

## The craft floor

Non-negotiable. Every one is a check on the built result, run together in one inspection round.

- **Contrast.** Body and placeholder text ≥4.5:1, large text ≥3:1, controls and focus indicators
  ≥3:1. On colored surfaces, tint secondary text from that hue, never flat gray.
- **Type.** Body measure 45–75ch. Body floor 16px/1rem on web (iOS Safari force-zooms focused inputs
  below 16px). Tracking floor -0.04em. Real copy at every breakpoint; fix what overflows.
- **Spacing.** Tight groups, generous separation, more space above a heading than below it. Read the
  computed values, don't eyeball them.
- **Depth.** Shadows carry an offset and a soft blur. A zero-offset colored halo is decoration, not
  elevation. Declare elevation once: border *or* shadow, not both.
- **States.** Default, hover, focus, active, disabled, loading, error, empty, success. Plus real
  content, working controls, keyboard focus, responsive composition.
- **Motion.** One authored moment, not scattered effects, and not one identical entrance on every
  section. Content visible by default so a failed script never hides the page.
- **Copy.** The product's own language. Controls name their action; errors name the problem *and*
  the recovery.
- **Coverage.** Every brief requirement present and findable within seconds.

## Worst offenders (short form)

Full inventory with reasons and fixes: `references/tells.md`. If you read nothing else:

- The trendy default sans, chosen by not choosing. The *name* rotates (Inter → Geist / Instrument
  Sans / General Sans → serif-everywhere). The category is permanent: the font a model would pick.
- Purple→blue gradient. Aurora/ambient blur background. Gradient-filled headline.
- Everything is a card. One radius, one padding, one shadow, everywhere. Nested cards.
- Glassmorphism as the entire visual language.
- Floating "Trusted by 10,000+ teams" pill above an H1 that hasn't said what the product is yet.
- Stat bar of numbers nobody earned: 99.9% uptime, 500M requests, 10x faster.
- Eyebrow label on every single section. Section numbers (01 / 02 / 03). "No credit card required ·
  60 seconds" under every CTA. (All three are current Claude fingerprints.)
- Fake dashboard mockup built from divs, instead of a real screenshot.
- Headline that fits any company in the category: "Transform your workflow", "Build the future of X".
- Emoji standing in for icons.
- `<!-- Hero Section -->` / `{/* Features Section */}` label comments. Everything in one file.
- Links that go nowhere. No empty state. No error state. Mobile never opened.

## Review gate

Answer these before calling it done. Ordered cheapest-to-check first. Deeper scoring, personas and
cognitive-load assessment live in `references/review.md`.

1. **Cover the logo.** Could this page belong to any other company in the category? If yes, nothing
   on it is yours.
2. **Ten-word test** (Persuade/Read) or **first-task test** (Operate/Experience). After the first
   viewport only: can someone say what this does in ten words, or start the primary task without
   hunting?
3. **Name three decisions** on this page a model wouldn't have reached by default, and the reason
   for each. Can't name three → you shipped the median.
4. **Which numbers are on the page, and are they true?** Delete every one that isn't. An unearned
   stat is worse than no stat: it performs authority instead of building it, and it poisons the true
   numbers next to it.
5. **Which states exist?** Empty, loading, error, zero-results, long-content, one-item, 500-items,
   no-permission. Pretty page + no empty state is the loudest tell in this skill, because it's the
   one that proves nobody used the thing.
6. **Every link and button: where does it go?** Dead links, no-op handlers, unreachable new pages.
7. **Open it on a real phone.** Not the devtools toggle.
8. **grep** for: `console.log`, `TODO`, `lorem`, `Section -->`, `placeholder`, API keys,
   `example.com`, `Your Company`, gmail addresses in a contact block.
9. **Is the variation intentional?** If every radius, padding and heading size is identical, that's
   not a system, that's an absence of one. Hierarchy comes from deliberate contrast.
10. **Squint at it.** Blur the detail. Can you still name the primary element, the secondary, and the
    major groups, in order? If everything has equal weight, there is no hierarchy.
11. **Would a specific named human say this sentence out loud?** If not, rewrite until they would.
    Use `human-writing-style` for anything longer than a label.
12. **Does the render match the direction contract?** Read the contract back. If the built thing
    doesn't deliver THESIS and FIRST VIEWPORT, the build drifted to safe.

## Detection: "is this site AI-made?"

There is no reliable detector and no proof. Prose detectors have real false-positive rates and their
vendors sell detection; for *design* there's no equivalent tool at all, only pattern-matching. Three
rules when asked to judge:

- **Report a probability with named evidence, not a verdict.** "Six of the current tells, including
  three that only show up in generated output: probably generated, but a template plus a rushed dev
  produces the same fingerprint" is honest. "This is AI" is not.
- **Weight the tells that cost effort to fake.** Visual tells are cheap to change and rotate every
  few months. Systemic ones: no empty states, flows that break when you join two screens, a new page
  that isn't linked from the nav, interaction patterns that disagree between screens: come from
  nobody having *used* the thing, and they survive every restyle.
- **Template ≠ AI, and generic ≠ bad.** The useful question is almost never "was a model involved".
  It's "does this page say anything specific about this product". That one has an answer.

## References

Load the one that owns the task. Don't load all of them.

| File | When |
|---|---|
| `references/direction.md` | Before generating anything new; redesigns; "what should this look like" |
| `references/tells.md` | Reviewing output; final sweep; judging someone else's page |
| `references/typography.md` | Choosing or fixing type, hierarchy, faces, scale |
| `references/color.md` | Choosing or fixing palette, theming, dark mode, contrast |
| `references/layout.md` | Composition, spacing, grids, hero structure, responsive behavior |
| `references/motion.md` | Any animation, transition, gesture, or "the motion feels off" |
| `references/production.md` | States, edge cases, a11y, i18n, performance, hardening |
| `references/content.md` | Copy, imagery, icons, demo data, social proof |
| `references/review.md` | Design review, critique, scoring, personas, cognitive load |
| `references/stacks.md` | Which library or design system, install commands, code skeletons |
| `references/sources.md` | Provenance and confidence; read before adding to any inventory |
