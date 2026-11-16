# Svelte best practices

Svelte-specific rules (Svelte 5+ with runes, SvelteKit, TypeScript) that sit **on top of**
`frontend.md`. The general frontend rules: view/logic separation, props-down/events-up, design
tokens, sanitized sinks: still hold; this file names how they land in Svelte 5 and adds Svelte-only
concerns. Read it whenever touching `.svelte`, `.svelte.ts`, or SvelteKit route files.

## Use runes; the Svelte 4 patterns are legacy

Svelte 5 replaced implicit reactivity with explicit **runes**. New code uses them; the old patterns
are technical debt.

- **`$state` for reactive state, `$derived` for anything computable from it, `$effect` only for
  genuine side effects.** Don't write `$:` reactive labels, `createEventDispatcher`, or a `writable`
  store for component state in new code.
- **`$derived` over `$effect`-to-sync.** If a value can be calculated from existing state, it's a
  `$derived` (lazy and memoized): never mirror one piece of state into another with an effect. Reserve
  `$effect` for DOM work, subscriptions, and external synchronization, with cleanup returned.
- **Don't destructure a `$state` proxy or a `$derived` value**: it snapshots and breaks reactivity.
  Read through the reactive holder (`state.count`, not a destructured `count`).

## Reactive logic lives in `.svelte.ts`, not the component

Runes work outside components, in `.svelte.js` / `.svelte.ts` files: this is Svelte's composable/hook
seam.

- **Extract reusable stateful logic into a `.svelte.ts` module**: a function returning runes-backed
  state, or a small reactive class holding `$state`/`$derived`. Components render; logic that fetches,
  derives, or coordinates lives in the module, where it's unit-testable without mounting.
- **Route API access through a service layer** so components never call `fetch`/`axios` inline
  (ports/adapters, `external-integrations.md`); the `.svelte.ts` module wraps it for reactivity.
- **Stores still exist but are no longer the default.** Use `writable`/`readable` for cross-app
  singletons or interop with non-Svelte code; for ordinary state, runes (component-local or
  module-level) are cleaner and better-typed.

## Props, events, and structure

- **`$props()` with typed destructuring for inputs; `$bindable()` for opt-in two-way binding.** Props
  flow down: don't mutate a prop; make two-way binding explicit with `$bindable()` rather than
  assuming it.
- **Callback props replace `createEventDispatcher`.** Pass functions down as props (`onsave`,
  `ondelete`) for events up: they type cleanly and trace better than the old dispatcher.
- **Snippets replace slots for passing template chunks.** Use `{#snippet}` / `{@render}` for
  structural reuse instead of a wall of boolean props; let the parent inject the content.
- **Single responsibility; no god components.** Split a component that does many jobs; a big `{#if}`
  ladder over a variant usually wants a component map (`engineering-principles.md`).

## SvelteKit: server-side loading and form actions

- **Load data on the server in `+page.server.ts` / `+layout.server.ts` `load` functions.** Keep API
  keys and heavy fetching on the server, and avoid client-side request waterfalls. `load` returns
  data; the component renders it: the presentation/logic split.
- **Form actions for mutations.** Use SvelteKit form actions (progressive enhancement, works without
  JS) instead of hand-rolled client fetches for form submits; validate input server-side at the
  boundary (`backend-apis.md`).
- **`+server.ts` for API endpoints** (REST/webhooks), same backend rules: validate, one error shape,
  no business logic in the handler.
- **Prefer the server `load`/`use:enhance` path over `onMount`-fetching** for initial data, it's
  faster, SEO-friendly, and keeps secrets off the client.

## Styling and safety

- **Scoped `<style>` by default; design tokens are the theme system** (`frontend.md`): no hardcoded
  hex/spacing in components.
- **`{@html ...}` is a dangerous sink.** Sanitize with a parser before it, never a regex; prove the
  input is clean upstream.

## Red flags (refactor soon)

- `$effect` used to derive or sync state instead of `$derived`.
- Svelte 4 patterns in new code (`$:` labels, `createEventDispatcher`, stores for local state).
- A destructured `$state`/`$derived` that quietly lost reactivity.
- `fetch`/`axios` called directly in a component.
- `onMount` fetching data that a server `load` should provide.
- A god component or a long `{#if}` ladder over a variant.
- `{@html}` fed unsanitized input.
