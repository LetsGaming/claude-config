# Astro best practices

Astro-specific rules (Astro 6+, `.astro` + islands + TypeScript) that sit **on top of**
`frontend.md`. The general "ship the least JavaScript that does the job" rule is Astro's entire
premise: this file names how it lands and adds Astro-only concerns. Read it whenever touching
`.astro` files, islands, content collections, or the rendering config.

## Astro 6 specifics (they bite on upgrade)

- **Node 22+ is required.** Astro 6 drops Node 18/20 and upgrades internals to Zod 4 and Vite 7.
  Check dev *and* deploy environments run Node 22.12+.
- **Import `z` from `astro/zod`, not `astro:content`/`astro:schema`.** Astro 6 deprecates the old
  Zod re-exports (in collection schemas *and* Action input schemas). Use `import { z } from 'astro/zod'`
  everywhere: it also keeps you on the same Zod version Astro uses internally.
- **Know what's actually new in 6 vs. what isn't.** New/stabilized in 6: the built-in **Fonts API**,
  the **CSP API**, **Live Content Collections**, and a rebuilt dev server (Vite Environment API: dev
  now runs the production runtime, including on Cloudflare/Bun/Deno). *Not* new to 6 (all Astro 5):
  the Content Layer, Server Islands, Actions, and `astro:env`. Don't attribute the older features to 6.

## Static-first; hydrate the leaves, not the trunk

- **`.astro` components render to zero-JS HTML on the server.** They are the default. Reach for a
  framework island (React/Vue/Svelte/Solid) *only* for a piece that must run in the browser.
- **Islands are leaves, not the trunk.** Never wrap a whole page or layout in one `<Site client:load />`
  island: that rebuilds the SPA Astro exists to avoid and ships the entire tree to the client. Keep
  the shell static and drop small islands where interactivity actually lives.
- **Standardize on one UI framework unless there's a real reason not to.** Each framework you add
  ships its own runtime for its islands; React + Vue + Svelte on one page means three runtimes. Adding
  a second framework is a dependency decision (YAGNI), not a default.

## Choose the `client:` directive deliberately

Hydration is opt-in per island: pick the cheapest directive that works, don't default everything to
`client:load`:

- **`client:visible`**: hydrate when scrolled into view. The right default for anything below the
  fold.
- **`client:idle`**: hydrate once the main thread is idle. Good for non-urgent above-the-fold widgets.
- **`client:load`**: hydrate immediately. Reserve for genuinely above-the-fold, immediately-interactive
  pieces.
- **`client:media="..."`**: hydrate only at a breakpoint (e.g. a mobile-only menu).
- **`client:only="react"`**: skips SSR entirely (no server HTML, must name the framework). Last resort,
  for components that can't render on the server; costs you the static fallback, so use sparingly.

## Props into islands: finished and serializable

- **Pass the minimal, finished, serializable data an island needs.** Island props are serialized
  (and for server islands, encrypted): you can't pass functions, class instances, or live objects,
  and a fat prop payload bloats the HTML. Compute in the `.astro` frontmatter, hand down a plain
  object.
- **Do data fetching in `.astro` frontmatter** (top-level `await`, at build or request time), not
  inside islands, wherever possible. An island that fetches on mount is the client-fetch seam
  violation from `frontend.md`.

## Islands don't share a tree: avoid cross-island state

Islands hydrate in isolation; there's no shared component tree, so two islands can't pass props or
context to each other. If they genuinely must share state, use a tiny external store (**Nano Stores**),
not a full framework store. But first ask whether they need to be separate islands at all: often
the right fix is one island wrapping both interactive parts. Cross-island shared state is a smell to
justify, not a default (YAGNI).

## Content Collections are the typed content boundary

- **Define collections with a schema; validate at build.** Use `astro:content` with a Zod schema
  (`import { z } from 'astro/zod'`: see Astro 6 specifics) so bad frontmatter fails the build, not
  production. Prefer the Content Layer loader API (`loader: glob({ ... })` from `astro/loaders`) over
  the legacy collection type. Query type-safely via `getCollection` / `getEntry`: never hand-roll
  `fs` reads or `import.meta.glob` over markdown, and never index frontmatter by a stringly-typed key.
- **External content goes through the Content Layer, not scattered fetches.** For a CMS/API/database
  source, write a loader so it lands in the same typed store as local markdown, instead of ad-hoc
  `fetch` calls sprinkled across pages (this is the ports/adapters idea from `external-integrations.md`
  applied to content).

## Rendering mode per route; render from your own store

- **Static by default; opt individual routes into SSR** (`export const prerender = false`, or the
  inverse depending on `output` mode). Choose per route: don't flip the whole site to SSR because one
  page needs a request-time value.
- **Render from your own data/store, never from an upstream on the request path.** A dead upstream
  should be stale content, not a 500. Fetch at build, or isolate the live bit in a cached server
  island: don't put a bare upstream `fetch` in a request-path route.
- **Server Islands (`server:defer`) for the dynamic slice of an otherwise static page.** Personalized
  or slow content (an avatar, a cart, presence, a legacy-backed widget) renders per-request while the
  shell stays cached at the edge. Always give a fallback via the `slot="fallback"`.

## Mutations: Astro Actions over hand-rolled fetch

- **Astro Actions for typed server mutations** (forms, RPC). Define the action once, validate input
  with a schema, call it from the client through the generated typed client: one source of truth for
  the contract, validated on the server. Prefer this over a hand-written `fetch` to a bespoke API
  route for form handling.
- **API endpoints (`src/pages/api/*.ts`) for REST/webhooks** and anything Actions don't fit. Same
  backend rules as `backend-apis.md`: validate at the boundary, one error shape, no business logic
  smeared into the handler.

## Styling, assets, safety

- **Scoped `<style>` by default; design tokens are the theme system** (see `frontend.md`): no
  hardcoded hex/spacing in components.
- **Use `<Image>` / `<Picture>`** for images (AVIF/WebP, correct `loading`/`decoding`, no layout
  shift). **Self-host fonts via the Fonts API**: no third-party font CDN.
- **`set:html` is a dangerous sink.** Sanitize with a parser before it (never a regex). Turn on the
  CSP API where it fits.
- **Env vars go through `astro:env`, not raw `import.meta.env`.** Define a typed schema
  (`envField` in `astro.config`, `context`/`access` per var) so variables are validated and a
  `server`+`secret` value can never land in a client bundle. Never import server-only code into a
  client island.
- **`<ClientRouter />` (view transitions) is not free.** It ships a few KB and turns navigation into
  client-side swaps that can reset or preserve island state in surprising ways. Adopt deliberately;
  use `transition:persist` for state that must survive a navigation.

## Red flags (refactor soon)

- The whole page hydrated as one big island; `client:load` on everything.
- An island fetching its own data on mount that the frontmatter could have fetched.
- A bare upstream `fetch` on a request-path route (no build-time fetch, no cached server island).
- Markdown read by hand (`fs`/`glob`) instead of a typed content collection.
- Cross-island global store standing in for what should be one island.
- Three UI-framework runtimes on one page with no real need.
- `set:html` fed unsanitized input.
- Legacy Zod import (`z` from `astro:content`/`astro:schema`) instead of `astro/zod` (Astro 6).
- Raw secrets via `import.meta.env` instead of `astro:env`; a server secret reachable from an island.
