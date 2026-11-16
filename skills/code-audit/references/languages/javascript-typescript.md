# JavaScript / TypeScript: Audit Reference

Covers Node.js backends (Express, Koa, Fastify, NestJS) and front-ends (React, Vue, Angular,
Svelte, Next.js). The scanner runs `npm audit` when a `package-lock.json` exists and `eslint` when
a local install is present; `semgrep` if installed. Verify leads against the code.

## Tools (exact commands)
```bash
npm audit --json                          # in the dir with package-lock.json: dependency CVEs
npx --no-install eslint -f json .         # if eslint + config present in the project
semgrep scan --config auto --json <root>  # if installed
# TS type safety:
npx tsc --noEmit                          # surfaces type errors the project may be ignoring
```
Note whether `tsconfig.json` has `strict: true`, non-strict TS hides many bugs (implicit `any`,
nullability). Flag `strict: false`/missing as a quality finding.

## Security patterns to look for
- **Code execution:** `eval`, `new Function`, `setTimeout/setInterval("string")`,
  `child_process.exec(userInput)` (use `execFile`/`spawn` with an arg array), `vm` with untrusted
  code.
- **XSS (front-end):** `dangerouslySetInnerHTML` (React), `v-html` (Vue), `[innerHTML]`/
  `bypassSecurityTrust*` (Angular), `{@html}` (Svelte), direct `element.innerHTML = userData`,
  `document.write`. **Safe:** React `{value}` / Vue `{{ value }}` / Angular `{{ }}` auto-escape,
  note as a mitigation. `href={userUrl}` allowing `javascript:` is an XSS vector.
- **SQL/NoSQL injection:** template literals inside `query(\`… ${x}\`)`; Mongo queries built from
  raw `req.body` (operator injection like `{$gt: ''}`; also `$where` with input). **Safe:**
  parameterized `query('… $1', [x])`, prepared statements, ORM/ODM query builders.
- **SSRF:** `fetch`/`axios`/`http.get`/`request` to a user-supplied URL server-side.
- **Path traversal:** `fs.readFile(path.join(base, req.params.file))` without containment;
  `res.sendFile(userPath)`.
- **Prototype pollution:** deep-merge/`Object.assign`/`lodash.merge` of untrusted objects onto
  targets, or `obj[userKey] = val` with `__proto__`/`constructor` keys. A classic Node vuln.
- **Crypto / TLS:** `Math.random()` for tokens (use `crypto.randomBytes`); `crypto.createHash('md5'
  |'sha1')` for security; `rejectUnauthorized: false`; `NODE_TLS_REJECT_UNAUTHORIZED=0`.
- **Secrets & config:** hardcoded keys/tokens; `.env` committed; secrets in front-end bundles
  (anything in client code is public: flag secrets shipped to the browser); permissive CORS
  (`cors()` with no options = reflect any origin) especially with credentials.
- **JWT/auth:** `jwt.verify` with `algorithms` not pinned (or `jwt.decode` used as if it
  verifies); secret hardcoded; no expiry. Express: sensitive routes missing auth middleware.
- **Regex DoS (ReDoS):** user input tested against a catastrophic-backtracking regex.

## Framework specifics
- **Express/Koa/Fastify:** auth is manual middleware, verify it's applied to every protected
  route (look for routes defined without the guard). Check `helmet` (security headers) presence,
  body size limits, and error handlers that don't leak stacks. `app.use(cors())` config.
- **NestJS:** guards (`@UseGuards`) on controllers, check coverage. `ValidationPipe` for input.
- **Next.js:** API routes (`pages/api` / route handlers) are backend, audit them like Express.
  `getServerSideProps` running with user input. Env: only `NEXT_PUBLIC_*` should be client-side;
  a secret without that prefix leaking into client code is a finding. `dangerouslySetInnerHTML`.
- **React/Vue/Angular (client):** trust boundary is at the API, not the browser, client-side
  validation is not a security control. Flag secrets/business logic that assume the client can't
  be tampered with.

## Common non-security bugs
- **`==` vs `===`** (type coercion surprises); truthy/falsy traps with `0`/`''`/`null`.
- **`async`/`await` misuse:** unhandled promise rejections; missing `await` (fire-and-forget);
  `forEach` with async callbacks (doesn't await); no `try/catch` around awaited calls.
- **Floating-point money;** `parseInt` without radix; mutating shared state; closure-in-loop with
  `var`.
- **Error handling:** empty `catch {}`; swallowing rejected promises; callbacks ignoring the
  `err` first arg.
- **Node:** unbounded concurrency; blocking the event loop with sync FS/CPU; not closing streams.

## Dependency notes
Manifests/lockfiles: `package.json` + `package-lock.json`/`yarn.lock`/`pnpm-lock.yaml`. Flag
`^`/`~`/`*` ranges as unpinned-ish (lockfile mitigates if committed). Prioritize `npm audit` CVEs.
Watch for very large dependency trees and packages pulled in for trivial functionality (supply-
chain surface). Security-sensitive libs: express, jsonwebtoken, axios, lodash, ws, node-fetch,
serialize-javascript, and anything doing auth/crypto.
