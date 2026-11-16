# Vue best practices

Vue-specific (Vue 3 + `<script setup>` + TypeScript) rules that sit **on top of** `frontend.md`. The
general frontend rules: static-first, view/logic separation, props-down/events-up, design tokens,
sanitized sinks: still hold; this file names how they land in Vue and adds Vue-only conventions.
Read it whenever touching `.vue` files, composables, or stores.

## The layering (this is the whole model)

Everything below is one idea: **push logic and state down and out of components** so components stay
thin and anything reusable lives where it can be reused.

```
View            orchestrates a page (routing, wiring), minimal logic
 ├─ Components   render + emit; small, focused, reusable
 ├─ Composables  reusable reactive state / feature logic
 ├─ Stores       global shared state (Pinia)
 ├─ Services     external communication (API), no Vue dependency
 └─ Domain/Utils business rules, validation, calculations: pure, no Vue dependency
```

The litmus test for placement: **if you can't unit-test a piece of logic without mounting a
component, it's usually in the wrong layer.** A typical feature reads View → Composable → Service →
API, which is also what makes it testable in isolation (component tests, composable tests, service
tests) instead of one integration mess.

## Views vs. components: container vs. presentational

- **Views are containers.** Route-level components (`src/views/` or `src/pages/`, mapped in Vue
  Router). They read route params, kick off data fetching via composables/stores, coordinate several
  children, and handle page-level concerns. They stay **thin: mostly wiring, not implementation.**
- **Components are presentational** by default (`src/components/`). They receive data via props, emit
  events up, and don't know about routes, stores, or where their data came from. A component that
  reaches into a store or the router has usually taken on a container's job.
- A View that has grown to hundreds of lines of fetching + transforming + rendering is the smell:
  the fetching/transforming belongs in composables or a store, and chunks of template belong in
  extracted components.

## Component rules

- **Multi-word, PascalCase names** (`UserCard`, not `Card`; `TheHeader` for a single-instance
  component). Multi-word names avoid collisions with current/future HTML elements: an official Vue
  style rule.
- **Prefer `<script setup lang="ts">`.** Least verbose Composition API syntax, best TS inference,
  easiest to extract into composables. Reserve Options API for legacy code you're maintaining.
- **Single responsibility.** A component that fetches a list *and* renders an editable table *and*
  manages a modal is three components. Split it. Line count is a smell, not a law: under ~200 lines
  is comfortable, ~200–400 is a yellow flag, 400+ usually wants splitting.
- **Slots over boolean-prop pile-ups.** When you find yourself adding `showHeader`, `showFooter`,
  `showActions`…, reach for slots and let the consumer decide the content. Use named slots with
  fallback content for defaults.
- **`<style scoped>` by default** so components don't leak CSS into each other. Style values reference
  tokens (see `frontend.md`), never hardcoded hex/spacing.

### Props and emits

- **Type props; declare emits.** In TS projects the type-based form is the default:

  ```vue
  <script setup lang="ts">
  interface Props {
    user: User
    variant?: 'default' | 'compact'
  }
  const props = withDefaults(defineProps<Props>(), { variant: 'default' })

  const emit = defineEmits<{
    select: [id: string]
    delete: [id: string]
  }>()
  </script>
  ```

- **Type-based declaration gives compile-time safety, not runtime validation.** For components that
  take external/untrusted input (a shared UI kit, a boundary component), keep a runtime `validator`
  on the object form where a constraint can't be guaranteed by types alone. Inside your own app,
  type-based is enough.
- **Props down, events up: never mutate a prop.** Use `defineModel()` for idiomatic two-way binding
  instead of hand-rolling a `modelValue` prop + `update:modelValue` emit.

### Avoid prop drilling

Passing the same value through three-plus layers of components is a smell. Reach for a **Pinia
store** (shared state), **`provide`/`inject`** (a genuinely cross-cutting dependency for a subtree,
note it creates implicit coupling, so type the injection key and use it sparingly), or a
**composable**: whichever fits, instead of threading props through intermediaries that don't use
them.

## Reusability

The Vue 2 → 3 shift: **composables replaced mixins.** Mixins are discouraged, implicit property
merging, name collisions, and unclear provenance (you can't tell where a `this.foo` came from).
Everything a mixin did, a composable does explicitly. Your toolkit, roughly by frequency:

- **Composables**: reuse *stateful reactive logic* (the workhorse; see below).
- **Slots / scoped slots**: reuse *template structure* while the parent injects content.
- **Renderless components**: a component that manages logic and exposes it through a scoped slot,
  rendering no markup. Niche now that composables exist, but still handy for structure-agnostic logic.
- **Base / UI-kit components** (`BaseButton`, `BaseInput`): standardize the design system.

**Don't abstract too early.** Follow the Rule of Three (see `engineering-principles.md`): build the
feature, tolerate one duplicate, extract the shared component/composable on the third use. A wall of
`Base*` components created before any real need is speculative debt (YAGNI).

## Composables

A composable is a function using Composition API reactivity to encapsulate and reuse stateful logic.
Conventions that matter:

- **Name it `useX`** (`useFetch`, `usePagination`, `usePlantSearch`).
- **Return a plain object of refs** so consumers destructure while keeping reactivity intact.
- **Accept flexible arguments with `toValue()`** (Vue 3.3+) so a caller can pass a raw value, a ref,
  or a getter, and the composable stays reactive to changes.
- **Own your side effects and clean them up** with lifecycle hooks *inside* the composable: the
  registration and its matching teardown live together.

  ```ts
  // composables/useEventListener.ts
  import { onMounted, onUnmounted, toValue } from 'vue'

  export function useEventListener(target, event, handler) {
    onMounted(() => toValue(target)?.addEventListener(event, handler))
    onUnmounted(() => toValue(target)?.removeEventListener(event, handler)) // teardown mirrors setup
  }
  ```

- **Keep each composable focused on one concern; let composables call other composables.** That's how
  you compose complex behavior from small pieces: and it's the antidote to the *god composable*:
  a `usePlantManagement()` doing fetching + creation + deletion + uploads + reminders + reports grows
  to a thousand lines. Split into `usePlantQuery()`, `usePlantFilters()`, `usePlantImages()`, ….
- **Composables are for reactive logic, not pure functions.** A `useFormatDate()` that wraps a pure
  formatter shouldn't be a composable: it's a plain `formatDate()` in `utils/`. Reserve composables
  for logic that genuinely ties into reactivity or the component lifecycle.

### Composable vs. store

Often confused. The dividing line is **scope of the state**:

- **Composable**: state belongs to one feature/page, instantiated per use (`usePagination`,
  `useSearch`, `usePlantFilters`).
- **Pinia store**: state must be shared globally and outlive any single component (`useAuthStore`,
  `useSettingsStore`, `useUserStore`).

Rule of thumb: **single page → composable; shared across pages → store.** Keep stores organized by
domain, and keep *pure* calculations in plain modules the store calls rather than fattening the
store with business logic.

## Business logic layering

The place most Vue projects rot: business logic smeared across component methods. Give each kind a
home.

- **UI logic** → the component. Local view state like `const isModalOpen = ref(false)`.
- **Application logic** → a composable. Reactive, reusable, feature-scoped: `const filtered =
  computed(...)`, orchestration of services.
- **Domain logic** → plain JS/TS in `services/` or `utils/`, **no Vue dependency**, trivially
  unit-testable: `calculateInvoiceTotal()`, `canDeletePlant(plant, user)`, validation rules.

A rule like `canDelete = plant.status !== 'archived' && user.role === 'admin'` written inside a
component gets duplicated the moment a second component needs it: lift it to a pure function from
the start.

### Service layer for API access

Components never call `fetch`/`axios` directly. Route all external communication through a dedicated
service/repository module (`plantService.getAll()`, `createPlant()`, `deletePlant()`); composables
wrap those for reactivity. This centralizes API handling and makes testing/mocking straightforward.
(This is `frontend.md`'s "a component does not fetch" and the ports/adapters idea from
`external-integrations.md`, applied to Vue.)

```ts
// composables/usePlants.ts
export function usePlants() {
  const plants = ref<Plant[]>([])
  const loading = ref(false)

  async function loadPlants() {
    loading.value = true
    try {
      plants.value = await plantService.getAll()
    } finally {
      loading.value = false
    }
  }
  return { plants, loading, loadPlants }
}
```

## Using composables inside the Options API

There's no separate "Options API composable": composables are a Composition API feature. But you can
*use* one inside an Options API component through `setup()`: whatever `setup()` returns is merged onto
the instance and is reachable as `this.x` in `data`/`computed`/`methods`.

```vue
<script lang="ts">
import { useFetch } from '@/composables/useFetch'

export default {
  setup() {
    const { data: users, isLoading, error } = useFetch('/api/users')
    return { users, isLoading, error } // now available as this.users, etc.
  },
  computed: {
    selectedUser() {
      return this.users?.find(u => u.id === this.selectedId) // this.users came from setup()
    },
  },
}
</script>
```

Caveats specific to this mix:

- **Call composables synchronously at the top of `setup()`.** Any composable that registers lifecycle
  hooks or reads the current instance must run during setup: never inside a method or after an
  `await`.
- **`this` is not available in `setup()`.** If a composable needs a value that lives in `data()`, you
  can't hand it over from setup; either lift that state into the composable or share it as a ref both
  sides hold.
- **This is the recommended migration path off mixins.** Extract mixin logic into composables and
  adopt them one component at a time via `setup()`, rather than rewriting the whole app to Composition
  API at once. Green-field code should just use `<script setup>`.

## Red flags (refactor soon)

- Components > ~400–500 lines; Views > ~300 lines.
- Multiple API calls, or direct `axios`/`fetch`, inside components.
- Business rules living in templates or component methods.
- The same logic copied across components.
- God composables (one `use*` doing everything, hundreds of lines).
- Prop drilling through 3+ levels.
- A store mixing API logic, UI state, and business rules together.
- A component importing half the app.

A mature Vue codebase feels boring: views are thin, components are focused, composables are reusable,
services are predictable, and business rules exist independently of the UI.
