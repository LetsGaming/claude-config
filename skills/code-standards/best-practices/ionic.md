# Ionic best practices

Ionic-specific rules (Ionic 8+ web components + Capacitor, on Angular/React/Vue, TypeScript) that sit
**on top of** `frontend.md` **and the base-framework guide**. Ionic is a UI-and-native layer over a
host framework: it doesn't replace that framework's rules. Read it alongside `angular.md`,
`react.md`, or `vue.md` (whichever hosts the app) plus `frontend.md`. Applies whenever touching
`ion-*` components, Ionic routing, Capacitor plugins, or native config.

## Ionic sits on top of your framework: the base rules still hold

- **Ionic is UI + platform, not an architecture.** Component/logic separation, services, and the host
  framework's reactivity model (signals / composables / hooks) all still apply exactly as in the base
  guide. Ionic changes the *components and navigation*, not where business logic lives. A `fetch` or a
  business rule inside an Ionic page is the same seam violation it would be anywhere.
- **Use the modern host integration.** `@ionic/angular/standalone` (standalone components, no
  NgModule), `@ionic/react` with hooks, or `@ionic/vue` with `<script setup>`: match the base guide's
  defaults, don't fall back to legacy module patterns.

## Ionic Framework and Capacitor are two separate things

A near-universal confusion worth keeping straight:

- **Ionic Framework** = the framework-agnostic web-component UI toolkit (platform-adaptive components,
  gestures, transitions).
- **Capacitor** = the native runtime (a WebView + a typed bridge to native APIs). It packages any web
  app as an iOS/Android/PWA binary.

You can use either without the other. Keep the mental model clean: UI decisions are Ionic Framework;
native/device decisions are Capacitor.

## Use the platform components; don't rebuild them

- **Reach for `ion-*` components** (modal, list, tabs, refresher, datetime, sliding items, condensed
  headers) instead of hand-rolling equivalents. They ship accessibility, touch gestures, iOS/Material
  (`md`) mode adaptation, and safe-area handling you'd otherwise reimplement badly.
- **Respect Ionic's routing integration.** Use `IonRouterOutlet` (and the host framework's router
  binding) for stack-based page navigation: that's what gives native transitions and a correct back
  stack. Don't bypass it with manual DOM swaps or ad-hoc route changes, or you lose both.

## Mind the Ionic page lifecycle: it is not the framework lifecycle

Ionic keeps pages in a navigation stack and **reuses them**, so a page's DOM often stays mounted when
you navigate away and back. Framework mount/unmount does **not** fire on every enter/leave.

- **Put enter/leave logic in Ionic's lifecycle hooks**: `ionViewWillEnter` / `ionViewDidLeave` (or
  the React/Vue equivalents): not in `mounted`/`onMounted`/`ngOnInit`/`useEffect(..., [])`, which run
  once and won't re-run on re-entry. Refetch-on-enter, pause-timers/subscriptions-on-leave belong
  here. Assuming "mount = every visit" is the classic Ionic bug.

## Native access behind a service with a web fallback

- **Wrap every Capacitor plugin in a typed service** (ports/adapters, `external-integrations.md`),
  components call the service, never the plugin directly. This is what makes native code testable,
  mockable, and swappable.
- **Branch on platform and degrade gracefully.** Gate native-only calls behind
  `Capacitor.isNativePlatform()`; provide a sensible web fallback so the same codebase runs as a PWA.
- **Request permissions explicitly and handle denial** as a normal path, not an exception.
- **Minimize bridge chatter.** Every WebView↔native round-trip has overhead: batch calls, cache
  results, and never poll a native API in a tight loop. Keep core logic in JS/TS.
- **Prefer well-maintained plugins; avoid bleeding-edge native dependencies.** Native plugin
  upkeep is long-term cost (upgrades, platform config); a poorly-maintained plugin is debt you pay
  every OS release. Minimal dependencies (YAGNI) matters more here than on the pure-web side.

## Theming, platform, performance

- **Theme with Ionic CSS variables (`--ion-*`) and design tokens** (`frontend.md`): never hardcode
  hex/spacing. Dark mode through Ionic's palette/class, not bespoke overrides. Honor safe-area insets
  (`--ion-safe-area-*` / `env(safe-area-inset-*)`) so content clears notches and home indicators.
- **Platform-adaptive styling via mode** (`.ios` / `.md`) rather than sniffing user agents in JS.
- **Animate `transform` and `opacity` only** (GPU-accelerated); avoid layout-thrashing properties and
  expensive DOM manipulation. Use a virtual/large list for long collections, lazy-load routes, and let
  `ion-content` own scrolling instead of nesting scroll containers.

## Config & secrets

- **`capacitor.config.*` and the generated native projects are build inputs**: keep secrets out of
  them and out of the bundle; use environment config. Treat the native `ios/`/`android/` folders as
  code you review, not generated throwaway.

## Red flags (refactor soon)

- Business logic or a raw `fetch` inside an `ion-*` page (host-framework seam ignored).
- Enter/leave logic in `onMounted`/`ngOnInit`/`useEffect([])` that silently doesn't re-run on
  re-navigation.
- Capacitor plugins called directly from components, with no web fallback or platform guard.
- Hand-rolled modal/list/tabs instead of the `ion-*` component.
- Manual route/DOM swapping that bypasses `IonRouterOutlet` (no transitions, broken back stack).
- Hardcoded colors/spacing instead of `--ion-*` variables; ignored safe-area insets.
- Tight-loop or per-frame native bridge calls.
- Bleeding-edge or unmaintained native plugins pulled in early.
