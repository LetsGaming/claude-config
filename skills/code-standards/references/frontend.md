# Frontend

Framework-agnostic rules for UI code (React, Vue, Svelte, Astro islands, etc.). Read this when
touching components, pages, or styles.

## Ship the least JavaScript that does the job
- **Static by default; interactive by exception.** Decide per element, not per page: "does this
  specific thing need to run in the browser?" If not, render it as static markup. Don't wrap a whole
  page or layout in a framework component: that rebuilds the SPA you were avoiding and ships the
  whole tree to the client.
- **Hydrate deliberately.** Where the framework lets you choose, prefer lazy/visible/idle hydration
  for anything not immediately interactive; reserve eager hydration for above-the-fold interactive
  pieces; use server-rendered/streamed fragments for slow-upstream or personalized content.
- **Pass finished, serializable data down as props.** A component receives what it needs; it doesn't
  re-fetch data the server already had.

## Separate view from logic
- **A component renders and emits. It does not fetch or hold business logic.** Move data-fetching,
  derived state, and workflows into hooks/composables/controllers (`useSubmit`, `usePresence`, a view
  model). A `fetch` call or a business rule inside a component is on the wrong side of a seam.
- **Reuse instead of copy.** Two components that differ only slightly (a form and another form) share
  a primitive plus a hook: never a duplicated block of markup, style, and submit logic.
- **No god components.** A component that renders many unrelated sections, or a giant `if/switch` over
  a variant discriminant, should be split: per-section components, and a lookup map
  (`{ variant: Component }`) instead of the branch ladder.

## Data flow & state
- **Props down, events up.** Never mutate a prop. Use the framework's idiomatic two-way binding where
  it exists rather than hand-rolling prop+event pairs.
- **Derive, don't sync.** Compute derived values (memo/computed); reserve effects/watchers for genuine
  side effects: don't mirror one piece of state into another with an effect.
- **No global mutable client store** unless the app truly needs cross-island shared state. Keep state
  local to the component/island or on the server.
- **One source for shared client constants** (a base URL, a config value): import it, don't re-derive
  it in every component.

## Design tokens are the only theme system
Define colors, spacing, radii, typography, and shadows as **tokens** (CSS custom properties or the
framework's token layer) and **reference tokens everywhere**: never hardcode a hex code, a raw pixel
spacing, or a magic radius in a component. A half-tokenized system (colors tokenized but spacing
hardcoded, or a stray palette array) is the common failure: finish it, and add a token before
introducing a new raw value. Self-host fonts; avoid third-party style/CDN requests where it matters.

## App shell: always ship an icon
A frontend without an icon is unfinished: treat the icon as part of shipping the shell, not an
afterthought.
- **Browser-based UI → a favicon set, not a bare `/favicon.ico`.** Include an SVG or `.ico` favicon,
  an `apple-touch-icon`, and the icons named by the web-app manifest when one exists. A request that
  404s on the favicon is a visible gap.
- **Non-browser frontend → that platform's icon set**: installable/PWA manifest icons (including a
  maskable variant), mobile launcher/adaptive icons, desktop app icons, or browser-extension icons,
  at the sizes the target requires.
- **Declare icons in the document head or manifest, and serve them from the build's own assets**: self-hosted and versioned with the build, never a hardcoded third-party URL (same reasoning as
  self-hosting fonts). Provide light/dark or maskable variants where the platform supports them.

## Safety & accessibility
- **Treat every HTML sink as dangerous.** Any `innerHTML`/`v-html`/`dangerouslySetInnerHTML`, or any
  inlined SVG/markdown, must be sanitized upstream: prove the input is clean before it reaches the
  sink.
- **Keep accessibility in the component:** real labels, focus management, keyboard support, sufficient
  contrast (tokens make contrast consistent).
