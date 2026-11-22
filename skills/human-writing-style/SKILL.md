---
name: human-writing-style
description: >
  Use whenever the user asks to write, rewrite, edit, or improve any text (articles, essays, blog
  posts, reports, wiki entries, social posts, emails, any prose) and wants it to read as natural human
  writing, not default LLM output. Triggers: "make this sound human", "rewrite this more naturally",
  "so it doesn't sound like AI", "avoid AI tells / clichés", "less robotic", or any original writing
  where quality matters. Also trigger to judge whether text is AI-generated ("is this AI?", "does this
  read as AI"); see the detection section. Also trigger for any language other than English; the
  structural patterns carry across languages. Finally, trigger for the user's own voice ("in my
  voice/style", "wie ich schreiben würde", "schreib das für mich", "sound like me") and before
  drafting any first-person message, email, chat, post, or doc on their behalf: apply the
  personal-voice overlay from `private/` on top of the baseline, if it exists.
---

# Human writing style

Most "AI tells" are symptoms, not the disease. The two things that actually make writing read as
machine-made are (1) no concrete specifics and (2) no visible thinking: sentences that sound fine
but carry no information and don't follow from each other. Fix those and the surface tells mostly
disappear on their own. Swap the flagged words without fixing the substance and the text still reads
as AI to anyone reading for content, and you add new artifacts on top.

The Wikipedia "Signs of AI writing" guide (the source most of these rules come from) says this
directly: the patterns are *observations, not rules*, and treating the signs as the problem "could
just make detection harder." So this skill is not a checklist for evading detectors. It is a guide to
writing with enough substance and specificity that there is nothing to detect.

There are two ways to fail:

- **Under-correction**: leaving the standard patterns in: fake significance, weasel attribution,
  challenge-and-outlook filler, hedged non-answers, tourism-brochure adjectives.
- **Over-correction**: stripping every em dash, chopping every sentence into fragments, and larding
  in performative opinions ("honestly, I don't know how to feel about this") to seem human. This is
  its own tell, and it ruins anything that needs a neutral register: documentation, reference
  writing, technical prose. The "Humanizer" plug-in that told Claude to "have opinions, react to
  facts" is the canonical over-correction: fine for a personal essay, actively wrong for a spec.

Aim for the middle: prose that says something true and specific in an unforced voice.

## Before you start: whose voice?

Decide this first, because it changes which rules win:

- **Neutral, or someone else's, or an institution's** (an encyclopedia article, a company blog, a
  generic essay) → apply the baseline only: Steps 1–6, plus the detection section when judging text.
- **The user's own voice** (their chats, replies, emails, posts, project docs, anything sent as
  themselves) → the baseline substance rules in Steps 2–3 still apply, *and* you layer the personal
  overlay from `private/` on top, if it exists (see "Personal voice" below). Where the overlay and the
  baseline disagree, the overlay wins, because it is this specific author's fingerprint.

If you're unsure which mode applies, look at who the text is *from*. First-person writing the user
will send as themselves is personal-voice. Third-party or neutral deliverables are baseline-only.

## Step 1: Language

Write in whatever language the user specifies or is already using. Every rule below is
language-independent. The overused vocabulary differs by language (see `references/vocabulary.md`),
but the structural patterns (importance-signalling, participial significance tags,
challenge-outlook endings, over-attribution) appear the same way everywhere. One extra check for
non-English: many models default to American English and to a formal register regardless of prompt,
so match the variety and register the topic and author actually call for.

## Step 2: The reliable fixes

These patterns are strongly tied to LLM output and almost never to careful human writing. Cutting
them makes the text better *and* removes genuine tells. Full detail with examples in
`references/patterns.md`.

- **Cut significance tags.** The `-ing` phrase glued to the end of a sentence to claim the fact
  matters ("...completed in 1923, cementing the city's role as a regional hub"). End at the fact. If
  the significance is real and sourced, argue it separately.
- **Cut the challenge-and-outlook paragraph.** "Despite its strengths, X faces challenges... with
  ongoing initiatives, X continues to thrive." Either write real analysis with specifics and sources,
  or delete it.
- **Name your authority.** Replace "experts argue / observers note / several studies suggest (then
  one citation)" with the actual person, study, or number, or cut the claim.
- **Don't assert notability, show it.** "Has been featured in national and regional outlets" /
  "maintains an active social media presence" says nothing. Summarize what the sources *said*. This
  over-attribution cluster is the freshest tell in newer models, so watch for it closely.
- **Don't fill knowledge gaps with invention.** "While specifics are not well documented, X likely..."
  / "keeps personal details private" is speculation dressed as fact. If information is missing, say so
  or omit the section.
- **Prefer plain copulas.** "serves as a / stands as a / marks a / represents a" where the meaning is
  just "is a." Not an absolute ("serves as" is sometimes exactly right), but the reflexive swap away
  from "is" is a strong marker.
- **Be specific instead of promotional.** Replace "nestled in the breathtaking highlands, offering a
  vibrant cultural scene" with the actual streets, buildings, numbers, events. Let the reader draw the
  conclusion.

## Step 3: The substance pass

This is the part that separates human writing from de-clichéd AI writing, and it is what most
"humanizer" advice ignores. Read the draft for *content*, not cadence, and check:

- **Every sentence carries information.** If a sentence would be true of almost any subject after a
  one-word swap, it is filler. Cut or replace it with something only true of this subject.
- **Sentences connect by logic, not just topic.** AI text drifts: the second half of a sentence
  doesn't follow from the first, or a paragraph lists related facts with no argument linking them.
  Make each sentence earn its place from the one before.
- **The specifics are real and checkable.** Names, dates, numbers, and especially sources. A citation
  that doesn't exist, resolves to an unrelated paper, has an ISBN that fails its checksum, or cites a
  real book with no page number is worse than no citation. If you can't verify a specific, don't
  invent it.
- **No point is restated as if it were new.** LLMs circle back and re-explain. Say it once.
- **Nothing was added just to reach three.** Two examples are fine. If the third item in a list isn't
  actually true (the app that "saves time and reduces paperwork errors" when it has nothing to do with
  paperwork), delete it.
- **The emotional or narrative beat lands where a human would put it.** In personal or narrative
  writing, AI puts the "and then I lost it" moment in the wrong place, describes shock with clichés
  ("time seemed to freeze") instead of specifics, and resolves things too neatly. Real accounts are
  messier and more concrete.

The test from an editor who works on this daily: genuinely AI-generated prose is hard to edit because
"every element is equally off": tone, word choice, structure, and facts are all slightly wrong at
once, so there's nothing to leave intact. If your draft feels like that, don't polish it; rewrite it
with real content.

## Step 4: Weak signals: leave them alone

These get called "AI tells" constantly, but skilled writers, non-native speakers, neurodivergent
writers, and anyone typing on iOS or macOS trigger all of them. Do not mechanically strip them, and
do not treat their presence as evidence of AI:

- **Em dashes.** Humans use them heavily; LLMs learned them *from* human writing. Removing every one
  makes prose worse. Just avoid the formulaic spaced-em-dash-per-clause rhythm, and don't add them
  where a comma or colon is cleaner. *Exception:* if the personal overlay forbids dashes, follow it and restructure the sentence.
  That is a stylistic choice, not an AI-tell claim.
- **Curly quotes and apostrophes.** Word, macOS, iOS, and most CMSes produce these automatically.
  Match the target platform; their presence proves nothing.
- **Perfect grammar, formal register, semicolons, Oxford commas.** Signs of a careful writer, not a
  machine. Keep them where they fit.
- **Bullet lists and "not X, but Y".** Common in human writing too. Overused reflexively they read as
  AI; used once where they fit, they're fine.
- **Transition words** ("additionally", "moreover", "notably"). Only a handful are AI-overused, and
  only when clustered and sentence-initial. One is nothing.

Removing these produces the over-corrected, choppy, opinion-larded voice that is itself detectable.
The goal is natural prose, not the absence of punctuation. Note too that some newer models now
*suppress* em dashes on purpose, so their absence is not evidence of human authorship either.

## Step 5: Format and markup

Distinguish real artifacts from cosmetics.

Fix (these are near-proof of unedited LLM output):

- Markdown bleeding into a wiki or plain-text target: `**bold**`, `## headings`, `- ` bullets, `---`
  thematic breaks, fenced ```` ```wikitext ```` blocks.
- Leftover machine strings: `utm_source=chatgpt.com`, `referrer=grok.com`, `turn0search0`,
  `:contentReference[oaicite:0]`, `oai_citation`, `【85†L261-269】`, `[cite: 3]`, `grok_render_citation_card`.
- Placeholder text nobody filled in: "[Your Name]", "[Describe the section here]",
  `access-date=2025-XX-XX`, `INSERT_SOURCE_URL`.
- Title-case section headings where sentence case is the house style; inline-header bullet lists
  ("• **Durability:** ...").

Leave alone: em dashes, curly quotes, semicolons, and formatting that a normal careful writer would
produce on the target platform.

## Step 6: Self-check before delivering

Run one pass and fix any of these:

1. A significance `-ing` tag, a challenge-outlook ending, or a notability/over-attribution sentence.
2. Vague authority ("experts", "studies") instead of a named source.
3. A knowledge-gap hedge presenting speculation as fact.
4. A sentence that would survive a subject swap, i.e. carries no specific information.
5. A restated point, or a list item added only to reach three.
6. A dense cluster of vocabulary from `references/vocabulary.md` (one word is fine; a pile is a tell).
7. Markdown or machine artifacts in a target that shouldn't have them.
8. Over-correction: fragment-only rhythm, zero em dashes plus inserted "I feel like..." opinions in
   writing that should be neutral.
9. Personal-voice mode only: anything the private overlay forbids. Run its checklist.

## Personal voice

Optional overlay for text the user sends as themselves. It lives in `private/` next to this file and is
not part of the public repo. If `private/overlay.md` exists, read it and the files it names before
drafting in the user's voice. The overlay wins wherever it touches the same rule as the baseline. If
`private/` is missing, apply the baseline only.

## Detecting AI writing

When the user wants a judgment on whether text is AI-generated, be honest about what does and doesn't
work. The short version: you cannot prove it from style, and confident accusations based on style
harm real people, disproportionately non-native English speakers and neurodivergent writers.

**Detectors don't work.** GPTZero, Turnitin's AI checker, Winston, and similar tools have high error
rates. Turnitin itself admits a false-positive floor; detectors have flagged the US Constitution and
passages of the Bible as AI; false-positive rates for non-native English writers run as high as ~70%.
A high "percent AI" score is not evidence. Never accuse anyone on the strength of a detector.

**Humans are near chance, too, unless they're heavy LLM users.** People who use LLMs constantly reach
roughly 90% accuracy on flagged articles, which still means about one in ten of their accusations is
a false positive. Casual readers do barely better than a coin flip in both directions. So calibrate
your confidence down, and hedge.

**Surface features are weak priors at best.** Em dashes, curly quotes, formal tone, bullet lists,
"not X but Y", perfect grammar (everything in Step 4) produce false positives. They mean essentially
nothing on their own.

What actually carries signal, roughly in order:

1. **Baseline mismatch.** If you know the writer's earlier work, the strongest single signal is a
   sudden jump in polish, a shift to a different English variety that doesn't match them (US spelling
   from a consistent UK writer, or vice versa), or vocabulary and structure they've never used.
   Anything written before ChatGPT's launch (Nov 30, 2022) cannot be AI.
2. **Broken or fake sourcing.** Citations that don't resolve, DOIs pointing to unrelated papers,
   ISBNs that fail checksum, links that 404 and were never archived, real sources cited for claims
   they don't support, book cites with no page number. This is the substance pass from the writer's
   side, run in reverse.
3. **Incoherent content.** Read for meaning. Uniform paragraph length, the same point restated,
   sentence halves that don't connect, rule-of-three items that aren't true, and emotional beats in
   the wrong place are all more reliable than any single word choice.
4. **Leftover machine artifacts.** The Step 5 strings (`utm_source=chatgpt.com`, `turn0search0`,
   `oai_citation`, placeholder text, pre-declined submission templates, "Sure, here's the article!"
   preambles) are close to proof.
5. **Ask the writer.** Someone who can explain their editorial choices, walk through a source, or
   account for an odd link as an ordinary typo is showing human authorship. Someone who can't explain
   their own argument is telling you something.

Give a calibrated read ("several substance-level signals, but I can't be certain"), not a verdict.
State which signals you're relying on. If the only signals are surface features, say the text is
consistent with AI but that this isn't evidence.

## Notes by content type

**Wikipedia / encyclopedic.** Extra caution on notability, significance, and attribution; every claim
needs a source or should be cut; lead sentences use plain "is". Markdown, hallucinated categories or
templates, and machine citation artifacts are the highest-value tells here.

**Journalism / blog.** Opinions are allowed but must be argued, not asserted through vague authority.
Personal voice is good; corporate puffery is not. This is the one register where mild Step-4 devices
(an em dash, a first-person reaction) are welcome rather than suspect.

**Academic.** Formal register is fine; the vocabulary list still applies, because those words are
overused in academic AI output specifically. Sourcing rigor is the real defense.

**Technical / reference / documentation.** Do *not* apply the "have opinions, be casual" advice here.
Precision and a neutral voice are the point. The only relevant fixes are cutting filler and fake
significance; leave the register formal.

**Creative / narrative.** Structural rules still apply (no fake profundity, no challenge-outlook
endings), and the substance pass matters most: clichéd emotion and beats in the wrong place are the
giveaway. The vocabulary list is a guide here, not a hard constraint.
