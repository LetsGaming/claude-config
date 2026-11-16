# The tell inventory

**Snapshot: July 2026.** The specifics decay, font names and gradient fashions rotate every 12–18
months as models retrain on the sites the last generation produced. The *categories* don't. If the
named fonts and hex values below look dated when you read this, they are; the entry still holds, swap
in whatever the current default is. Re-check yearly.

Each entry: the tell → why it reads as generated → what to do instead.

Nothing here is proof. Each one is a place where a decision is usually missing. Section **J** lists
the ones that get called out as AI but aren't, which matters just as much: over-correction is a real
failure mode.

**Weight by cost-to-fake.** Sections A–E are cheap: a restyle removes them in an hour, and they
rotate with fashion. Sections F–H are expensive: they come from nobody having *used* the thing, and
they survive every restyle. When judging a page, weight F–H roughly three times as heavily.

**Contents**

- A. Visual defaults
- B. Hero and section furniture
- C. Micro-label and ornament tells
- D. Copy
- E. Current Claude fingerprints
- F. Code artifacts
- G. State and edge-case gaps
- H. System and flow
- I. Content and data
- J. Not tells

---

## A. Visual defaults

**The trendy default sans, chosen by not choosing.** Current rotation: Geist, Instrument Sans,
General Sans, Inter Display; Inter and Roboto for the older layer; as of mid-2026 a serif everywhere
is itself becoming the fingerprint. All good typefaces: that's the problem. They're the safe pick,
which is why the model picks them, which is why every page has them. → One display face chosen
because it fits the subject, one text face that gets out of the way. Be able to name the reason.
Inter on a product that wants Inter is fine, and Linear proves it. Inter because it came with the
template is the tell.

**Purple→blue gradient.** Hero, CTA button, background accent. Statistically the safest "modern tech"
signal in the training data, therefore omnipresent, therefore meaningless. → Pick a palette from the
subject: what the product is, where it's used, who uses it. Flat and specific beats gradient and
generic.

**Aurora / ambient blur background.** The blurry purple-blue glow behind the hero. It signals "future
technology company" on plumbers' sites and yoga studios' sites alike. → Delete it. If the background
needs to do something, make it do that thing.

**Gradient-filled headline text.** Spectacle instead of hierarchy, at the cost of contrast, on the
one element that most needs to be readable. → Solid color. Impact from size, weight and what the
sentence says.

**Glassmorphism as the whole visual language.** `backdrop-filter: blur()` makes anything look premium
in one CSS rule, which is exactly why it's everywhere. Text on frosted glass is harder to read than
text on a solid background, and glass on glass on glass reads as a stack of identical brochures. →
Use at most once, where the layering *means* something (chrome floating above content that should
stay visible). Never stack a light translucent surface on another. Provide a solid fallback under
`prefers-reduced-transparency`.

**One radius, one padding, one shadow, on everything.** Every card 16px, every gap 24px, uniform soft
shadow plus glow to fake depth. Uniformity is not a design system, it's the absence of one: real
hierarchy comes from deliberate contrast. → Vary on purpose: a primary surface should not carry the
same treatment as a tertiary one.

**Everything is a card.** Every piece of content boxed. Feature grid of identical cards, 3-card
pricing, testimonial grid, four card sections in a row. → Cards are fine (see J). *Only* cards is
four instances of the same reflex. Group with proximity, `border-t`, `divide-y` or negative space
before reaching for a container.

**Nested cards.** A card inside a card. Always wrong, without exception. Elevation declared twice
means elevation means nothing.

**The ghost card.** A 1px border *and* a wide soft shadow on the same element. Declare elevation
once: border or shadow.

**Zero-offset colored halos** standing in for shadows. A glow is decoration; a shadow has an offset
and a soft blur and implies a light source.

**Three equal feature cards in a row.** The single most-generated layout in existence. → Asymmetric
grid, a 2-column alternation, one large plus two small, or a horizontal scroll if breadth matters
more than depth.

**Grid or dot pattern background in the hero.** Same category as aurora: texture applied because the
space felt empty. Two-axis grid overlays and `repeating-linear-gradient` stripes need an actual
canvas, map, blueprint or measuring instrument underneath them to earn their place.

**Colored `border-left` above 1px** on cards, list items, callouts and alerts. Bootstrap's alert
component, still echoing fifteen years later.

**Emoji as icons.** 🚀 in a feature list, ✨ on a button. Reads as placeholder that shipped. → Real
icon set, consistent weight and grid. Also fixes the accessibility and cross-platform rendering
problem you didn't know you had.

**Hand-rolled SVG icons.** Drawn path-by-path because a glyph was missing. They never match the set's
optical weight. → Install a second icon library, or compose from primitives.

**Sketch-style SVG illustration.** `loose-sketch` / `doodle` class names, `feTurbulence` grain,
wobbling hand-drawn strokes. Reads as amateur. → Real illustration or none.

**Stock 3D blobs, floating geometry, "diverse team looking at a laptop".** AI illustration has its
own tell: too smooth, too symmetrical, slightly plastic. → Real product screenshots. Real photos of
the real thing. If neither exists, that's information: say something true instead of showing
something fake.

**Sparklines, progress rings, and soft-shadowed rounded rectangles standing in for content.**
Decorative chrome pretending to be data.

**Monospace as a costume for "technical".** Mono is for code, data, measurement, and tabular
alignment. Wearing it to signal engineering culture is a costume.

**Custom mouse cursors.** Outdated, accessibility-hostile, performance-hostile, and broken on touch.

**Everything animates in.** Every element fades with a Y-transform on scroll enter, every hover
glows. Motion mistaken for polish; the visitor waits for the page to finish performing before they
can read it. → Motion communicates state change, directs attention, or expresses character. If it
does none of those, delete it. See `motion.md`.

---

## B. Hero and section furniture

**Floating social-proof pill above the H1**: "Trusted by 10,000+ teams", "AI Powered", "#1
Platform". The page claims credibility before it establishes clarity: the visitor is told who trusts
it before they know what it is. → Say what it does first. Social proof *after* the claim it supports,
with a name attached.

**Stat bar under the CTA**: 99.9% uptime · 500M requests processed · 10x faster workflows. Usually
numbers nobody earned. The design performs authority instead of building it. → If the number is real,
lead with the story and let the metric support it. If it isn't real, delete it. Every fake number on
a page also poisons the true ones next to it.

**Fake dashboard mockup in the hero**: invented charts, meaningless metrics, everything up and to
the right, built out of styled `<div>`s. Prioritizes looking like software over explaining the
software, and it's the single loudest visual tell in current output. → A real screenshot, even an
ugly one, communicates more in two seconds than a beautiful generic mockup does in twenty. Or a real
working mini-version of the UI embedded in the page. Or no preview at all.

**Fake version footers inside fake screenshots**: "v0.6.2-rc.1", "last sync 4s ago · main". Adds
nothing, and doubles down on the mockup tell.

**Version labels as hero eyebrows**: `V0.6`, `BETA`, `EARLY ACCESS`, `INVITE-ONLY PREVIEW`. Only
legitimate when the brief is explicitly about launch status.

**Hero overflow.** Headline wrapping to four, five, six lines because the container is narrow and the
font size was picked before the copy. A 4-line hero headline is a font-size error, never a
copy-length error. → Headline ≤2 lines on desktop, subtext ≤20 words and ≤4 lines, primary action
visible without scrolling. Widen the container (`max-w-5xl`+) and scale the type to fit.

**Hero stack bloat.** Eyebrow *and* headline *and* subtext *and* two CTAs *and* a micro-tagline under
the CTAs *and* a trust strip *and* a pricing teaser. The hero is a single moment, not a feature list.
→ Max four text elements: (eyebrow **or** brand strip **or** neither), headline, subtext, CTAs. Trust
logos, pricing teasers and feature bullets move to dedicated sections directly below.

**Excessive hero top padding.** More than ~6rem at desktop and the content floats halfway down the
viewport, reading as a layout bug rather than intentional space. Need more air? Increase the type or
asset scale, not the padding.

**Two-line navigation at desktop.** If items don't fit at 1024px, condense labels, drop secondary
items, or collapse to a menu. Also: nav bars taller than ~80px eat the viewport for nothing.

**The full default skeleton**, in order: top navbar → centered hero with badge and two CTAs →
dashboard mockup → 3-column feature cards → metrics strip → 3-card pricing → testimonial grid →
footer CTA. Any single element is defensible. All eight in that order is a model completing a
pattern. → Ask what *this* product needs a visitor to understand, in what order. Usually it isn't
eight sections.

**Section-layout repetition.** Eight sections, four of them the same layout family. "Selected
commissions" looks identical to "What we do". → A layout family appears at most once per page. Eight
sections need at least four families.

**Zigzag past two.** Left-image/right-text, then right-image/left-text, then left-image again. The
third consecutive image+text split is where it becomes wallpaper. → Break with a full-width section,
a vertical stack, a bento, a marquee, anything else.

**Bento grids with empty cells.** A grid with a blank tile in the middle or a hole at the end means
the cell count was chosen before the content. → N items → N cells. Reshape the grid; never paste a
blank tile. And bento cells that are all white-on-white text boxes aren't a bento, they're a list with
extra borders: at least two or three cells need real visual variation (image, texture, tinted
ground).

**The split header.** Big left headline, small explainer paragraph floating in the right column with
no alignment to anything. Banned as a default; sections have one focused message. → Stack headline
and body vertically at ≤65ch. Reach for the split only when the right column carries a real visual or
interactive element.

**Marquee inflation.** More than one horizontal scrolling text or logo strip per page reads as
filler. Pick the one section where it serves the content.

**Spec tables with a hairline under every row.** A 10-row list with `border-b` on each row is the
laziest possible layout for a spec sheet. → Group into 2–3 logical clusters with one divider each, or
a card-per-spec grid with the value as display type and a one-line "why it matters", or 3–4 hero
specs plus a disclosure for the rest.

**Long lists as default `<ul>` or `divide-y` rows.** Past ~5 items this stops working. → 2-column
grouped split, card grid with an image per item, tabs or accordion if categorizable, scroll-snap
pills, or a carousel for breadth.

**Scoring bars with filled background tracks** used as comparison visuals on a marketing page.
Dashboard clutter in the wrong context. → A number plus a small icon, or a hairline bar with no
track.

---

## C. Micro-label and ornament tells

This whole cluster is the current fingerprint of "trying to look designed". Individually each is
defensible; the *density* is the tell.

**Eyebrow on every section.** The small uppercase wide-tracking label above every H2,
`text-[11px] uppercase tracking-[0.18em]`. One or two, for orientation, is a system. On all seven,
it's a template slot being filled. → Hard budget: **at most one eyebrow per three sections**, hero
counts as one. Mechanical check: count `uppercase tracking` micro-labels; the count must be
≤ ceil(sections / 3). What to do instead of an eyebrow: nothing. The headline is enough, and the
section's position on the page already categorizes it.

**Section numbers.** `00 / INDEX`, `001 · Capabilities`, `06 · how it works`, `Stage 1 / Stage 2`,
`Phase 01`. Enumerating sections adds no information the reader lacks. → Only when the sequence
itself is the content (a process the user must follow in order). Then use the verb, not the number:
"Install", "Configure", "Ship".

**`01 / 4` pagination stamps** on images and bento tiles. If the user can count, they don't need the
label.

**Scroll cues.** `Scroll`, `↓ scroll`, `Scroll to explore`, animated mouse-wheel icons. If the user
hasn't scrolled yet, they're looking at the hero. They know what scrolling is.

**Decoration text strips at the hero bottom.** `BRAND. MOTION. SPATIAL.`, `TYPE / FORM / MOTION`,
`ESTD. 2018 · LISBON`. Agency-portfolio cliché. → Only when the strip carries real navigable links or
real status.

**Locale, time and weather strips.** "LIS 14:23 · 18°C" in the nav, "1200-690 Lisbon, Portugal" as
atmosphere. → Only for a genuinely distributed studio with timezone-relevant work, a travel brand, or
a real physical venue. A contact address in the footer is fine; ambient locale decoration is not.

**Middle-dot inflation.** `foo · bar · baz · qux` as the default separator for everything. → Ration
it: one per metadata line. Otherwise use line breaks, hairlines, or columns.

**Decorative status dots.** A colored dot before every nav link, list row, or badge. → Zero by
default. Only when the dot conveys real semantic state (live server status, actual availability), and
sparingly.

**Pills and tags overlaid on images.** `Brand · 02`, `PLATE · BRAND`, `Field notes: journal` floating
on a photo. → Let the image speak, or caption it below the frame.

**Fake photo credits.** `Field study no. 12 · Ines Caetano`, `Frame XII · 35mm` under a placeholder
image. Pretentious and false. → Credit only real photographers for real photos; otherwise a plain
functional caption or nothing.

**Version footers on marketing pages.** `v1.4.2`, `Build 0048`. CLI fixtures, not landing-page
content.

**Vertical rotated text.** "INDEX OF WORK, 2018–2026" turned 90°. Agency cliché, unreadable, and it
breaks selection and screen readers. → Only for explicitly experimental briefs where it serves a real
composition.

**Crosshair and hairline grid decoration.** Lines drawn purely to make the page "feel designed". →
Only when they organize real content.

**Micro-meta sentences under eyebrows.** *"Each of these is a feature we ship today, not a roadmap
promise. The list will stay short on purpose."* sitting under a section heading. Eyebrow + headline +
body is already enough.

**Live-stock counters as decoration.** "Reservation 412 of 800". → Only with real data on a real
limited run.

**Em-dash used as an ornament** in eyebrows, pills, button labels and nav items (`Design) Build,
Ship`. This is a *layout* tell (a separator chosen because it looked designed) and worth fixing.
It is **not** the same as em-dashes in prose, which are a locale convention and not evidence of
anything. See J.

---

## D. Copy

Generated microcopy is the strongest signal on the page, because it's polished and says nothing. Full
prose rules live in `human-writing-style`; the frontend-specific ones:

**Interchangeable headlines**: "Transform your workflow", "Reimagine productivity", "Build the
future of X", "Streamline your experience", "The all-in-one platform", "Next generation". Generated
by averaging every headline in the training set, so it fits a CRM, a yoga app and a logistics
platform equally. → Two tests: swap in a competitor's logo, does the sentence still work? Then the
ten-word test: can a reader say what this does after the hero alone? Compare "We help dentists fill
cancellation slots within 4 hours" against "Reimagine your practice".

**Domain-adjacent but empty.** "Stay audit-ready. Always." for a security product: relevant, on
topic, contentless. Written by something that has read *about* the industry without ever working in
it. → Copy that names actual user problems, business context, domain terminology, real constraints.

**Hedging and generic superlatives.** "may help you", "can potentially", "best-in-class",
"cutting-edge", "seamless", "leverage", "unlock", "elevate", "unleash", "revolutionize", "delve". →
Commit to the claim or drop it.

**Performative-craftsman labels.** "From the field", "Field notes", "Currently on the bench", "On our
desks", "Quietly in use at", "We respect the French ones". Reads as an LLM performing thoughtfulness.
→ Plain functional labels ("Testimonials", "Latest writing", "Now working on") or no label.

**CTA reassurance strip**: "Free · No credit card required · Takes 60 seconds" under every button.
Fine once, under the actual signup. Under all four CTAs it's furniture.

**Duplicate CTA intent.** "Get in touch" in the nav, "Let's talk" in the hero, "Start a project" mid-
page, "Reach out" in the footer. Four labels, one intent. → One label per intent, used everywhere.

**CTA labels that wrap.** A primary button whose text breaks to two lines at desktop is broken. →
Shorten to 1–3 words, or widen the button. Don't constrain a CTA's max-width.

**Grammatically broken cleverness.** "free on its past", "two plans but one is honest", forced
metaphors that don't track, cute-but-wrong wordplay. → Before shipping, re-read *every visible
string*, headlines, subheads, labels, buttons, captions, alt text, footer, error messages: and
replace anything with an unclear referent or broken grammar with a plain functional sentence. Boring
copy beats clever-and-wrong.

**Tone that doesn't belong to anybody.** No opinion, no perspective, no evidence anyone has ever done
the thing. → Write it as a specific named human. "Would the founder say this out loud?" If no,
rewrite until yes.

**Mixed copy registers.** Technical mono metadata ("47 tasks · 0.6 ctx-switches/day"), editorial
prose, and marketing punch in the same composition. → One register per page unless the brand voice
genuinely spans them.

---

## E. Current Claude fingerprints

*July 2026. These rotate faster than anything else in this file: verify before relying on them.*

- Eyebrow text above every section heading.
- "Free (no credit card required) 60 seconds" under the CTA.
- Section numbering (`01 / 02 / 03`) as structural decoration.
- Serif display face everywhere; dark mode by default with no light mode.
- Warm cream ground + high-contrast serif + terracotta accent for any subject that sounds "warm,
  bookish, family, or child-facing": even when the brief never asked for it.
- `{/* Hero Section */}` / `<!-- Header Section -->` structural comments left in the markup.
- A new page generated in the same session that never gets linked from the existing nav.

If you are generating with Claude, assume these are in the output and remove them explicitly.
Prompting "don't make it look AI-generated" does not remove them: it produces over-correction. Name
the decisions instead.

---

## F. Code artifacts

Cheapest to fix, most damning when found. All of these say the output was never opened.

- **Structural label comments**: `<!-- Hero Section -->`, `{/* Features */}`. Nobody writing a page
  by hand narrates their own sections to themselves.
- **One 2000-line file** with inline `<style>` and `<script>`: or its React equivalent, one
  component holding the entire page.
- **`console.log` and TODOs left in.** Also `lorem`, `placeholder`, `example.com`, `Your Company`.
- **API keys in the frontend.** It happens. Check.
- **Dead links and no-op buttons**: `href="#"`, handlers that don't exist.
- **Shell defaults**: no favicon, `<title>My App</title>`, no meta description, no OG image.
- **`contact@gmail.com`** in the footer of a company site instead of a domain address.
- **Scaffolded primitives with shallow state**: the library was generated and never adapted: props
  that aren't used, state lifted nowhere, every component re-fetching independently.
- **Imports for packages that aren't in `package.json`.** Check before importing, always.
- **`h-screen` on a full-height hero** instead of `min-h-[100dvh]`: jumps on iOS Safari when the
  address bar collapses.
- **Complex flexbox percentage math** (`w-[calc(33%-1rem)]`) where a grid was the answer.
- **`z-50` sprayed everywhere** instead of a documented layer scale.
- **`window.addEventListener('scroll')`** driving React state. Fires every frame, re-renders the tree,
  collapses on mobile. See `motion.md`.
- **Mobile "supported" but never opened.** Overflow, tap targets, modals taller than the viewport.

---

## G. State and edge-case gaps

The loudest category, because it's the one that proves nobody used the thing. Weight heavily.

- **No empty state.** The list renders three perfect demo rows and nothing else was considered.
- **No loading state**, or a generic spinner where a skeleton matching the final layout belonged.
- **No error state.** The happy path is the only path.
- **No zero-results state** distinct from the empty state: "no matches for this filter" is a
  different message from "you haven't added anything yet".
- **No long-content case.** A 60-character name breaks the card. A German translation overflows the
  button.
- **No one-item and no 500-item case.** Grids that need three cells to look right, lists with no
  virtualization.
- **No permission-denied state**, no offline state, no rate-limited state.
- **Forms that lose input on error.** The most user-hostile default in existence.
- **Placeholder used as label.** The label vanishes the moment the user types.
- **No focus indicator**, or a focus ring that's invisible against the surface.

Full treatment in `production.md`.

---

## H. System and flow

Generated output is good at screens and bad at systems. These are expensive to fake, don't rotate
with fashion, and survive every restyle.

- **Screens fine, flow broken.** Each page works alone; joined together they contradict each other. A
  new page isn't reachable from the nav. Back dead-ends. Signup goes to a route that doesn't exist.
- **Inconsistent interaction patterns.** Modal here, drawer there, inline edit on the third screen,
  same job, three answers, because each screen was generated in isolation.
- **Modals that block the thing they describe.** Popups over the content they're about. And modals
  reached for by reflex where the task needs neither interruption nor protected focus.
- **Navigation that looks right and breaks usability**: beautiful nav, wrong information
  architecture, because the structure was pattern-matched from other sites rather than derived from
  this product's content.
- **Theme flips mid-page.** A warm-paper section sandwiched between two dark sections. The visitor
  feels they walked into a different website. → One theme per page. Section-level tint within the
  same family is fine; inversion is not.
- **Accent color drifts.** A warm-grey site with a blue CTA in section 7. A rose-accented page with a
  teal status badge in the footer. → Lock the accent, audit every component.
- **Radius system drifts.** Pill buttons in a square layout, square cards on a pill-button page. →
  Pick one radius system, or a documented rule (buttons pill, cards 16px, inputs 8px) applied
  everywhere.
- **No edge affordances.** Buttons with no logical next step. Filters that can produce an empty list
  the page can't render.

---

## I. Content and data

- **Generic names.** "John Doe", "Jane Smith", "Sarah Chan". → Realistic, locale-appropriate,
  specific.
- **Startup-slop brand names.** "Acme", "Nexus", "SmartFlow", "Cloudly", "Zenith". → Invent names
  that sound like they have a registrar entry.
- **Generic avatars.** SVG eggs, a user icon from the icon set. → Believable portraits, or initials
  with real styling, or nothing.
- **Fake-perfect numbers.** `99.99%`, `50%`, `1,000,000`, `10x`. Reality is messy: `47.2%`, `1,284`.
- **Fake-precise spec numbers.** `5.8 mm`, `13.4 lb`, `4.1×` invented to perform engineering rigor. →
  Real data, or explicitly labeled as illustrative, or gone.
- **Vague testimonials.** No face, no full name, no company, no specific claim. → Real, with
  attribution (name + role + company), or gone.
- **Six-line testimonial quotes.** A landing-page quote is a snippet. → ≤3 lines; cut the original.
- **Logo walls of text wordmarks.** `<span>Acme Co</span>` in a row. → Real SVG logos, or a designed
  monogram for invented brands. And logo walls carry logos *only*: no "Vercel / hosting" category
  labels underneath; the logo is the credibility.
- **Broken image links.** Dead Unsplash URLs are the classic. Verify every asset URL resolves.
- **Text-only "minimalism".** A page with no images isn't minimal, it's incomplete. Even a restrained
  editorial page needs two or three real images.

Full treatment in `content.md`.

---

## J. Not tells

Called out constantly, weak or wrong. Don't strip these, and don't cite them as evidence: doing so
is how you end up with the 1998-looking overcorrection.

- **Purple, or a gradient, on its own.** Stripe: the reference every one of these articles reaches
  for: runs indigo `#533afd` with a gradient mesh across its marketing pages, deliberately, since
  2019. That's *why* the pattern is in the training data. The tell is purple-blue arrived at by
  default, on a product with no reason to be purple. Purple chosen on purpose is just a color.
- **Centered hero.** People built these for years before models existed. It's centered because it
  works. Editorial, manifesto and launch-announcement pages are *better* centered.
- **Cards.** For a set of parallel items (services, plans, features) cards are the correct answer.
  The tell is *only* cards, everywhere, for everything.
- **Rounded corners.** Not evidence of anything. Uniform 16px on every element regardless of role is.
- **Dark mode.** A choice, and often the right one for a developer product or a night-shift tool.
  Dark-by-default with no alternative and no reason is the actual tell.
- **Tailwind + shadcn.** A stack, not a verdict. Untouched shadcn defaults are the tell; the library
  isn't.
- **Em dashes in prose.** The prose panic doesn't transfer, and the "spaced en dash vs unspaced em
  dash" argument is a locale convention (UK vs US), not a detector. Some skills in circulation
  demand *zero* em-dashes anywhere on the page; that's over-reach, and it produces stilted copy.
  The real, narrower tell is the em-dash used as an *ornament* in labels and pills: see C.
  `human-writing-style` owns the prose side.
- **System fonts.** `system-ui` on an Operate or Read surface is a deliberate, defensible, often
  optimal choice: it ships optical sizing and legibility tuning you can't match, and it costs zero
  bytes.
- **Clean, professional, conventional.** "Devoid of life" is a real observation about slop, but
  competent restraint looks the same from a distance. The question is whether the page says anything
  specific, not whether it's quiet.
- **Source-code structure.** "Inspect the HTML and you'll see AI patterns": largely false. Build
  output from any framework or site builder is uniform by construction. The *content* of the markup
  (labels, dead links, leftovers in F) tells you something; its shape doesn't.
- **"AI images are too perfect."** Was never reliable and is now wrong. Judge the image on whether it
  shows the real thing, not on whether you can find an artifact.
- **Detector scores.** For prose, one weak input with a real false-positive rate, sold by companies
  whose product is detection. For design, no such tool exists at all.
- **"It looks better than the human one."** Sometimes true. Fine. The goal is a page that says
  something specific about this product, not a page that passes a vibe check performed by a stranger.
