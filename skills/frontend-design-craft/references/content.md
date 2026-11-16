# Content

Copy, imagery, icons, demo data and social proof. **Specificity is the one thing a model can't
average its way to**, which makes content the highest-leverage differentiator on the page and the
first place a generated design gives itself away.

Layer `human-writing-style` for anything longer than a label.

**Contents**

- 1. Content is design material
- 2. UX copy by function
- 3. Marketing copy
- 4. The copy self-audit
- 5. Imagery
- 6. Icons
- 7. Demo and illustrative data
- 8. Social proof
- 9. Verify

---

## 1. Content is design material

Great surfaces live on carefully made content: names, entries, copy, covers, thumbnails, textures.
Designing around lorem ipsum and filling it later produces layouts that break the moment real content
arrives: because the layout was fitted to fake content's shape.

**Author the content at production fidelity, then label what's synthetic.**

- In greenfield work, every blank the brief left open is yours to author well.
- **Label synthetic material** anywhere a visitor could mistake it for real, and hand the user a
  replacement list.
- **What stays uninventable**: prices, customer names, benchmarks, certifications, capabilities the
  product doesn't have, endpoints, legal claims. These ship as clearly marked placeholders on the
  replacement list.

Refusing a strong direction because its demonstration data doesn't exist yet is timidity wearing
honesty's clothes. Inventing a customer logo is fraud. The line is between *demonstration* and
*claim*.

---

## 2. UX copy by function

**Actions and navigation.** A specific verb and object when the outcome isn't already obvious. Labels
describe *what will happen*, not the gesture that triggers it. The same noun and verb for the same
concept everywhere in the product: "Delete" in one place and "Remove" in another means the user has
to wonder whether they do the same thing.

**Nav labels: direct and specific beats safe and generic.** "Progress", "Library" beat "Home",
"More". Specificity creates predictability, and predictability is what lets people navigate without
reading.

**Confirmations.** Name the action on both the message and the button. Never `Yes` / `No` / `OK` /
`Submit`. "Delete 12 invoices" is a button label; "Confirm" is a shrug.

**Errors.** What failed → why (when known and useful) → how to recover. Plain language. No error
codes as the primary message. See `production.md` §2.

**Empty states.** Distinguish first use, no results, filtered to nothing, no permission, and failure.
Each gets a different sentence and a different next action.

**Loading.** Name the real operation. "Importing 1,248 rows" beats "Loading…".

**Helper text** answers an implicit question instead of restating the control. If the label already
says it, delete the helper text.

**Link text must make sense out of context.** Screen readers list links independently; "click here"
× 14 is a maze.

**Say each idea once.** If the heading already explains the state, the introduction adds new
information or disappears. Redundant copy (header restating the intro restating the body) is one of
the most reliable generated-output patterns.

**Voice stays consistent; tone adapts to the moment.** Warmth is welcome in an error message; jokes
are not, when the subject is money, privacy, deletion, access loss, or blocked work.

**Don't vary words for literary effect in an interface.** Prose rewards synonyms; UI punishes them.

---

## 3. Marketing copy

**The two tests, in order:**

1. **Logo swap.** Put a competitor's name on the page. Does the headline still work? If yes, the
   headline says nothing.
2. **Ten words.** After reading only the hero, can someone say what this does in ten words?

"We help dentists fill cancellation slots within 4 hours" against "Reimagine your practice": the
difference is not tone, it's information.

**Prove, don't claim.** Show the subject doing its job: the interface at work, the mechanism
dramatized, specifics a competitor couldn't copy-paste. Sections that restate a claim in different
words add length, not substance. Three sections saying "it's fast" is one section's worth of content
stretched over a scroll.

**Ban list**, because these appear in generated copy at a rate nothing else matches:

> elevate · seamless · unleash · unlock · leverage · revolutionize · next-gen · cutting-edge ·
> best-in-class · game-changing · transform your workflow · reimagine · streamline · delve ·
> "we're not just X, we're Y" · "it's that simple"

**One register per page.** Technical mono metadata, editorial prose, and marketing punch in the same
composition read as three writers who never met: unless the brand voice genuinely spans them.

**Numbers.** Every number on the page is either real, or explicitly illustrative, or deleted. There
is no fourth option. An unearned stat performs authority instead of building it, and it poisons the
true numbers next to it.

Fake-perfect numbers to avoid: `99.99%`, `50%`, `10x`, `1,000,000`. Real numbers are messy: `47.2%`,
`1,284`, `3.4×`. And don't fake engineering precision (`5.8 mm`, `13.4 lb`) the brand doesn't claim.

---

## 4. The copy self-audit

Before declaring anything done, re-read **every visible string**: headlines, subheads, eyebrows,
button labels, body copy, captions, alt text, footer text, error messages, empty states, tooltips.

Flag and rewrite anything that is:

- **Grammatically broken**: the cute phrase that doesn't parse ("free on its past").
- **Missing a referent**: "we plan to stay that way" with no prior context.
- **Cute-but-wrong**: forced metaphors that don't track, wordplay that doesn't land.
- **Performing thoughtfulness**: passive-aggressive humility, fake-craftsman labels, mock-poetic
  micro-meta ("Loose plates", "On our desks", "an elegant nothing").
- **Duplicated intent**: four labels for one action.

**If unsure whether a string makes sense, replace it with a plain functional sentence.** Boring copy
beats clever-and-wrong, every time, and clever-and-wrong is the specific failure mode of generated
microcopy.

---

## 5. Imagery

**Priority order for visual assets:**

1. **Real assets.** Actual screenshots, actual photos of the actual thing, brand photography. One
   decisive real photo beats five mediocre ones.
2. **Generated imagery**, when an image-generation tool is available. Generate at the right aspect
   ratio for the placement, at the scale the composition needs: a viewport that wants atmosphere
   gets a full-bleed layered scene, not a small centered subject standardized for tidiness.
3. **Labeled placeholders**, when neither is possible. `https://picsum.photos/seed/{descriptive-seed}/{w}/{h}`
   with a seed that describes the section, or an explicit slot comment
   (`<!-- TODO: hero product photo, 1600×1200 -->`) plus a list handed to the user at the end:
   *"This page needs real images at: […]"*.

**What not to do instead:**

- **Div-based fake screenshots are banned.** A hand-built product preview made of styled rectangles,
  fake task lists, fake dashboards, fake terminals: is the single loudest visual tell in current
  output. Use a real screenshot, a generated image, a real embedded mini-version of the UI, or no
  preview at all.
- **Hand-rolled decorative SVG** (custom illustrations, invented marks, sketch scenes) is strongly
  discouraged. Acceptable only when the brief asks for it, or it's a single simple geometric mark.
- **A pure-text page is not minimalism, it's incomplete work.** Even a restrained editorial page needs
  two or three real images. Generate restrained black-and-white photography rather than skipping
  images because the aesthetic is quiet.
- **Gradients, glass and generic icon tiles where an authored asset belongs** are the gap wearing
  chrome.

**Handling:**

- Explicit dimensions or `aspect-ratio` on everything, always. Unsized images are the top CLS cause.
- Responsive sources, modern formats, lazy-load below the fold, never lazy-load the LCP image.
- Alt text carries the information; `alt=""` for decorative.
- Dark-mode variants or a treatment for anything with a baked background.
- **Verify every asset URL resolves.** Dead image links are the most embarrassing shipped defect
  there is.
- Apply treatments (grayscale, duotone, controlled contrast, grain overlay at 3–5%) so stock
  photography reads as *this brand's* imagery rather than stock.

---

## 6. Icons

- **One family per project.** Never mix two icon sets in one tree: the optical weights never match
  and it's visible even to people who can't name why.
- **Standardize stroke width globally** (1.5 or 2.0).
- **Never hand-roll SVG paths** to fill a gap. Install a second library, or compose from primitives.
- Optically align icons to the text baseline, not mathematically to the line box.
- **Emoji are not icons.** They render differently on every platform, they carry no consistent
  weight, and they're announced verbosely by screen readers. Allowed only when the brief explicitly
  wants a playful, chat-native or social tone: and then sparingly.
- Icon-only controls need accessible names and, in most cases, visible labels. Icon-only navigation
  is a recognized usability failure, not a minimalism win.

---

## 7. Demo and illustrative data

Demo data is design material: author it as carefully as the copy.

- **Names**: realistic and locale-appropriate. Not "John Doe", "Jane Smith", "Sarah Chan".
- **Companies**: names that sound like they'd survive a trademark search. Not "Acme", "Nexus",
  "SmartFlow", "Cloudly", "Zenith".
- **Numbers**: organic, not round. `47.2%`, `1,284`, `+1 (312) 847-1928`.
- **Avatars**: believable, consistent in treatment. Not SVG eggs, not the icon set's user glyph.
- **Content that reveals the product's actual shape.** A project-management demo whose tasks are
  "Task 1, Task 2, Task 3" teaches nothing. Tasks that look like real work teach what the product is
  for: and that's the demo doing its job.
- **Include the awkward cases in the demo data**: one long name, one item with no description, one
  overdue thing. It proves the design handles reality, and it's the fastest way to find out that it
  doesn't.

Label the whole set as illustrative wherever a visitor might read it as real.

---

## 8. Social proof

- **Logo walls carry logos only.** No "Vercel / hosting", "Stripe / payments" category labels
  underneath: the logo *is* the credibility, and the label adds nothing the viewer doesn't know.
- **Real SVG logos**, not text wordmarks in a row. Simple Icons (`cdn.simpleicons.org/{slug}/{color}`)
  covers most known brands; devicon covers tech stacks. For an invented brand, design a simple
  monogram rather than setting the name in a `<span>`.
- Ensure logos work in both themes: single-color variants or theme-aware fill.
- **The logo wall lives below the hero**, never inside it.
- **Testimonials need attribution**: name + role + company. Name alone ("Sarah") is worthless.
- **≤3 lines of quote body.** A landing-page quote is a snippet, not the full review; cut the
  original. Use real typographic quotes or none: not straight ASCII.
- **Never invent a customer, a quote, or a logo.** This is the hard line. Illustrative *data* is
  fine; an illustrative *customer* is a false claim.
- Vague testimonials with no face, no company and no specific claim are worse than none: they
  signal that the real ones don't exist.

---

## 9. Verify

- Every visible string re-read; nothing broken, cute-but-wrong, or duplicated in intent.
- Logo-swap test and ten-word test both pass.
- Every number is real or explicitly illustrative.
- No invented customers, quotes, benchmarks, prices or capabilities.
- Real or generated imagery in every slot; no div-mockups; every URL resolves; every image sized.
- One icon family, one stroke weight, no hand-rolled paths, no emoji standing in for icons.
- Demo data includes at least one awkward case.
- The replacement list for synthetic content has been handed to the user.
