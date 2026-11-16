# Feature Roadmap

How to propose future features for the project and score each by value and by how hard it is to
build given the code that exists. The output should read like advice from someone who understands
both the product and the codebase: not a generic feature wishlist.

## Step 1: Understand what the project is for
Before proposing anything, form a clear picture of the product from evidence in the code itself
(documentation files are out of audit scope by default: see SKILL.md; use them only if the user
explicitly put docs in scope, and even then never as proof of what's implemented):
- Structure & routes: what the app actually does (the endpoints/commands/screens reveal the real
  feature surface).
- Names & domain types: entities, services, and schema tell you what the product is about.
- `TODO`/`FIXME`/`@deprecated` markers and half-finished modules: the team's own signposts for
  what's incomplete or planned.
- Domain: what similar products in this space typically need next.

Write a one-line "what this is" so the roadmap is anchored. If the purpose is genuinely unclear,
say so and propose conservatively.

## Step 2: Generate candidate features
Draw candidates from four sources, in rough priority order:
1. **Gaps the audit exposed.** Missing auth hardening, missing tests, no rate limiting, no
   observability: features that address real weaknesses double as roadmap items.
2. **Half-built or hinted work.** Anything the code shows as started/stubbed/TODO'd.
3. **Natural product next-steps.** The obvious extensions of what exists (e.g. an app with login
   but no password reset; an API with no pagination; a tool with no config file).
4. **Domain-standard capabilities** the product lacks (audit logging, export, webhooks, SSO,
   multi-tenancy, i18n): but only ones that fit this product, not a checklist.

Prefer a focused set (roughly 6–12 well-chosen items) over an exhaustive dump.

## Step 3: Score each feature
Rate every candidate on three dimensions:

- **Value / Impact** (High / Medium / Low): how much it helps users or the business, or how much
  it de-risks the product. Be concrete about *who* benefits and *how*.
- **Effort / Complexity** (S / M / L): implementation size. S = a day or so; M = up to ~a week;
  L = multi-week / cross-cutting. Estimate against *this* codebase, not in the abstract.
- **Ease given the current architecture** (Easy / Moderate / Hard): does the existing code make
  this straightforward, or does it fight you? A feature can be conceptually small but Hard here
  because the architecture doesn't support it (e.g. adding multi-tenancy to code with global
  state), or conceptually large but Easy because the seams already exist. This is where codebase
  knowledge adds value the reader can't get elsewhere: always tie the rating to specifics
  ("routing already centralizes handlers, so adding auth middleware is Easy" / "state is global,
  so per-tenant isolation is Hard").

Note prerequisites and risks where they matter (e.g. "needs the `orders.py` refactor first",
"requires a schema migration").

## Step 4: Present it
Two views:

**Scored table** (ordered by value, then by ease):

| Feature | Value | Effort | Ease (this codebase) | Prereqs / notes |
|---|---|---|---|---|
| Password reset flow | High | S | Easy: auth + email plumbing already exist | - |
| Per-tenant data isolation | High | L | Hard: global state in `db.py` must go first | Refactor QUAL-02; migration |

**Quick-wins callout:** explicitly list the High-value / Low-effort / Easy items, these are what
the team should do first, and calling them out makes the roadmap immediately actionable.

**Sequenced roadmap**: group into **Now / Next / Later** with a one-line rationale each:
- *Now:* quick wins and anything that closes a serious audit finding.
- *Next:* higher-value items that depend on Now items or need moderate effort.
- *Later:* strategic, high-effort bets, note the prerequisite work.

Keep the whole section tight: the table plus the quick-wins list plus Now/Next/Later is enough.
Every item must trace back to something real in the project.
