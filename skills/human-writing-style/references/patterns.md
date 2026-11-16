# Structural patterns reference

Each pattern is tagged by how reliably it indicates AI, so you know which to treat as hard fixes and
which are only weak priors. "Reliable" = strongly tied to LLM output, rare in careful human writing.
"Weak" = common in human writing too; fix only when reflexive/clustered, never treat as proof.

---

## A. Reliable structural tells — fix these

### A1. The significance tag  (reliable)

A participial phrase at the end of a sentence whose only job is to claim the preceding fact matters.

- "The bridge was completed in 1923, cementing the city's role as a regional hub."
- "The act was passed in 1964, marking a pivotal shift in the nation's approach to civil rights."
- "Population reached 56,000, creating a lively community within its borders."

Fix: end the sentence at the fact. If the significance is real and sourced, argue it in a separate
sentence with evidence.

### A2. The challenge-and-outlook paragraph  (reliable)

Formulaic section ending: acknowledge strengths, name vague challenges, gesture at a hopeful future.
Often literally headed "Challenges" or "Future Prospects."

- "Despite its industrial prosperity, X faces challenges typical of urban areas, including traffic
  congestion and rising costs. With its strategic location and ongoing initiatives, X continues to
  thrive as it navigates these issues toward a sustainable future."

Fix: write real analysis with specifics and sources, or cut it. "Faces challenges" with no concrete
content is filler. This is about the rigid formula, not the mention of a challenge.

### A3. Vague authority attribution  (reliable)

Attributing a claim to an unnamed group to make it sound authoritative — or citing one source while
implying many.

- "Experts argue that..." / "Observers have noted..." / "Industry reports suggest..."
- "Several studies indicate..." (then one study) / "Reviewers praised..." (then one reviewer)

Fix: name the expert, cite the study with author and year, or cut the attribution and state the claim
with an inline citation. Newer models attach these to *named* sources that don't actually support the
claim ("Roger Ebert highlighted the lasting influence") — so verify the source says what's claimed.

### A4. Notability / over-attribution  (reliable — the current-era tell)

Telling the reader the subject is notable instead of demonstrating it. This is the strongest marker
in 2025-and-later output.

- "The festival has received coverage from national and regional media outlets."
- "She maintains an active social media presence with a growing following."
- "Profiled in trade publications and widely-read outlets, meeting significant, substantial coverage."
- Whole sections or bullet lists cataloguing where a subject has been covered and what kind of outlet
  each is.

Fix: summarize what those sources *said*. The fact of coverage is not content. On Wikipedia especially,
watch for body text that echoes the wording of the notability guidelines ("independent coverage",
"significant coverage").

### A5. The knowledge-gap hedge  (reliable)

Speculating about absent information and presenting the speculation as content.

- "While specific details about X are not well documented in available sources, X likely..."
- "Though information is limited, the region probably supported..."
- "[Person] keeps personal details private, choosing to focus on professional work."

Fix: if information is absent, say "No data is available" or omit the section. The claim that something
is "not documented" is itself usually unverified. Don't fill the gap with plausible invention.

### A6. Promotional / brochure register  (reliable in neutral writing)

Tourism-guide or press-release tone sneaking into writing that should be neutral.

- "Nestled in the breathtaking highlands, the town offers visitors a fascinating glimpse into..."
- "The company's commitment to excellence is evident in every product it delivers."
- "With its vibrant cultural scene and natural beauty, X captivates residents and visitors alike."

Fix: describe what is actually there — specific streets, buildings, products, events — and let the
reader draw the conclusion. Note that older models were blatantly superlative ("the best"); newer ones
are subtly positive, so the tell is softer now but still present.

### A7. "Serves as" and friends  (reliable as a reflex, not absolute)

Replacing a plain copula with a performative verb that implies purpose or significance, when the
meaning is simply "is a."

- serves as a / stands as a / marks a / represents a / acts as a  →  when it just means "is a"
- "The tower serves as a symbol of the city's ambitions."  →  "The tower is the city's tallest
  building, completed in 1998."

"Serves as" is occasionally the right verb. The tell is the *reflexive* avoidance of "is" across a
whole document — one study found a >10% drop in "is/are" when GPT was asked to revise text.

### A8. Ecosystem / conservation boilerplate  (reliable in biology writing)

For any organism or ecosystem, LLMs default to conservation status + preservation efforts + cultural
significance, even with no supporting material.

- "It plays a vital role in the ecosystem. Preserving this endemic species is crucial not only for
  ecological diversity but also for sustaining the cultural traditions connected to the native flora."

Fix: state what is known. If conservation status is unknown, say "Not assessed by IUCN." Don't
speculate about ecosystem role or cultural significance without a source.

### A9. Leads treating a title as a proper noun  (reliable)

In articles whose title is a list or description, opening by defining the title as if it were a
standalone real-world entity.

- "Catchment area (health) refers to the geographic area from which a facility draws patients."
- "The List of songs about Mexico is a curated compilation of musical works that reference Mexico..."

Fix: write a natural lead about the subject, not a dictionary definition of the page title.

### A10. Meta-commentary and sign-offs  (reliable — near-proof)

Any text that describes or frames the writing task instead of just doing it. This includes chatbot
correspondence pasted in by accident.

- "I revised the content to provide a neutral and informative description... the tone was adjusted..."
- "Here is a revised version of your paragraph..." / "I hope this helps! Let me know if you'd like
  further adjustments." / "Would you like me to turn this into wikitext?"
- Edit summaries written as formal first-person paragraphs itemizing adherence to policy.

Fix: produce the output only. No preamble, no sign-off, no framing.

---

## B. Substance and coherence failures — the real giveaways

These matter more than any word choice. They are what makes AI text "equally off" throughout and
nearly impossible to edit.

### B1. Subject-swap filler

A sentence that stays true if you swap the subject for almost anything else. It carries no information.

- "This development represents an important step in the evolving landscape of the industry."

Fix: replace with something only true of this subject — a number, a name, a specific event.

### B2. Topic-linked but not logic-linked

A paragraph lists related facts with no argument connecting them; or a sentence's second half doesn't
follow from its first.

Fix: make each sentence follow from the one before. If two facts sit together, state the relationship
between them or separate them.

### B3. Restatement loops

The same point re-explained in different words across the paragraph. LLMs do this constantly.

Fix: say it once.

### B4. Rule-of-three padding

Three adjectives, examples, or clauses — not because three is right, but because it's the default.
Worse when the third item isn't actually true.

- "The festival features music, art, and culture." / "She is intelligent, driven, and passionate."
- Real-world tell: an app described as saving time "and reducing paperwork errors" when it has nothing
  to do with paperwork — the third benefit was invented to fill the triad.

Fix: use as many items as there actually are. One strong specific beats three vague ones.

### B5. Misplaced emotional beat (narrative writing)

In personal stories, AI puts the climax in the wrong place, renders shock with clichés ("my mouth fell
open, time seemed to freeze"), over-describes trivial moments, and resolves too neatly. The
"outlandish hook" often lands where a real memory wouldn't.

Fix: ground emotion in specifics, put the turn where it actually happened, and let some things stay
unresolved.

---

## C. Weak signals — do NOT mechanically strip, do NOT treat as proof

Common in careful human writing. Fix only when reflexive or clustered; never accuse on these alone.

### C1. The "not just X, but Y" parallelism  (weak)

- "It's not just a museum — it's a living archive of collective memory."

Overused, it reads as AI. Once, where the contrast is real, it's a normal rhetorical device. State
the positive claim directly when the negative half adds nothing.

### C2. Em dashes, curly quotes, semicolons, formal grammar  (weak)

Humans and their word processors produce all of these. Removing them wholesale makes writing worse and
signals over-correction. Only avoid the formulaic spaced-em-dash-per-clause rhythm.

### C3. Bullet lists, transition words, "perfect" prose  (weak)

Fine in moderation. The AI version is the inline-header list ("• **Durability:** ...") and dense
sentence-initial transition clusters — not lists or transitions as such.

---

## D. Over-correction patterns — the opposite failure

Introduced by trying too hard to "sound human." Each is its own tell.

### D1. Inserted performative opinion

Adding "honestly, I'm not sure how to feel about this" or first-person reactions to text that should
be neutral (documentation, reference, technical). Right for a personal essay, wrong everywhere else.

### D2. Fragment-only rhythm

Chopping every sentence short to seem casual. Real writing mixes short and long. Uniform fragments are
as unnatural as uniform medium-length sentences.

### D3. Punctuation scrubbing

Removing every em dash, colon, and semicolon, or forcing straight quotes on a platform that produces
curly ones. Produces stilted prose and proves nothing about authorship.
