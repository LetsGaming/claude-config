# React best practices

React-specific rules (React 19+, function components + hooks, TypeScript) that sit **on top of**
`frontend.md`. The general frontend rules: view/logic separation, props-down/events-up, deliberate
hydration, design tokens, sanitized sinks: still hold; this file names how they land in React and
adds React-only concerns. Read it whenever touching components or hooks.

## Function components and the rules that keep them sane

- **Function components + hooks only** for new code; no class components.
- **Render must be pure.** A component's render body computes JSX from props/state with no side
  effects, no mutation of external values, no subscriptions. Side effects belong in event handlers
  (the common case) or, when genuinely needed, in an effect.
- **Follow the Rules of Hooks.** Call hooks at the top level, unconditionally, in the same order every
  render: never inside conditions, loops, or after an early return.
- **Treat state and props as immutable.** Never mutate them; produce new values and call the setter.
  Lift state to the lowest common ancestor that needs it; keep it as local as possible otherwise.

## Effects are a last resort, not a data pipeline

The single most common React smell is reaching for `useEffect` to do things that aren't side effects.

- **Derive during render; don't mirror state with an effect.** If a value is computable from props or
  state, compute it inline: don't copy it into another state variable and sync it with an effect.
- **Transform data during render, not in an effect.** Filtering/formatting a list for display happens
  where you render it.
- **Handle user events in handlers, not effects.** A POST on submit belongs in the submit handler.
- **Reserve effects for genuine external synchronization**: subscriptions, manual DOM work, non-React
  widgets, network wiring that truly can't live in a handler. Every effect needs correct dependencies
  and, where it subscribes, a cleanup return.

## Separate view from logic with custom hooks

- **A component renders and dispatches; it does not fetch or hold business logic.** Move data fetching,
  subscriptions, derived workflows, and view-model logic into custom hooks (`useUser`, `useSubmit`,
  `usePresence`). A `fetch` in a component body is on the wrong side of a seam (`frontend.md`).
- **Keep hooks focused and composable**: small `useX` hooks that call each other, not one god hook.
  Pure, framework-free calculations go in plain modules (`utils/`, a service), not in a hook.
- **Route API access through a service/repository layer** so components and hooks never call
  `fetch`/`axios` inline (ports/adapters, `external-integrations.md`).

## Composition over configuration

- **Compose with `children` and component slots instead of boolean-prop pile-ups.** When
  `showHeader`/`showFooter`/`showActions` start accumulating, pass content in as `children` or named
  render props and let the caller decide.
- **No god components.** A component doing many unrelated jobs, or a giant `switch` over a `variant`
  discriminant, should be split: per-section components plus a lookup map (`{ variant: Component }`)
  instead of the branch ladder (`engineering-principles.md`).
- **Stable, unique list keys**: a domain id, never the array index for dynamic/reorderable lists.

## Let the compiler handle memoization

- **With the React Compiler enabled, stop hand-writing `useMemo` / `useCallback` / `React.memo`.** The
  compiler auto-memoizes; manual memoization sprinkled "just in case" is now noise. Add it by hand only
  where profiling shows a real hot path the compiler didn't cover, or in a project without the
  compiler.
- **Don't optimize before measuring.** Reach for memoization in response to a demonstrated problem,
  not on spec (YAGNI).

## State that outlives a component

- **Colocate first.** Keep state in the component or the nearest common ancestor. Most apps need far
  less global state than they reach for.
- **Context for genuinely cross-cutting values** (theme, current user, locale): not as a general
  state manager. A frequently-changing value in Context re-renders every consumer; keep Context values
  stable and coarse.
- **A dedicated store (Zustand, Redux Toolkit, etc.) only when shared, frequently-updated state
  outgrows Context**: and organized by domain. Don't add one to solve a problem you don't have.

## Server Components (in a supporting meta-framework)

- **Default to Server Components; push `'use client'` to the leaves.** Where the framework supports
  RSC (e.g. Next.js App Router), keep components on the server by default and mark only the interactive
  boundary with `'use client'`, as low in the tree as possible: the same "hydrate the leaves"
  discipline as Astro islands.
- **Fetch on the server; don't ship data-fetching to the client.** Server Actions for mutations,
  validated at the boundary. A client component that re-fetches what the server already had is waste.

## Safety, types, tooling

- **TypeScript, no `any`.** Type props with an interface; type event handlers; avoid unsafe casts.
- **Every HTML sink is dangerous**: `dangerouslySetInnerHTML` takes sanitized input only, proven
  clean upstream (`frontend.md`).
- **Design tokens are the theme system**: CSS custom properties or the token layer, referenced from
  components; no hardcoded hex/spacing, no scattered inline-style literals.
- **StrictMode on in development.** Error boundaries around render-error-prone subtrees; Suspense for
  async boundaries. Pick controlled *or* uncontrolled inputs per form and stay consistent.

## Red flags (refactor soon)

- `useEffect` used to derive/sync state or transform data for display.
- `fetch`/`axios` called directly in a component body.
- A god component, or a long `if/switch` over a variant instead of a component map.
- Manual `useMemo`/`useCallback` everywhere with the compiler enabled.
- Index keys on dynamic lists.
- Global store (or Context) holding what could be local state.
- `'use client'` at the top of the tree, pulling everything to the client.
