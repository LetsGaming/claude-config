# Stacks

Which foundation to build on, and the implementation patterns that go wrong most often. Layer
`code-standards` and its matching `best-practices/<framework>.md` for the code itself.

**Contents**

- 1. Reach for a real design system when one exists
- 2. When the brief is an aesthetic, not a system
- 3. Default stack
- 4. Library choices
- 5. Framework rules that break designs
- 6. Canonical motion skeletons
- 7. Install reference
- 8. Canonical documentation

---

## 1. Reach for a real design system when one exists

If the brief reads as one of these, install and use the **official** package. Don't recreate its CSS
by hand, and don't import its tokens and then override 90% of them.

| Brief reads as… | Reach for | Why |
|---|---|---|
| Microsoft / enterprise SaaS | `@fluentui/react-components` or `@fluentui/web-components` | Official Fluent, Microsoft tokens, a11y done |
| Google-ish, Material-flavored | `@material/web` + Material 3 tokens | Official, theme-able via Material Theming |
| IBM-style B2B analytics | `@carbon/react` + `@carbon/styles` | Official Carbon, mature data-density patterns |
| Shopify app surfaces | Polaris web components / Polaris React | Required for Shopify admin UI |
| Atlassian / Jira-style | `@atlaskit/*` + `@atlaskit/tokens` | Official Atlassian DS |
| GitHub-style devtool | `@primer/css`, or `@primer/react-brand` for marketing | Official Primer |
| UK public sector | `govuk-frontend` | Legally and regulatorily expected |
| US public sector / trust-first | `uswds` | Same |
| Fast local-business or agency MVP | Bootstrap 5.3 | Boring, fast, works |
| Modern accessible React foundation | `@radix-ui/themes` | Primitives plus a polished theme |
| Modern SaaS where you own the components | shadcn/ui | You own the code: but **never ship default state** |
| Tailwind-based modern SaaS / indie build | Tailwind v4 utilities | The default for small-team builds |

**One system per project.** Don't mix Fluent with Carbon. Don't import shadcn components into a
Material 3 app. Two systems in one tree means two sets of tokens, two focus-ring conventions, two
spacing scales, and a product that feels stitched together.

**shadcn/ui specifically**: it's a starting point you own, not a finished product. Untouched shadcn
defaults are the tell, not the library. Customize radii, colors, shadows, typography, focus
treatment, and motion to the project's world before shipping anything.

---

## 2. When the brief is an aesthetic, not a system

For these there is no official package. Build with native CSS plus a maintained component library,
and be honest in comments about what is borrowed inspiration vs. official material.

| Aesthetic | Honest implementation |
|---|---|
| Glassmorphism / frosted | `backdrop-filter`, layered borders, highlight overlays, solid fallback for `prefers-reduced-transparency` |
| Bento tile grids | CSS Grid with mixed cell sizes. No library owns this |
| Brutalism | Native CSS, monospace, raw borders |
| Editorial / magazine | Serif or a strong sans display, asymmetric grid, generous measure |
| Dark tech | Mono plus one accent, terminal motifs |
| Aurora / mesh gradient | SVG or layered radial gradients |
| Kinetic typography | CSS animations, scroll-driven animations, GSAP for real hijacks |
| **Apple Liquid Glass** | Apple documents this **for Apple platforms only**. There is no official `liquid-glass.css`. Web versions are approximations: label them as such |

A web glass approximation, for reference:

```css
.glass-approx {
  position: relative;
  isolation: isolate;
  border: 1px solid rgb(255 255 255 / .32);
  background:
    linear-gradient(135deg, rgb(255 255 255 / .30), rgb(255 255 255 / .08)),
    rgb(255 255 255 / .12);
  backdrop-filter: blur(24px) saturate(180%);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / .48),
    inset 0 -1px 0 rgb(255 255 255 / .12),
    0 18px 60px rgb(0 0 0 / .18);
}

@media (prefers-reduced-transparency: reduce) {
  .glass-approx { background: rgb(255 255 255 / .96); backdrop-filter: none; }
}
```

`prefers-reduced-transparency` has uneven support: test it, and make sure contrast passes even
without the blur.

---

## 3. Default stack

Unless the brief picks a system above:

- **Framework**: React / Next.js, Server Components by default.
- **Styling**: Tailwind v4. (v4 uses `@tailwindcss/postcss` or the Vite plugin, *not* the
  `tailwindcss` PostCSS plugin.) Tailwind v3 only when the existing project demands it.
- **Animation**: Motion, imported from `motion/react`. `framer-motion` still works as a legacy
  alias; prefer `motion/react` in new code.
- **Fonts**: `next/font`, or self-hosted `@font-face` with `font-display: swap`. Never a bare
  `<link>` to a font CDN in production.

**Verify dependencies before importing.** Check `package.json`. If the package is missing, output the
install command first. Never assume a library exists: a hallucinated import is a build failure with
your name on it.

---

## 4. Library choices

**Icons**: pick one and standardize stroke width: Phosphor (`@phosphor-icons/react`), Hugeicons,
Radix Icons, Tabler. Lucide is fine when the project already uses it or the user asks; it's just very
heavily defaulted-to. Never hand-roll paths; never mix families.

**Components**. Radix primitives or Base UI for unstyled accessible behavior; shadcn if you want to
own the source. Don't hand-roll a dialog, combobox, or date picker: focus management, `inert`,
scroll locking and keyboard semantics are more work than they look, and getting them wrong is an
accessibility failure, not a polish gap.

**Tables**. TanStack Table (headless) or AG Grid (batteries included). Never a hand-rolled `<table>`
that needs sorting, virtualization and column resizing.

**Toasts / drawers**. Sonner and Vaul. Both encode a lot of the physicality in `motion.md`.

**Charts**. Recharts or visx for React; Chart.js for simple cases; D3 directly when the chart is
genuinely custom. Whichever: label axes, provide non-color encoding, handle the empty and single-point
cases.

**3D / WebGL**. Three.js or OGL (lighter). Isolate in a client leaf component, lazy-load, and always
ship a static fallback.

---

## 5. Framework rules that break designs

**React / Next.js**

- Global state and providers only work in Client Components. Wrap providers in a `"use client"`
  component.
- **Isolate interactivity in client leaves.** Any component using motion, scroll listeners or pointer
  physics gets `'use client'` at the top and stays a leaf. Server Components render static layout.
- **Never track continuous values in `useState`**: mouse position, scroll progress, drag offset,
  pointer physics. Every change re-renders the tree, and it collapses on mobile. Use motion values
  (`useMotionValue` / `useTransform` / `useScroll`) or set `transform` directly.
- `useEffect` animations need strict cleanup. Leaked ScrollTriggers and event listeners are the
  reason a page gets slower the longer it's open.
- For staggered orchestration, parent variants and children must share the same client tree.

**CSS / Tailwind**

- `min-h-[100dvh]`, never `h-screen`, for full-height sections.
- CSS Grid over flexbox percentage math.
- `min-width: 0` on flex/grid children containing text.
- Design tokens only: no hardcoded hex, px or ms values in components. This is the same rule
  `code-standards` already enforces, and it's the mechanism that makes theming and consistency locks
  possible at all.
- A documented z-index scale in a constants file, not `z-50` sprayed at problems.
- Grain and noise on a `fixed inset-0 pointer-events-none` overlay, never on a scrolling container.

---

## 6. Canonical motion skeletons

The two scroll effects that break most often. Both fail the same way: the animation starts before
the section is pinned: and both are fixed by `start: "top top"`.

### Scroll reveal (prefer this; no GSAP needed)

```tsx
'use client';
import { motion, useReducedMotion } from 'motion/react';

export function RevealStagger({ items }: { items: string[] }) {
  const reduce = useReducedMotion();
  return (
    <ul className="grid gap-6">
      {items.map((item, i) => (
        <motion.li
          key={item}
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
        >
          {item}
        </motion.li>
      ))}
    </ul>
  );
}
```

Use this for feature lists, testimonial grids, logo walls: anything that just needs to enter on
scroll. Save GSAP for genuine pin/scrub work. And remember §2 of `motion.md`: one authored moment
beats this applied to every section.

### Sticky stack

```tsx
'use client';
import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReducedMotion } from 'motion/react';

gsap.registerPlugin(ScrollTrigger);

export function StickyStack({ cards }: { cards: React.ReactNode[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce || !ref.current) return;
    const ctx = gsap.context(() => {
      const els = gsap.utils.toArray<HTMLElement>('.stack-card');
      els.forEach((card, i) => {
        if (i === els.length - 1) return;
        ScrollTrigger.create({
          trigger: card,
          start: 'top top',                 // pin at viewport top, not "top center"
          endTrigger: els[els.length - 1],
          end: 'top top',
          pin: true,
          pinSpacing: false,
        });
        gsap.to(card, {
          scale: 0.92,
          opacity: 0.55,
          ease: 'none',
          scrollTrigger: {
            trigger: els[i + 1],            // driven by the NEXT card's arrival
            start: 'top bottom',
            end: 'top top',
            scrub: true,
          },
        });
      });
    }, ref);
    return () => ctx.revert();              // cleanup is not optional
  }, [reduce]);

  return (
    <div ref={ref} className="relative">
      {cards.map((card, i) => (
        <div key={i} className="stack-card sticky top-0 min-h-[100dvh] flex items-center justify-center">
          {card}
        </div>
      ))}
    </div>
  );
}
```

### Horizontal pan

```tsx
'use client';
import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReducedMotion } from 'motion/react';

gsap.registerPlugin(ScrollTrigger);

export function HorizontalPan({ children }: { children: React.ReactNode }) {
  const wrap = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce || !wrap.current || !track.current) return;
    const ctx = gsap.context(() => {
      const distance = track.current!.scrollWidth - window.innerWidth;
      gsap.to(track.current, {
        x: -distance,
        ease: 'none',
        scrollTrigger: {
          trigger: wrap.current,
          start: 'top top',
          end: () => `+=${distance}`,       // scroll length == horizontal travel
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,        // survives resize
        },
      });
    }, wrap);
    return () => ctx.revert();
  }, [reduce]);

  return (
    <section ref={wrap} className="relative overflow-hidden">
      <div ref={track} className="flex h-[100dvh] items-center">{children}</div>
    </section>
  );
}
```

Wrap the page in `overflow-x-hidden` so off-screen animation origins never produce a horizontal
scrollbar.

---

## 7. Install reference

```bash
# Material Web (Material 3)
npm install @material/web

# Fluent UI React v9  /  framework-free web components
npm install @fluentui/react-components
npm install @fluentui/web-components @fluentui/tokens

# IBM Carbon
npm install @carbon/react @carbon/styles

# Radix Themes
npm install @radix-ui/themes

# shadcn/ui
npx shadcn@latest init
npx shadcn@latest add button card badge separator input

# Primer (GitHub product / marketing)
npm install @primer/css
npm install @primer/react-brand

# Public sector
npm install govuk-frontend
npm install uswds

# Atlassian
yarn add @atlaskit/css-reset @atlaskit/tokens @atlaskit/button @atlaskit/badge

# Bootstrap
npm install bootstrap
```

Shopify Polaris web components load from Shopify's CDN inside the app HTML head; they aren't a plain
npm install.

Verify against the package's current docs before running any of these: versions and package names
move.

---

## 8. Canonical documentation

Read the source before reinventing anything.

- **Material**: material-web.dev/theming/material-theming · m3.material.io/develop/web
- **Fluent**: fluent2.microsoft.design · learn.microsoft.com/fluent-ui/web-components
- **Carbon**: carbondesignsystem.com
- **Polaris**: shopify.dev/docs/api/app-home/web-components
- **Atlassian**: atlassian.design/get-started/develop · atlassian.design/tokens/design-tokens
- **Primer**: primer.style
- **GOV.UK**: design-system.service.gov.uk
- **USWDS**: designsystem.digital.gov
- **Radix**: radix-ui.com/themes/docs
- **shadcn/ui**: ui.shadcn.com/docs
- **Tailwind**: tailwindcss.com/docs
- **Apple HIG**: developer.apple.com/design/human-interface-guidelines
- **Web platform**: MDN for `backdrop-filter`, `@starting-style`, scroll-driven animations,
  `prefers-*` media queries, View Transitions, Grid
