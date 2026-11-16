# Security Review Checklist

Language-agnostic security classes to check, each with what to look for, how to confirm it's
real (so you don't false-positive on framework protections), and the fix direction. Pair this
with the language reference for framework-specific patterns and the exact scanner commands.

Work down this list against the attack surface you mapped in `methodology.md`. For each class,
either produce a finding with a confirmed `file:line`, or note "checked, no issue found" when
you actively looked.

## 1. Secrets & credential management
- **Look for:** hardcoded API keys, passwords, tokens, private keys; committed `.env`, `.pem`,
  `credentials.json`; secrets in source, config, CI files, or Docker `ENV`.
- **Confirm:** the value is a real live-looking secret in a tracked file (not a placeholder like
  `your-key-here` or a test fixture). The secret-scan baseline flags these; verify the file is
  committed and the value is real.
- **Severity:** a live production credential in the repo is Critical.
- **Fix:** move to env vars / a secret manager; rotate the exposed secret; add to `.gitignore`;
  scrub git history if it was committed.

## 2. Injection (SQL / NoSQL / command / LDAP / template)
- **Look for:** queries or commands built by string concatenation/interpolation from input:
  `"... WHERE id=" + x`, f-strings/template literals inside `execute`/`query`, `os.system`/
  `exec`/`eval`/shell calls with user data, `${input}` inside a rendered template.
- **Confirm: and avoid false positives:** a **parameterized** query (`%s`/`?`/named binds with
  values passed separately) is safe; an ORM call with structured filters is safe; a constant
  string with no input is safe. It's only injection if untrusted input reaches the interpreter
  as code/query text.
- **Severity:** unauth SQLi or command injection is typically Critical.
- **Fix:** parameterized queries / prepared statements; ORM query builders; for shell, avoid the
  shell entirely (pass an argument list, no `shell=True`); allow-list, never blocklist.

## 3. Authentication
- **Look for:** missing auth on sensitive routes; weak password hashing (`md5`/`sha1`/plain);
  hardcoded/default credentials; JWTs with `alg=none`, no signature verification, or a hardcoded
  secret; session tokens that are predictable or never expire; no lockout/rate limit on login.
- **Confirm:** trace a sensitive endpoint and check there's an enforced auth check before the
  logic; open the password code and see the algorithm; open JWT verification and check the
  algorithm is pinned and the secret comes from config.
- **Fix:** a vetted auth library; bcrypt/scrypt/argon2 for passwords; verify JWT signature with a
  pinned algorithm and a secret from the environment; expiry + rotation; rate-limit auth.

## 4. Authorization / access control (IDOR / BOLA)
- **Look for:** endpoints that read/update a resource by ID **without checking the caller owns
  it** (`/orders/{id}` returns any order); role checks missing or done client-side only; admin
  functions reachable by normal users.
- **Confirm:** find a resource-by-id handler and check whether it scopes to the current user /
  verifies role server-side. Missing scoping = IDOR.
- **Severity:** often High–Critical (one user reading/altering another's data).
- **Fix:** enforce ownership/role checks server-side on every access; scope queries to the
  authenticated principal; centralize authorization.

## 5. Input validation & output encoding
- **XSS:** user data rendered into HTML without escaping; `innerHTML`/`dangerouslySetInnerHTML`/
  `v-html`/`|safe`/`mark_safe`/`render_template_string` with input. Confirm the framework's
  auto-escaping isn't being bypassed. Fix: escape on output, use the framework's safe rendering,
  avoid raw-HTML sinks.
- **SSRF:** server makes an outbound request to a user-supplied URL. Fix: allow-list hosts, block
  internal ranges/metadata IPs, disable redirects to internal.
- **Path traversal:** file paths built from input (`open(base + filename)`) allowing `../`. Fix:
  canonicalize and confirm the resolved path stays within the intended dir; use safe join.
- **Open redirect:** redirect target from input. Fix: allow-list targets / relative paths only.
- **XXE:** XML parser with external entities enabled. Fix: disable DTD/external entities.

## 6. Insecure deserialization
- **Look for:** `pickle.loads`, `yaml.load` (unsafe loader), PHP `unserialize`, Java
  `ObjectInputStream`, .NET `BinaryFormatter`/`TypeNameHandling`, Ruby `Marshal.load` on
  untrusted data.
- **Severity:** deserializing attacker-controlled data is often RCE → Critical.
- **Fix:** use safe formats (JSON) and safe loaders (`yaml.safe_load`); never deserialize
  untrusted input into arbitrary types.

## 7. Cryptography
- **Look for:** weak algorithms (MD5/SHA1 for security, DES, RC4, ECB mode); hardcoded keys/IVs;
  static/zero IV; `Math.random`/non-CSPRNG for tokens; home-rolled crypto; disabled cert
  verification (`verify=False`, `rejectUnauthorized:false`, `InsecureSkipVerify`,
  `NODE_TLS_REJECT_UNAUTHORIZED=0`).
- **Fix:** AES-GCM (or a high-level library like libsodium/`cryptography`); random IV per
  message; a CSPRNG for tokens (`secrets`, `crypto.randomBytes`); never disable TLS verification.

## 8. Dependencies & supply chain
- **Look for:** known-vulnerable versions (from `pip-audit`/`npm audit`/`bundler-audit`);
  unpinned or wildcard versions; abandoned/unmaintained packages; typosquat-looking names;
  `curl | bash` in setup/CI; unpinned CI actions (`uses: x/y@v2` vs a pinned SHA).
- **Fix:** upgrade to patched versions; pin versions and lockfiles; remove unused/abandoned deps;
  pin CI actions to a SHA; enable automated dependency scanning.

## 9. Configuration & transport
- **Look for:** debug mode enabled in production config; verbose errors/stack traces returned to
  clients; permissive CORS (`Access-Control-Allow-Origin: *` with credentials); missing security
  headers (CSP, HSTS, X-Frame-Options); default/exposed admin, actuator, or debug endpoints;
  directory listing; overly broad cloud/bucket permissions in IaC.
- **Fix:** disable debug in prod; generic error responses (log details server-side); tighten CORS
  to known origins; add security headers; lock down or remove exposed management endpoints;
  least-privilege IaC.

## 10. Denial of service & resource handling
- **Look for:** unbounded input (no size limits on uploads/requests); regexes vulnerable to
  catastrophic backtracking (ReDoS); unbounded loops/recursion on input; missing pagination on
  large queries; missing rate limiting; zip/XML bombs.
- **Fix:** enforce size/time limits; bound and validate; paginate; rate-limit; use safe regex.

## 11. Logging, error handling, and data exposure
- **Look for:** secrets/PII written to logs; stack traces or SQL errors leaked to users; sensitive
  data in URLs/query strings; PII returned in API responses beyond what's needed.
- **Fix:** redact secrets/PII from logs; generic client errors; keep sensitive data out of URLs;
  return only necessary fields.

## Reporting security findings
Group findings by the class above only if helpful; the primary output is the single ranked table
(see the report template). For each security finding, the "why it matters" line should state the
concrete impact ("unauth attacker can read any user's orders"), and the fix must be specific to
this project's framework and version. Note framework mitigations you relied on when you decided
something was *not* a finding: that shows the check was real.
