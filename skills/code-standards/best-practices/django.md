# Django best practices

Django-specific rules (Django 5.x, DRF for APIs, TypeScript-free Python) that sit **on top of**
`backend-apis.md` and `data-persistence.md`. The general backend layering: validate/authorize at the
edge, no business logic in the request handler, one error path, config-once, a security baseline,
still holds; Django is batteries-included, so most of this is about *using its batteries correctly*.
Applies whenever touching views, models, serializers, migrations, or settings.

## Thin views; logic in services and the model layer

- **Views validate/authorize and delegate: they don't hold business rules.** The "fat view" is the
  Django form of a rule-bearing handler (`backend-apis.md`). Put domain logic on model methods for
  behavior that belongs to an entity, and in a dedicated `services.py` module for multi-model
  workflows/decisions. Keep function- or class-based views thin either way.
- **No god app.** One Django app per bounded domain, each focused; don't let one app accumulate every
  model and view.

## The ORM is your data layer: keep queries in managers

- **Encapsulate query logic in custom `Manager` / `QuerySet` methods** (`Article.objects.published()`),
  not as `.filter()` chains copy-pasted across views. That's the repository seam in Django terms
  (`data-persistence.md`).
- **Kill N+1 queries** with `select_related` / `prefetch_related`; reach for `.only()`/`.defer()` and
  `annotate`/aggregate where it pays. Prefer the ORM; if you must drop to raw SQL, parameterize it,
  never string-format user input into a query.
- **Migrations are the schema source of truth.** Always `makemigrations`; review the generated file;
  never hand-edit the database or an already-applied migration; keep them forward-only in production
  (`data-persistence.md`).

## APIs: let DRF serializers be the single validation source

- **Serializers validate *and* serialize**: one definition for the shape, used both directions. Don't
  hand-parse `request.data` or re-validate in the view (`backend-apis.md`, `types-and-contracts.md`).
- **Use generic views / ViewSets + permission classes for authorization**, not per-view `if
  user.is_x` ladders. Keep the permission logic in one reusable place.

## Settings, config, secrets

- **Split settings per environment** (base + dev/prod) and read secrets from the environment
  (`django-environ` or equivalent): never commit `SECRET_KEY`, DB creds, or API keys. Config is read
  once, not scattered.
- **Production hardening is non-negotiable:** `DEBUG = False`, a real `ALLOWED_HOSTS`, HTTPS/HSTS,
  secure + `HttpOnly` session/CSRF cookies. Run `manage.py check --deploy` and act on it.

## Don't disable Django's security defaults

Django ships strong defaults: **keep them**: CSRF protection, ORM query parameterization, template
autoescaping, and the auth/permissions framework. Use the built-in auth and password hashing rather
than rolling your own; escape-by-default in templates and only mark safe what you've sanitized.

## Async and background work

- **Async views/ASGI help I/O-bound endpoints, but the ORM is still largely synchronous.** Don't
  assume `await`-ing a queryset works; use the async ORM methods where they exist or `sync_to_async`
  deliberately, and don't mix blocking ORM calls into an async view unguarded.
- **Long/slow work goes to a task queue (Celery/RQ), not the request path**: email, exports,
  third-party calls. A dead upstream shouldn't hold a worker (`external-integrations.md`).

## Red flags (refactor soon)

- Business logic living in views (fat views) instead of models/services.
- `.filter()` chains duplicated across views instead of manager/queryset methods.
- N+1 queries; raw SQL with interpolated user input.
- Hand-parsing `request.data` instead of a serializer; per-view permission ladders.
- `DEBUG = True`, wildcard `ALLOWED_HOSTS`, or `SECRET_KEY`/creds committed to the repo.
- Disabled CSRF or `mark_safe` on unsanitized content.
- Blocking ORM calls in an async view; slow work done inline in the request.
- A god app holding unrelated domains.
