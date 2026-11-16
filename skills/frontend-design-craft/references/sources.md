# Sources: ranked by trust

Where this skill's material came from, and how much each input was worth. Read this before adding
anything new to `tells.md` or any other inventory: most published material on "AI design" is written
*by* the thing it describes, or by someone selling a fix for it.

Ranking criteria, in order: domain expertise behind it · factually checkable · on-topic (frontend
design, not prose detection) · specific and actionable · recent (the specifics decay) · conflict of
interest.

---

## Tier 1: load-bearing

| Source | What it contributed | Why it ranks |
|---|---|---|
| **emilkowalski/skills**: `emil-design-eng`, `review-animations/STANDARDS.md`, `apple-design`, `animation-vocabulary` | Nearly all of `motion.md` | The only input written from **shipped domain expertise** rather than pattern observation. Author built Sonner (13M+ weekly downloads) and Vaul, worked at Vercel and Linear. Every claim is a specific value with a stated reason: the frequency table, the easing decision order, the duration bands, `scale(0)` → `scale(0.95)`, origin-aware popovers, the Framer Motion hardware-acceleration caveat, blur-to-mask-crossfades, momentum velocity threshold ~0.11. It also cites its own reasoning chain (why `ease-in` feels slower at identical duration). **This is the highest-quality material in the set by a wide margin.** |
| **`apple-design` (same repo)** | Interruptibility, velocity handoff, momentum projection, rubber-banding, materials/depth, size-specific tracking | Distilled from Apple's WWDC design talks (*Designing Fluid Interfaces* 2018, *The Details of UI Typography* 2020, *Designing Audio-Haptic Experiences*, *Principles of Great Design*). Traceable to a named primary source, with the actual projection function rather than the physics-textbook one people usually reach for: and it says explicitly that the textbook version is *not* what ships. That correction is the mark of someone who implemented it. |
| **impeccable-design**: `SKILL.src.md`, `craft-floor.md`, `new-work.md`, `critique.md` | Visitor modes, the direction contract, the derivation procedure, the calibration list, bounded verification, heuristic scoring, personas, cognitive load | The most structurally sophisticated input. Three ideas here are genuine upgrades over anything else available: **visitor modes** (which extend design guidance past landing pages into product UI, the biggest single gap in the previous skill), **the direction contract** (which makes "does this look good" answerable), and **bounded verification** (build fully → one batched inspection → one batch of fixes → one confirmation → stop). Its critique flow also carries the Nielsen scoring rubric with `n/a` renormalization, five usable personas, and the intrinsic/extraneous/germane cognitive-load split with the Cowan working-memory number. Weakness: heavily coupled to its own tooling (`detect.mjs`, `concept-seed.mjs`, sub-agent orchestration), and written in a compressed, near-oracular register that's hard to follow. Both were stripped; the ideas survived. |

---

## Tier 2: useful, filter first

| Source | What it contributed | Why it ranks |
|---|---|---|
| **taste-skill / `design-taste-frontend`** | The bulk of the concrete tells in `tells.md` sections B and C, hero discipline numbers, banned-palette hex families, the eyebrow budget, spec-sheet alternatives, layout-family repetition rule | By far the **most specific** input: it names hex values, counts eyebrows mechanically, caps zigzags at two, and gives the exact hero line/word limits. That specificity is its value and comes from real production test rounds. Two systematic weaknesses: (1) it declares its scope as "landing pages, portfolios, redesigns, not dashboards, not product UI" and then hands out universal rules, so its guidance needs re-scoping before use; (2) it escalates preferences into absolute bans, which is where it stops being trustworthy, see rejected claims below. |
| **impeccable `harden.md`, `clarify.md`, `polish.md`, `typeset.md`, `layout.md`, `colorize.md`, `animate.md`** | Most of `production.md`, the copy-by-function section, the squint test, OKLCH ramp guidance, spacing rhythm | Solid, conventional, well-organized craft guidance. Nothing surprising, which is the point: it's the material that's *correct* rather than novel, and it fills the gaps the flashier inputs skip (i18n, error taxonomy, form patterns). |
| **taste-skill / `soft-skill`, `minimalist-skill`, `brutalist-skill`, `brandkit`, `redesign-skill`** | Concentric radius math, double-bezel nesting, the redesign audit and preservation rules, palette specificity | Aesthetic-preset skills. Each is a coherent, opinionated house style, which makes them useful as *worked examples* of what committing to a world looks like. Not useful as general guidance: a skill that always produces "expensive soft UI" has traded the decision for a default, which is the failure this skill exists to prevent. Salvaged the mechanics, discarded the presets. |
| **Prior `anti-ai-frontend-design` skill and its sources** (r/website Jun 2026 · Medium "How To Spot AI-Generated Design" Jul 2026 · newwebsite.ai · r/VibeCodeDevs · 925studios) | The core framing, the not-tells list, the Claude fingerprints, the detection honesty, the systems-vs-screens insight | Carried forward wholesale where it was right, which was most places. Its central claim (**these are tells of no decision, not tells of AI**) remains the most useful sentence in the entire corpus, and every input above is downstream of it whether or not they say so. Its section G (not-tells) is the only place in any source that guards against over-correction; without it the specificity of taste-skill would be actively dangerous. Full per-source ranking of that generation lives in the old skill's `sources.md`. |

---

## Tier 3: one idea each

| Source | The one idea | Why it doesn't rank higher |
|---|---|---|
| **taste-skill / `gpt-tasteskill`** | Deterministic anti-mode-collapse: don't build your first-ranked idea, because your ranking is the same every run | The mechanism it proposes ("simulate a Python RNG seeded on the prompt's character count") is theatre; a model narrating a fake random draw is just picking again. But the **problem** it identifies is real and under-addressed everywhere else, and it's the direct ancestor of `direction.md` §4. Everything else in it is over-specified (mandatory AIDA structure, `grid-flow-dense` on every bento, "highly preferred" hero layout) and would produce identical pages. |
| **taste-skill / `output-skill`** | Ban `// rest of code`, `// TODO`, "for brevity" and skeleton-instead-of-implementation | Correct, and worth enforcing: but it's an output-completeness rule, not a design rule. Belongs with `code-standards`, not here. Noted so it isn't re-derived. |
| **impeccable `overdrive.md`** | Context determines what "extraordinary" means: a particle system on a portfolio is impressive, the same system on a settings page is embarrassing, but instant optimistic saves on that settings page *are* extraordinary | Good framing, and it folded into the visitor-mode logic. The rest is a browser-API catalogue that dates fast. |
| **`pick-ui-library`, `prototype`, `find-animation-opportunities`** (emilkowalski) | Don't hand-roll a toast or a dialog; build multiple versions and switch between them | Sensible, small, mostly workflow rather than craft. Folded into `stacks.md` §4 and `direction.md` §4. |

---

## Claims checked and rejected

Everything below appeared in an input and is deliberately **not** in this skill.

- **"Em-dashes are completely banned: zero, anywhere visible, non-negotiable"** (taste-skill §9.G,
  its single most emphatic rule). Over-reach, and it contradicts better-sourced material. The
  em-dash-in-prose panic is a locale convention (UK spaced en dash vs. US unspaced em dash), not a
  detector, and banning a legitimate typographic character produces stilted copy: which is itself a
  tell. The narrower, real pattern survives in `tells.md` §C: the em-dash used as an **ornament** in
  eyebrows, pills, nav items and button labels, where it was chosen because it looked designed.
- **"Avoid Inter"** (taste-skill, minimalist-skill, soft-skill: all three). Stated as a rule while
  Linear is held up elsewhere as the model of good typography. Linear runs Inter, and is substantially
  responsible for Inter becoming the SaaS default. The principle is **choose**, not **avoid a named
  font**. Kept as a self-check list with that correction stated explicitly.
- **"Centered heroes are avoided when DESIGN_VARIANCE > 4"** (taste-skill §4.3). A numeric threshold
  invented for a dial that is itself invented. Centered heroes work; the tell is centering by default.
- **"Serif is very discouraged as the default for any project"** paired with a banned-serif list
  containing Fraunces and Instrument Serif specifically. The *observation* is correct and useful (the
  creative-brief → serif reflex is real and heavily tested). The absolute framing isn't, so it's
  restated as a justification requirement.
- **"Simulate Python `random.choice()` with a seed derived from the prompt's character count"**
  (gpt-tasteskill §1). A model writing out a fake RNG trace is still choosing; the "randomness" is
  narrated, not sampled. Replaced with the honest version: enumerate candidates, name and exclude the
  rut *and* its predictable opposite, then either let the user pick or score on stated criteria.
- **"Mandatory AIDA page structure"** (gpt-tasteskill §2): a fixed section order is exactly the
  eight-section skeleton this skill treats as a tell, wearing a marketing acronym.
- **"Hero: Cinematic Center (Highly Preferred)"** (gpt-tasteskill §3), a document that randomizes
  layout and then marks one option as preferred has undone its own mechanism.
- **"NEVER generate the exact same layout or aesthetic twice in a row"** (soft-skill §1): an
  instruction a stateless model cannot follow. Real cross-session rotation requires a written record;
  the enforceable version is the calibration self-check in `direction.md` §5.
- **"Assume premium fonts like Clash Display and PP Editorial New are available"** (soft-skill §2),
  they're commercially licensed. Assuming a paid font is installed produces a page that renders in the
  fallback. `stacks.md` requires verifying the dependency exists.
- **Banning Lucide, Heroicons and Feather outright** (minimalist-skill, soft-skill). Icon families
  aren't good or bad; mixing them is. Restated as "one family, one stroke weight, verify it exists".
- **Fixed dial baselines presented as universal defaults** (`8 / 6 / 4`, taste-skill §1): a
  landing-page baseline applied to a dashboard produces an unusable dashboard. Kept as an optional
  shared vocabulary with per-mode values, not a default.
- **The entire `<codex>` / `<claude>` / `<gemini>` per-model conditional apparatus** (impeccable),
  harness-specific and unverifiable here. The one substantive claim inside it that *was* checkable
  and did survive: Claude's measured-rendition prior toward cream grounds, serif display and lamplight
  for warm or bookish subjects. It matches observed output, so it's in `tells.md` §E.
- **All tooling-coupled instructions** (`detect.mjs`, `concept-seed.mjs`, `live-server.mjs`,
  sub-agent orchestration, `.impeccable/` snapshot persistence, hook management). Real machinery for
  that product; dead references in a skill that doesn't ship it. The *ideas* they implement: a
  mechanical scan separate from human judgment, isolated assessments, an ignore list, a score trend
survive as process guidance in `review.md`.

---

## Where the sources disagree

Recorded because a future editor will hit these and needs to know they were resolved, not missed.

| Question | taste-skill says | emil / apple says | impeccable says | Resolution |
|---|---|---|---|---|
| Default typeface | Never Inter; pick Geist / Satoshi / Cabinet Grotesk | Default to the platform system font; it already ships optical sizing and tracking tables | Operate and Read are well served by system stacks; Persuade and Experience want a face with a POV | **Split by mode.** System stack for Operate/Read, a chosen face for Persuade/Experience. |
| How much motion | `MOTION_INTENSITY` dial, 6 is baseline for a landing page | Frequency decides; 100+/day means none, ever | One authored moment, not scattered effects | **Frequency first, then one authored moment.** The dial is a vocabulary, not a driver. |
| Bounce / overshoot | Spring physics everywhere: `stiffness: 100, damping: 20`, "no linear easing" | Critically damped by default; bounce only when the gesture carried momentum | Never bounce or elastic by reflex | **Critically damped default**, bounce reserved for momentum. |
| Images | Mandatory: use a gen tool, or Picsum, always, even on minimalist briefs | (silent) | Author the assets; never substitute chrome | **Real → generated → labeled placeholder**, with the "pure text isn't minimalism" point kept. |
| Scope of guidance | Landing pages, portfolios, redesigns only | Component and interaction level | All surfaces, split by visitor mode | **Visitor modes**, which is the only framing that covers both. |
