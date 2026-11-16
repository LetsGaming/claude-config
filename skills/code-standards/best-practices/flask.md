# Flask best practices

Flask-specific rules (Flask 3.x, Python) that sit **on top of** `backend-apis.md`. Flask is a
minimal WSGI micro-framework: it gives you routing and request/response and nothing else, so the
general backend layering (route → validation → service → data, no logic in handlers, one error path,
config-once, a security baseline) is entirely on you to build. This file names how those land in Flask
and adds Flask-only concerns (read `data-persistence.md`, `external-integrations.md` too). Applies
whenever touching views, blueprints, or app setup.

## Impose the structure Flask doesn't give you

- **App factory + blueprints.** Build the app in a `create_app()` factory and organize routes into
  blueprints per domain. This avoids a global `app` object and circular imports, and it lets tests and
  environments construct the app with different config. Don't grow one giant `app.py` with a
  module-level `app`.
- **Thin view functions.** A view validates input, calls a **service**, and shapes the response: no
  business rules, no raw DB access inline (`backend-apis.md`, `data-persistence.md`). Keep blueprints
  focused; no god blueprint.

## Validate at the boundary: Flask won't

- **Never trust `request.json` / `request.args` / `request.form`.** Flask has no built-in validation,
  so add a schema layer (pydantic or marshmallow): one schema per input, validated at the edge, then
  hand the typed value to the service (`backend-apis.md`, `types-and-contracts.md`). Don't re-check ad
  hoc downstream.

## One error handler; typed failures

- **Register error handlers centrally** with `@app.errorhandler` / `register_error_handler` (or on the
  blueprint) and map exceptions to responses there. Don't build `jsonify({'error': …}), 400` by hand
  in every view: that duplication drifts, and it leaks internals if you're not careful.
- **Raise typed/domain exceptions** from services and translate them in the one place.

## Data access and migrations

- **Queries live in a data module / SQLAlchemy models, not in views.** SQLAlchemy parameterizes for
  you: don't string-build SQL. Encapsulate query logic behind functions/repository objects rather
  than scattering session queries across views (`data-persistence.md`).
- **Versioned migrations** via Alembic / Flask-Migrate; never hand-edit the schema or an applied
  migration.

## Config, extensions, secrets

- **Config once, from the environment.** Load config from an object/env at app creation; read secrets
  (`SECRET_KEY`, DB URL, API keys) from the environment: never commit them.
- **Initialize extensions through the factory** (`db.init_app(app)`, `migrate.init_app(app, db)`) so a
  single configured instance is shared, not re-created per import.

## Security baseline

- **`SECRET_KEY` from env; secure session cookies** (`HttpOnly` + `SameSite` + `Secure` in prod);
  **CSRF protection for forms** (Flask-WTF); a rate limiter (Flask-Limiter) on public writes; CORS
  locked to known origins. **Never run `debug=True` in production** (`backend-apis.md`).

## Know the WSGI/sync model

- **Flask is synchronous WSGI**: a blocking call ties up a worker for the whole request. Scale with
  multiple workers/threads (gunicorn/uWSGI), and push slow or long-running work (email, exports,
  third-party calls) to a task queue (Celery/RQ), not the request path. Flask 3's `async def` view
  support is limited: it is not a general async framework; don't treat it like one.

## Red flags (refactor soon)

- One giant `app.py` with a global `app` instead of a factory + blueprints.
- Business logic or raw DB/session queries inside a view.
- Unvalidated `request.json`/`request.args` flowing into logic (no schema layer).
- `jsonify(error)` hand-built across views; no central error handler.
- Secrets or `SECRET_KEY` committed; `debug=True` in production; missing CSRF on forms.
- Hand-built SQL strings; schema changed without an Alembic migration.
- Slow/blocking work done inline in the request instead of a task queue.
