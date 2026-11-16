# Review

For reviewing an interface (your own or someone else's) and producing findings someone can act on.

**Contents**

- 1. How to run a review
- 2. Specificity verdict
- 3. Heuristic scoring
- 4. Cognitive load
- 5. Personas
- 6. Severity
- 7. Report format
- 8. How to give the feedback
- 9. Reviewing your own work

---

## 1. How to run a review

Two passes, in this order, and **don't let the second contaminate the first**.

**Pass A: judgment.** Read the source and look at the rendered page. Form the design opinion before
running any mechanical check, because a list of detected patterns anchors judgment hard: once you've
read "6 findings", you review the findings instead of the design.

Assess: design specificity, hierarchy, information architecture, emotional fit, discoverability,
composition, typography, color, states, copy, edge cases, cognitive load, and the heuristics.

**Pass B: mechanical.** Grep and inspect for the concrete things: the tell inventory, contrast
values, state coverage, dead links, leftover artifacts, computed spacing, console errors, the
responsive breakpoints. Run at real viewport sizes, both themes, desktop and mobile.

**Then synthesize.** Weave the two together: don't concatenate them. Note where they agree, where
the mechanical pass caught something judgment missed, and where a mechanical finding is a false
positive. False positives matter: reporting them builds trust in the rest of the list.

**Bound the passes.** One inspection round, one batch of fixes, one confirmation round. Stop. A
review that keeps finding new things forever is a review that isn't prioritizing.

**Be honest about a degraded run.** If you couldn't render the page, couldn't test mobile, couldn't
check contrast on computed values: say so at the top of the report. A confident review of things you
didn't actually look at is worse than no review.

---

## 2. Specificity verdict

**Start here, before any scoring.** The question that makes the rest worth reading:

> Is the composition, interaction and visual language grounded in *this* product, or could an
> unrelated product in an adjacent category use it unchanged?

Answer with evidence: name the elements that are product-specific, and name the ones that are
category-interchangeable. "Cover the logo: could this be anyone?" is the compressed version.

This verdict outranks the heuristic score. A page can score 34/40 and still be completely generic;
those are different failures with different fixes.

---

## 3. Heuristic scoring

Nielsen's ten, scored 0–4. Be honest: 4 means genuinely excellent, not "good enough". Most real
interfaces land 20–32.

| # | Heuristic | 0 | 2 | 4 |
|---|---|---|---|---|
| 1 | **Visibility of system status** | user is guessing what happened | some states communicated, major gaps | every action confirms, progress always visible |
| 2 | **Match system / real world** | pure jargon | some plain language, jargon leaks | speaks the user's language fluently |
| 3 | **User control and freedom** | users get trapped | main flows escape, edge cases don't | undo, cancel, back and escape everywhere |
| 4 | **Consistency and standards** | feels like different products stitched together | main flows match, details diverge | cohesive, predictable throughout |
| 5 | **Error prevention** | no guardrails | common errors caught, edge cases slip | errors nearly impossible by design |
| 6 | **Recognition over recall** | users must memorize paths | main actions visible, secondary hidden | everything discoverable |
| 7 | **Flexibility and efficiency** | one rigid path | basic keyboard support | multiple paths, power features, customizable |
| 8 | **Aesthetic and minimalist design** | everything competes equally | main content clear, periphery noisy | every element earns its pixel |
| 9 | **Error recovery** | cryptic codes or silence | names the problem, not the fix | pinpoints issue, suggests fix, preserves work |
| 10 | **Help and documentation** | none | FAQ exists, not contextual | right info at the right moment |

**Mode applicability.** Heuristics 7 and 10 can legitimately be `n/a` on Persuade and Experience
surfaces, as can any heuristic that genuinely cannot apply. Write `n/a` with a one-line reason and
**renormalize the total**: the maximum is 4 × the number scored. Never print `/40` over a partial
set.

| Percentage | Rating | Meaning |
|---|---|---|
| 90%+ | Excellent | minor polish only |
| 70–89% | Good | address weak areas, solid foundation |
| 50–69% | Acceptable | significant improvements needed |
| 30–49% | Poor | major UX overhaul required |
| <30% | Critical | redesign; unusable as-is |

So 24/32 is 75% → Good. 24/40 is 60% → Acceptable. Same raw number, different verdict.

---

## 4. Cognitive load

Three kinds, and only one of them is worth eliminating:

- **Intrinsic**: complexity inherent to the task. Can't be removed; can be structured (steps,
  scaffolding, defaults, progressive disclosure, grouping related decisions).
- **Extraneous**: mental effort caused by bad design. **Eliminate ruthlessly**; it's pure waste.
- **Germane**: effort spent building understanding. This is *good*; support it with consistent
  patterns that reward learning and feedback that confirms correct mental models.

### The working-memory rule

**Humans hold ≤4 items in working memory** (Miller's law as revised by Cowan, 2001). At every
decision point, count the distinct options a user must simultaneously consider:

- **≤4**: within limits
- **5–7**: pushing it; group or disclose progressively
- **8+**: overloaded; users will skip, misclick or abandon

Applications: 1 primary action + 1–2 secondary, rest in a menu · ≤5 top-level nav items · ≤4 sibling
choices per level in a docs sidebar · one decision per screen in a gallery index (which piece to
open), not filter + sort + tag simultaneously.

### Checklist

- [ ] **Single focus**: the primary task completes without competing elements
- [ ] **Chunking**: information in digestible groups (≤4 per group)
- [ ] **Grouping**: related items visually grouped by proximity
- [ ] **Visual hierarchy**: immediately clear what matters most
- [ ] **One thing at a time**: a single decision before the next
- [ ] **Minimal choices**: ≤4 visible options at any decision point
- [ ] **Working memory**: nothing must be remembered from a previous screen
- [ ] **Progressive disclosure**: complexity revealed only when needed

0–1 failures = low load · 2–3 = moderate, address soon · 4+ = critical.

### The eight common violations

1. **Wall of options**: 10+ choices, no hierarchy → group, highlight the recommended, disclose.
2. **Memory bridge**: step 3 needs information from step 1 → keep context visible or repeat it.
3. **Hidden navigation**: the user must build a mental map → breadcrumbs, active states, progress.
4. **Jargon barrier** → plain language, or define inline.
5. **Visual noise floor**: everything has equal weight → one primary, 2–3 secondary, rest muted.
6. **Inconsistent pattern**: similar actions behave differently → standardize.
7. **Multi-task demand**: read + decide + navigate simultaneously → sequence it.
8. **Context switch**: jumping between screens to gather info for one decision → co-locate.

---

## 5. Personas

Pick **2–3** relevant to the interface and walk the primary action as each. Report what *broke* for
them, naming exact elements: not generic persona descriptions.

**Alex: impatient power user.** Expert, hates hand-holding, will find shortcuts or leave.
*Red flags*: forced or unskippable onboarding · no keyboard path for primary actions · animations
that can't be skipped · one-item-at-a-time workflows where batch is natural · redundant confirmation
on low-risk actions · no Esc on modals.

**Jordan: confused first-timer.** Never used this kind of product; will abandon rather than figure
it out. *Red flags*: icon-only navigation · jargon without explanation · no visible help · ambiguous
next step after an action · no confirmation that something succeeded · the first action isn't obvious
within 5 seconds.

**Sam: accessibility-dependent.** Screen reader, keyboard-only, possibly low vision or motor
impairment, may zoom to 200%. *Red flags*: click-only interactions · missing or invisible focus
indicators · meaning conveyed by color alone · unlabeled fields or buttons · time-limited actions
with no extension · custom components that break screen-reader flow.

**Riley: deliberate stress tester.** Methodically pushes past the happy path. *Red flags*: features
that appear to work but silently fail · errors that expose internals or leave the UI broken · empty
states with no guidance · data lost on refresh or back-navigation · inconsistent behavior between
similar interactions.

**Casey: distracted mobile user.** One thumb, on the go, interrupted, possibly on a slow
connection. *Red flags*: primary actions at the top of the screen (unreachable) · no state
persistence across tab switches · large text inputs where selection would do · heavy assets on every
page · tap targets too small or too close.

Selection guide:

| Interface | Personas | Why |
|---|---|---|
| Landing / marketing | Jordan, Riley, Casey | first impression, trust, mobile |
| Dashboard / admin | Alex, Sam | efficiency, accessibility |
| E-commerce / checkout | Casey, Riley, Jordan | mobile, edge cases, clarity |
| Onboarding | Jordan, Casey | confusion, interruption |
| Data-heavy / analytics | Alex, Sam | keyboard, density |
| Forms / wizards | Jordan, Sam, Casey | clarity, a11y, mobile |
| Docs | Jordan, Alex | comprehension, findability |

Add a project-specific persona when real audience information exists. Don't invent audience details
to justify one.

---

## 6. Severity

| Priority | Name | Meaning | Action |
|---|---|---|---|
| **P0** | Blocking | prevents task completion entirely | fix immediately |
| **P1** | Major | significant difficulty or confusion | fix before release |
| **P2** | Minor | annoyance with a workaround | next pass |
| **P3** | Polish | no real user impact | if time permits |

Tiebreaker: *would a user contact support about this?* If yes, it's at least P1.

---

## 7. Report format

```
## Specificity verdict
[Product-specific vs. category-interchangeable, with named evidence.]

## Design health
[Heuristic table, scores, n/a with reasons, renormalized total, rating band.]

## Overall impression
[Gut reaction: what works, what doesn't, the single biggest opportunity.]

## What's working
[2–3 things done well, and specifically why they work.]

## Priority issues
[3–5, ordered by impact. For each:]
- **[P?] What**: name the problem precisely
- **Why it matters**: how it hurts users or undermines the goal
- **Fix**: concrete, not "consider exploring"

## Persona red flags
[2–3 personas, exact elements that broke for each.]

## Cognitive load
[Checklist failures, decision points with >4 options.]

## Minor observations
[Quick notes worth addressing.]

## Questions
[Provocative questions that might unlock better solutions.]

## Coverage
[What you could NOT check, and why.]
```

---

## 8. How to give the feedback

- **Be specific.** "The submit button", not "some elements". "Body text at 13px on `#f7f5f1` is
  3.9:1", not "contrast could be better".
- **Say what's wrong AND why it matters to users.** A finding without a consequence is a preference.
- **Give concrete fixes.** Cut "consider exploring" entirely.
- **Prioritize ruthlessly.** If everything is important, nothing is. Five priority issues, not
  twenty-five.
- **Don't soften criticism.** Vague feedback wastes everyone's time and gets ignored anyway.
- **Lead with what works**, briefly and specifically: it calibrates the rest and it's usually true.
- **Ask provocative questions** at the end: "What would a confident version of this look like?"
  "Does this need to feel this complex?" "What if the primary action were the only action?"

---

## 9. Reviewing your own work

The hard case, because you'll defend the decisions you just made.

- **Read the direction contract back first.** Does the render deliver THESIS and FIRST VIEWPORT? Most
  self-review failures are drift toward safe during the build, and the contract is the only thing
  that catches it.
- **Fresh eyes the next day**, or at minimum after a context switch. Imperfections invisible during
  development are obvious later.
- **Look at it at 25% zoom** to check rhythm, and squint to check hierarchy.
- **Use it, don't look at it.** Complete the primary task with the keyboard. Fill in the form
  wrong. Load it on a phone on cellular.
- **The three-decisions test**: name three choices on this page a model wouldn't have made by
  default, plus the reason for each. If you can't, you shipped the median: and no amount of
  polishing will fix that, because it isn't a polish problem.
