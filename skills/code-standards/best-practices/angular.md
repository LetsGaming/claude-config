# Angular best practices

Angular-specific rules (Angular 19/20+, standalone components, signals, TypeScript) that sit **on top
of** `frontend.md`. The general frontend rules: view/logic separation, props-down/events-up, design
tokens, sanitized sinks: still hold; this file names how they land in modern Angular and adds
Angular-only concerns. Read it whenever touching components, services, or route config.

## Standalone and signal-based is the default now

- **Standalone components: no NgModules for new code.** Import a component's dependencies directly in
  its `imports`. Don't reintroduce `NgModule` scaffolding.
- **Signals for reactive state.** `signal()` for state, `computed()` for derived values, `effect()`
  only for genuine side effects. Use the signal-based `input()` / `output()` APIs and `model()` for
  two-way binding rather than the older decorator forms.
- **`computed` over `effect`-to-sync.** Derived values are `computed()`: lazy and memoized; don't
  mirror one signal into another with an `effect()`. Reserve effects for DOM work, logging,
  or external synchronization.
- **Move toward zoneless change detection** (the modern default). New components use `OnPush` or
  signals throughout; don't rely on Zone.js-driven whole-tree change detection.

## Components thin; logic and data in services

- **Container vs. presentational.** Container components inject services and hold state; presentational
  components take `input()`s and emit `output()`s, do minimal logic, and use `OnPush`. Keep components
  focused on rendering.
- **Business logic and data access live in services**, provided `in: 'root'` (or a suitable scope).
  Components call services; they never embed `HttpClient` calls or business rules. A `fetch`/`HttpClient`
  call in a component is on the wrong side of a seam (`frontend.md`).
- **Depend on injected contracts, not concretions.** DI is Angular's strength: inject a typed service
  or an `InjectionToken`, wrap external systems behind a typed service (ports/adapters,
  `external-integrations.md`). Prefer the `inject()` function where it reads more cleanly than
  constructor injection.
- **No god components or god services.** Split by responsibility; a component that fetches, transforms,
  and renders three unrelated sections is three things (`engineering-principles.md`).

## Templates and control flow

- **Built-in control flow: `@if` / `@for` / `@switch`.** Use these over the old structural directives
  (`*ngIf`, `*ngFor`). `@for` **must** declare `track` with a stable id: never track by index for
  dynamic lists.
- **Props down, events up.** `input()` in, `output()` out; don't mutate inputs. Async data reaches the
  template via signals or the `async` pipe, not manual subscriptions stored in fields.

## Signals and RxJS, each for its job

- **Signals for state; RxJS for event streams and async coordination.** Now that signals exist, don't
  model simple component state as an observable. Bridge with `toSignal()` / `toObservable()` at the
  edges.
- **Never leak a subscription.** Prefer the `async` pipe or `takeUntilDestroyed()`; a manual
  `.subscribe()` without teardown is a bug.

## Routing, forms, styling, safety

- **Lazy-load routes** with `loadComponent` / `loadChildren` so the initial bundle stays small
  (`frontend.md`'s ship-less-JS discipline).
- **Typed reactive forms** for non-trivial forms; validate at the boundary, keep validation rules in
  one place rather than duplicated across template and submit handler.
- **Component-scoped styles by default; design tokens are the theme system**: no hardcoded
  hex/spacing in components.
- **`[innerHTML]` and bypassed sanitization are dangerous sinks.** Rely on Angular's built-in
  sanitization; only `bypassSecurityTrust*` on input proven clean upstream, never on user content.

## Red flags (refactor soon)

- New code adding NgModules instead of standalone components.
- `effect()` used to derive or sync state instead of `computed()`.
- `HttpClient` or business rules inside a component.
- `*ngIf`/`*ngFor` in new templates; `@for` without `track`, or tracking by index.
- Manual `.subscribe()` with no `takeUntilDestroyed()`/async pipe.
- Observables modeling what should be a signal.
- A god component/service doing several unrelated jobs.
- `bypassSecurityTrustHtml` on user-supplied content.
