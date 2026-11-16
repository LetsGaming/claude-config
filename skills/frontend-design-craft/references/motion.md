# Motion

The most under-specified area in generated UI, and the one where small wrong values are most
noticeable without being nameable. Users rarely say "that easing is wrong": they say "it feels
cheap".

**Contents**

- 1. Should this animate at all?
- 2. What is the purpose?
- 3. Easing
- 4. Duration
- 5. Physicality: the small rules that compound
- 6. Springs
- 7. Interruptibility
- 8. Gestures and drag
- 9. Scroll-driven motion
- 10. Performance
- 11. Accessibility
- 12. Debugging
- 13. Review table

---

## 1. Should this animate at all?

Ask first: **how often will a user see this?** Frequency, not aesthetics, decides.

| Frequency | Decision |
|---|---|
| 100+ times/day (keyboard shortcuts, command palette, tab switch) | **No animation. Ever.** |
| Tens of times/day (hover, list navigation, expand/collapse) | Remove, or reduce drastically |
| Occasional (modals, drawers, toasts, navigation) | Standard animation |
| Rare / first-time (onboarding, celebration, feedback confirmation) | Can add delight |

**Never animate keyboard-initiated actions.** They repeat hundreds of times daily; any animation
makes them feel slow and disconnected from the keystroke. Raycast has no open/close animation, and
that's the correct call for something used that often.

The mode matters too. On an **Operate** surface, motion serves feedback, state and continuity: keep
routine transitions fast and never make a user wait through page-load choreography. On **Persuade**
and **Experience**, motion may carry the voice, but one rehearsed focal sequence beats twelve section
reveals.

**Motion claimed is motion shown.** If the direction says the page moves, it must actually move,
entry on the hero, reveal on key sections, real feedback on controls. If you can't ship working
motion within scope, ship a clean static page instead. Half-built motion (cut-off scroll triggers,
jumpy entrances, missing cleanups) is worse than none.

---

## 2. What is the purpose?

Every animation needs a one-sentence answer to "why does this move?". Valid answers:

- **Feedback**: the interface acknowledges the user's action. A button scales on press.
- **State indication**: something changed, and the change is legible.
- **Spatial consistency**: a toast enters and exits along the same path, so swipe-to-dismiss feels
  obvious. A drawer that slides in from the right dismisses to the right.
- **Continuity**: the user's eye is carried across a layout, navigation or view change instead of
  being teleported.
- **Explanation**: a marketing animation that demonstrates how a feature works.
- **Preventing jarring change**: elements appearing or vanishing instantly feel broken.

Invalid answer: *"it looked cool"*, on anything the user sees often. If you can't articulate the
reason in one sentence, delete the animation.

The specific anti-pattern to avoid: **fade-and-rise on every section on scroll**. It's not a motion
design; it's the absence of one, applied uniformly. One authored moment plus quiet supporting states
is the target.

---

## 3. Easing

Decision order:

- **Entering or exiting** → `ease-out`. Starts fast, feels immediately responsive.
- **Moving or morphing on screen** (A→B, already visible) → `ease-in-out`.
- **Hover, color change** → `ease`.
- **Constant motion** (marquee, indeterminate progress, spinner) → `linear`.
- Default → `ease-out`.

**Never use `ease-in` for UI.** It starts slow, delaying movement at precisely the moment the user is
watching most closely. `ease-out` at 200ms *feels faster* than `ease-in` at 200ms even though the
duration is identical.

**The built-in CSS easings are too weak.** They lack the punch that reads as intentional. Use strong
custom curves:

```css
--ease-out:     cubic-bezier(0.23, 1, 0.32, 1);      /* strong ease-out, general UI */
--ease-out-alt: cubic-bezier(0.16, 1, 0.3, 1);       /* confident arrival, entrances */
--ease-in-out:  cubic-bezier(0.77, 0, 0.175, 1);     /* on-screen movement */
--ease-drawer:  cubic-bezier(0.32, 0.72, 0, 1);      /* iOS-like sheet curve (from Ionic) */
```

Don't hand-roll curves from scratch: `easing.dev` and `easings.co` have stronger variants of every
standard easing.

**Bounce and elastic are not defaults.** They're a character choice for playful products and
drag-release moments. On a professional tool they read as toy-like.

**Mirror the easing on reversible transitions** so the outbound path matches the return: inverse
control points for the two directions.

---

## 4. Duration

| Element | Duration |
|---|---|
| Button press feedback | 100–160ms |
| Tooltip, small popover | 125–200ms |
| Dropdown, select, menu | 150–250ms |
| Modal, drawer, sheet | 200–500ms |
| Layout / view transition | 300–500ms |
| Authored focal entrance | 500–800ms |
| Marketing / explanatory | can be longer |

**Rule: routine UI animation stays under 300ms.** A 180ms dropdown feels more responsive than a 400ms
one. Long feedback reads as latency.

**Exit faster than entrance.** The user has already decided; don't make them wait for the interface
to finish agreeing.

**Asymmetric timing generally**: slow where the user is deciding, fast where the system is
responding. Hold-to-delete presses over 2s linear and releases in 200ms ease-out.

**Perceived performance is real.** A faster-spinning spinner makes a page feel like it loads faster
with identical actual load time. Instant tooltips after the first one is open (skip delay *and* skip
animation) make a whole toolbar feel faster.

---

## 5. Physicality: the small rules that compound

Most users never consciously notice any of these. That's the point: the aggregate of invisible
correctness is what people mean when they say an interface "feels right".

**Never animate from `scale(0)`.** Nothing in the real world appears from nothing. Start from
`scale(0.95)` (0.9–0.97) with `opacity: 0`. Even a barely-visible initial scale makes the entrance
read as an object arriving rather than materializing.

```css
/* Bad */  .entering { transform: scale(0); }
/* Good */ .entering { transform: scale(0.95); opacity: 0; }
```

**Buttons need press feedback.** `transform: scale(0.97)` on `:active`, transition 160ms ease-out.
Subtle range 0.95–0.98. Applies to every pressable element. And it must fire on **pointer-down**, not
on click: waiting for release feels dead.

```css
.button { transition: transform 160ms var(--ease-out); }
.button:active { transform: scale(0.97); }
```

**Popovers scale from their trigger, not from center.** The CSS default `transform-origin: center` is
wrong for almost every popover, dropdown and menu. Anchor it to the trigger:

```css
.popover { transform-origin: var(--transform-origin); }  /* Base UI / Radix expose this */
```

**Modals are the exception**: they aren't anchored to a trigger, they appear centered in the
viewport. Keep `transform-origin: center`.

**Tooltips: delay the first, skip the rest.** A tooltip should delay before appearing to prevent
accidental activation. But once one is open, hovering an adjacent trigger should open instantly with
no animation. This feels dramatically faster without defeating the initial delay.

**Blur masks imperfect crossfades.** When two states crossfade and it looks wrong no matter what
easing or duration you try, the problem is that you can see *two distinct objects* overlapping. A
subtle `filter: blur(2px)` during the transition blends them into one perceived transformation. Keep
blur under 20px: heavy blur is expensive, especially in Safari.

**Materialize, don't just fade.** For a glass or blurred surface, animate blur radius and scale
together on enter/exit, so it reads as a material arriving rather than an opacity ramp.

**Stagger group entrances, briefly.** 30–80ms between items. Longer delays make the interface feel
slow. Stagger is decorative: never block interaction while it plays, and cap the total delay so item
twelve doesn't arrive two seconds late.

**Hint in the direction of travel.** Humans predict a final state from a trajectory. Intermediate
frames should point at the outcome: a panel expanding toward the corner it will occupy, not
interpolating blindly.

**Use `translate` percentages, not pixels.** `translateY(100%)` moves an element by its own height
regardless of dimensions: which is how toasts and drawers stay correct when content changes. Note
that `scale()` scales children too (font, icons, padding), which is a feature for press feedback.

---

## 6. Springs

Springs feel natural because they simulate physics. They have no fixed duration: they settle based
on parameters: and, crucially, **they are interruptible by construction**.

Use springs for:

- drag interactions with momentum
- gestures a user might reverse mid-motion
- elements that should feel alive (Dynamic Island-style morphs)
- decorative mouse-tracking

Don't use springs for: routine state changes, anything on an Operate surface used constantly, or
anything where a fixed, predictable duration matters.

### Parameters

Two mental models. Apple's is easier to reason about and maps cleanly onto Motion's API:

```js
// Apple-style: duration + bounce (recommended)
{ type: "spring", duration: 0.4, bounce: 0 }     // critically damped, no overshoot
{ type: "spring", duration: 0.4, bounce: 0.2 }   // slight overshoot, momentum interactions

// Traditional physics: more control, harder to tune
{ type: "spring", mass: 1, stiffness: 100, damping: 20 }
```

- **Damping ratio 1.0 (bounce 0) is the default for UI.** Graceful, non-distracting, no overshoot.
- **Add bounce only when the gesture itself carried momentum**: a flick, a throw, a drag release.
  Overshoot on a menu that just faded in feels wrong; overshoot on a card you flicked feels right.
- Keep bounce in 0.1–0.3 when used.

Values that ship in Apple's own UI:

| Interaction | Damping | Response |
|---|---|---|
| Move / reposition | 1.0 | 0.4 |
| Rotation | 0.8 | 0.4 |
| Drawer / sheet | 0.8 | 0.3 |

**Decompose 2D motion into independent X and Y springs.** A single spring on a 2D distance desyncs
when the axes have different velocities.

### Spring-based mouse tracking

Tying a value directly to mouse position feels artificial because it has no momentum. Interpolate
through a spring instead:

```jsx
// Artificial: instant, no weight
const rotation = mouseX * 0.1;

// Natural: momentum, settles
const rotation = useSpring(mouseX * 0.1, { stiffness: 100, damping: 10 });
```

This is legitimate because the motion is **decorative**. If it were a functional graph in a banking
app, no animation would be better.

---

## 7. Interruptibility

The single most important principle in gesture-driven UI. The thought and the gesture happen in
parallel; a user must be able to grab a moving element mid-flight and reverse it without waiting.

- **Never lock out input during a transition.**
- **Always animate from the *presentation* (current on-screen) value, never the target value.** On
  interrupt, read the live transform and start the new animation from there. Starting from the
  logical value produces a visible jump.
- **CSS transitions are interruptible and retargetable. `@keyframes` restart from zero.** For
  anything triggered rapidly (toasts stacking, toggles, rapid open/close) transitions produce
  smoother results.

```css
/* Interruptible: good for dynamic UI */
.toast { transition: transform 400ms var(--ease-out); }

/* Not interruptible: avoid for anything the user can retrigger */
@keyframes slideIn { from { transform: translateY(100%); } to { transform: translateY(0); } }
```

- **Avoid CSS transitions and keyframes entirely for gesture-driven motion.** They can't be grabbed
  and reversed. Springs animate from the current value by default, which is exactly what interruption
  needs.
- **When a gesture reverses, blend velocity: don't hard-cut it.** Replacing one animation with
  another at a reversal creates a velocity discontinuity that reads as hitting a wall. Use a spring
  library that carries velocity through a retarget.

### Entry animation without JavaScript

```css
.toast {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 400ms var(--ease-out), transform 400ms var(--ease-out);

  @starting-style {
    opacity: 0;
    transform: translateY(100%);
  }
}
```

`@starting-style` replaces the `useEffect(() => setMounted(true), [])` + `data-mounted` pattern. Keep
the legacy pattern only where browser support demands it.

---

## 8. Gestures and drag

- **Respond on pointer-down, not on release.** Highlight the instant the press lands.
- **Feedback must be continuous during the interaction**, not only at the end. A drag, slider or
  drawer updates 1:1 with the pointer the whole way.
- **Track 1:1 and respect the grab offset.** Snapping the element's center to the finger on grab
  breaks the illusion immediately. Store `pointerY − elementTop` at `pointerdown`.
- **Use Pointer Events with `setPointerCapture`** so dragging continues when the pointer leaves the
  element's bounds.
- **Keep a short velocity history** (last few `pointermove` events with timestamps), not just the
  current position: you need velocity at release.
- **Hysteresis before committing to a direction**: ~10px of movement, then track. Add ~10px of hit
  padding around tap targets, and allow cancel-by-dragging-away-and-back.
- **Multi-touch protection**: ignore additional touch points once a drag has begun (`if (isDragging)
  return`), or switching fingers makes the element jump.

### Momentum dismissal

Don't require crossing a distance threshold. Compute velocity; a quick flick should be enough.

```js
const elapsed  = Date.now() - dragStartTime;
const velocity = Math.abs(swipeAmount) / elapsed;
if (Math.abs(swipeAmount) >= SWIPE_THRESHOLD || velocity > 0.11) dismiss();
```

### Velocity handoff

When the gesture ends, the animation must **continue at the finger's exact velocity**, so there's no
seam between dragging and animating. This is the detail that most separates "fluid" from "fine". Pass
the release velocity as the spring's initial velocity. If the API wants relative velocity, normalize
by remaining distance:

```
relativeVelocity = gestureVelocity / (target − current)
```

### Momentum projection

Don't snap to the nearest point from the *release position*. Project where the gesture was *going*,
then snap to the target nearest that projection: this is what makes a flick feel like a throw.

```js
// decelerationRate ≈ 0.998 for a normal scroll feel; 0.99 for snappier
function project(initialVelocity /* px/s */, decelerationRate = 0.998) {
  return (initialVelocity / 1000) * decelerationRate / (1 - decelerationRate);
}
const projected = currentPosition + project(releaseVelocity);
animateSpringTo(nearestSnapPoint(projected), { velocity: releaseVelocity });
```

The physics-textbook `v²/(2·decel)` is *not* what good bottom sheets and carousels ship: use the
exponential-decay form above.

### Rubber-banding at boundaries

Resist progressively instead of stopping hard. A hard stop reads as frozen; continuous resistance
reads as "responsive, but there's nothing more here".

```js
function rubberband(overshoot, dimension, constant = 0.55) {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}
```

---

## 9. Scroll-driven motion

**`window.addEventListener('scroll')` driving React state is banned.** It fires every frame, re-renders
the tree, and collapses on mobile. Same for `requestAnimationFrame` loops that touch React state, and
custom scroll-progress math in `useState`.

Use instead, in order of preference:

1. **CSS scroll-driven animations**: `animation-timeline: view()` / `scroll()`. No JS, runs off the
   main thread. Always ship a static fallback for unsupported browsers.
2. **`IntersectionObserver`** for simple enter-viewport reveals.
3. **Motion's `useScroll` / `useMotionValue` / `useTransform`**: motion values live outside the React
   render cycle, so continuous values don't re-render anything.
4. **GSAP ScrollTrigger**: for genuine pin/scrub work only.

**Never mix GSAP or Three.js with Motion in the same component tree.** They fight over the same
frames.

Two failure modes worth naming, because they're the most common broken scroll effects:

- **Sticky stacks that trigger halfway through the scroll** instead of pinning at the viewport top.
  The fix is `start: "top top"`, not `"top center"` or `"top 80%"`, with `pin: true` on every card
  except the last, and the scale/opacity transform driven by the *next* card's trigger.
- **Horizontal pans that begin before the section is pinned**, so the user sees half a slide. Same
  fix: `start: "top top"`, `pin: true`, `end: "+=" + distance` where distance is
  `track.scrollWidth − window.innerWidth`, and `invalidateOnRefresh: true` so it survives a resize.

Canonical skeletons in `stacks.md`.

**Always clean up.** `useEffect` animations return a cleanup that reverts the context
(`ctx.revert()` for GSAP). Leaked ScrollTriggers are the leading cause of "the page gets slower the
longer you use it".

---

## 10. Performance

- **Animate `transform` and `opacity` only.** They skip layout and paint and run on the compositor.
  `width`, `height`, `top`, `left`, `margin`, `padding` trigger all three rendering steps every frame.
  When you must animate size, use FLIP or a transform-based technique.
- **`will-change` only during known animation**, then remove it. Permanent `will-change` promotes
  layers forever and costs memory.
- **Framer Motion's shorthand props are *not* hardware-accelerated.** `x`, `y`, `scale` run on the
  main thread via `requestAnimationFrame`. Under load: page navigation, script execution, image
  decode: they drop frames. Use the full transform string when smoothness matters:

```jsx
<motion.div animate={{ x: 100 }} />                          // drops frames under load
<motion.div animate={{ transform: "translateX(100px)" }} />  // compositor
```

- **CSS animations beat JS under load** because they run off the main thread. Use CSS for
  predetermined motion, JS for dynamic and interruptible motion.
- **WAAPI gives JS control with CSS performance**: hardware-accelerated, interruptible, no library:

```js
element.animate(
  [{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0 0)' }],
  { duration: 1000, fill: 'forwards', easing: 'cubic-bezier(0.77, 0, 0.175, 1)' }
);
```

- **Don't drive child transforms through a CSS variable on the parent.** Custom properties inherit, so
  updating one on a container recalculates styles for every descendant. Set `transform` directly on
  the moving element.

```js
el.style.setProperty('--swipe-amount', `${d}px`); // recalc on all children
el.style.transform = `translateY(${d}px)`;        // only this element
```

- **Grain, noise and heavy filters go on a fixed, `pointer-events: none` overlay**: never on a
  scrolling container, where they force continuous GPU repaints.
- **Bound expensive effects** (blur, backdrop-filter, shadow, canvas, shader) to isolated regions.
  Full-viewport `backdrop-filter` is the most common cause of a janky mobile scroll.
- **Nonessential loops stop when offscreen or hidden.** An infinite marquee running in a background
  tab is pure battery drain.
- Lazy-load anything below the fold. Motion isn't tiny; Three.js is large.

---

## 11. Accessibility

**Reduced motion means fewer and gentler animations, not zero.** Keep opacity and color transitions
that aid comprehension; remove movement, position change, parallax, scroll hijack, and elastic
overshoot.

```css
@media (prefers-reduced-motion: reduce) {
  .sheet { transition: opacity 200ms ease; transform: none !important; }
}
```

```jsx
const reduce = useReducedMotion();
const closedX = reduce ? 0 : '-100%';
```

Three independent signals to respect:

- **`prefers-reduced-motion: reduce`** → cross-fade instead of slide/spring; drop overshoot.
- **`prefers-reduced-transparency: reduce`** → raise background opacity, drop the blur.
- **`prefers-contrast: more`** → near-solid backgrounds with defined, contrasting borders.

Also:

- **Gate hover animation behind `@media (hover: hover) and (pointer: fine)`.** Touch devices fire
  hover on tap, producing stuck hover states.
- Avoid full-viewport moving backgrounds, slow oscillations near 0.2 Hz (one cycle per 5s), and
  abrupt brightness jumps: ease theme changes.
- Make large moving objects semi-transparent while they travel; fade big surfaces out during a large
  reposition and back in once settled.
- Never animate an image on hover, directly or through its parent: an image is not an action target.
  Give the container the feedback.
- Content is visible in its default state, so a failed script never hides the page.

---

## 12. Debugging

- **Slow motion.** Bump duration 2–5×, or use the DevTools animation inspector. Look for: two distinct
  states overlapping during a crossfade, easing that stops abruptly, wrong transform-origin,
  coordinated properties drifting out of sync.
- **Frame-by-frame.** The Chrome Animations panel reveals timing drift between properties that's
  invisible at full speed.
- **Real devices for gestures.** Connect a phone, hit the dev server by IP, use Safari remote
  devtools. Simulators lie about touch.
- **Fresh eyes the next day.** Imperfections invisible during development are obvious after a night.

---

## 13. Review table

When reviewing motion in someone's code, output a table: not a list of before/after pairs on
separate lines.

| Before | After | Why |
|---|---|---|
| `transition: all 300ms` | `transition: transform 200ms var(--ease-out)` | Name exact properties; `all` animates things you didn't intend |
| `transform: scale(0)` | `transform: scale(0.95); opacity: 0` | Nothing in the real world appears from nothing |
| `ease-in` on a dropdown | `ease-out` with a custom curve | `ease-in` delays the moment the user is watching |
| No `:active` state on a button | `transform: scale(0.97)` on `:active` | Pressable things must respond to a press |
| `transform-origin: center` on a popover | `transform-origin: var(--transform-origin)` | Popovers scale from their trigger; modals stay centered |
| Animation on a keyboard-triggered action | Remove entirely | Seen hundreds of times a day; animation reads as lag |
| Duration > 300ms on routine UI | 150–250ms | 180ms feels more responsive than 400ms |
| Hover animation with no media query | Add `@media (hover: hover) and (pointer: fine)` | Touch fires false hovers on tap |
| `@keyframes` on a rapidly retriggered element | CSS transition | Keyframes restart from zero; transitions retarget |
| Framer Motion `x`/`y` under load | `transform: "translateX()"` | Shorthands run on the main thread |
| Same enter and exit speed | Exit faster than enter | The user already decided |
| Everything appears at once | 30–80ms stagger | Cascade reads as intentional; simultaneous reads as a dump |
| `window.addEventListener('scroll')` + `setState` | `useScroll` / IntersectionObserver / CSS timeline | Re-renders the tree every frame |
| Fade-and-rise on every section | One authored moment | Uniform motion is the absence of motion design |
