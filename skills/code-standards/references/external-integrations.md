# External integrations

Rules for anything that talks to a system you don't control: third-party APIs, internal services,
webhooks. Read this when adding or editing an integration or a background sync.

## Put every upstream behind a port
Depend on a **contract/interface**, not a concrete integration. Callers work against the port; each
integration is an adapter implementing it. The rest of the system can't tell one adapter from
another: which means you can swap, mock, or add one without touching callers.

## Split I/O from transformation
Keep the network call (raw upstream shapes) separate from normalization (a **pure, testable**
function from raw → domain type). Adapter-specific quirks: pagination, odd field names, auth style,
stay **inside** the adapter and never leak outward.

## One shared resilient client: not per-integration, not a blind retry
Build the resilience once at the boundary and let every adapter inherit it:
- **Always time out.** A hanging call is worse than a failed one: bound it with a deadline.
- **Return a typed failure** (`Result<T>`), not a thrown exception: a slow/unavailable upstream is
  expected, not exceptional.
- **Cache / conditional-fetch** where the protocol allows (validators/ETags, short TTLs) to cut load
  and cost.
- The fix for flakiness is **a timeout, a cache, or a fallback: not a retry loop.** Retry only with
  backoff and only where the operation is idempotent.

```ts
async function fetchJson<T>(url, opts): Promise<Result<T>> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(opts.timeoutMs ?? 5000),
      headers: opts.etag ? { "If-None-Match": opts.etag } : {} });
    if (res.status === 304) return { ok: true, value: opts.lastGood };
    if (!res.ok) return { ok: false, error: httpError(res.status) };
    return { ok: true, value: await res.json() as T };
  } catch (e) { return { ok: false, error: isTimeout(e) ? timeout() : network(e) }; }
}
```

## Scripts an agent runs

Throwaway and operational scripts get the same discipline, in a smaller form:

- 30 second request timeout on every call. No exceptions.
- A total time budget for the whole script, not just per request, so a slow upstream cannot stall a session.
- Never honor a `Retry-After` above 60 seconds without telling the user first. A compliant script can otherwise sleep for an hour.

## Degrade, don't fail
Don't fetch from an upstream on the critical render/response path if you can serve a stored
last-good value instead. Design so a dead upstream produces stale data, not an error: and where a
live call is unavoidable, bound it tightly (timeout + short cache) so it can't stall the response.

## Mock every integration and cover the contract
Ship a deterministic mock beside every real adapter (so dev/CI/offline still works). Then write **one
contract test suite against the port** and run it twice: against the mock always, and against the
real adapter behind a flag or nightly job. Testing only the mock lets the mock and the real service
drift apart silently: the contract test is what keeps "callers can't tell the difference" true.

## Registration & config
Select adapters by configuration (real when credentials exist, else a mock in dev). Keep activation
rules in one registry, and pull shared defaults into named constants rather than repeating them.
