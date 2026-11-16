# Python: Audit Reference

Framework-aware patterns, common bugs, and the exact tools for auditing Python. Frameworks you'll
most often see: Django, Flask, FastAPI. The scanner script installs and runs `ruff` and `bandit`
automatically and runs `pip-audit` for dependency CVEs: treat their output as leads to verify.

## Tools (exact commands)
```bash
ruff check --select E9,F,B,S,ASYNC,PERF,BLE,DTZ --output-format json <root>   # errors+bugs+security+perf
bandit -r <root> -f json -q                                                    # security-focused
pip-audit -r requirements.txt -f json                                          # dependency CVEs (needs network)
# extra if installed:
semgrep scan --config auto --json <root>
```
Bandit test IDs worth knowing: B101 assert, B108 temp file, B301/302 pickle/marshal, B303 md5/sha1,
B307 eval, B310 urllib open, B311 non-crypto random, B324 weak hash, B501 request verify=False,
B602/605 shell=True/os.system, B608 SQL string build, B701 jinja2 autoescape off.

## Security patterns to look for
- **SQL injection:** f-strings/`%`/`.format()`/`+` inside `cursor.execute(...)`, `.raw()`,
  `text()`. **Safe:** parameterized `execute("… %s", (x,))`, `execute("… ?", (x,))`, ORM
  `Model.objects.filter(id=x)` / SQLAlchemy `select().where(col == x)`. Django `.extra()` and
  `RawSQL` with input are red flags.
- **Command injection:** `os.system`, `subprocess.*(..., shell=True)`, `os.popen`, `commands.*`
  with user input. **Safe:** `subprocess.run([...], shell=False)` with an argument list.
- **Code execution:** `eval`, `exec`, `compile`, `__import__`, `pickle.loads`/`cPickle`,
  `yaml.load` without `SafeLoader` (use `yaml.safe_load`), `marshal.loads` on untrusted data.
- **Deserialization / templates:** `pickle` on external data (RCE); `render_template_string` /
  Jinja with user-controlled template (SSTI); `mark_safe`/`|safe`/`format_html` misuse.
- **Path traversal:** `open(base + user_path)`, `send_file`/`send_from_directory` with unchecked
  input, `os.path.join(base, user)` where `user` can be absolute or `..`. Use `os.path.realpath`
  and verify it stays under the base.
- **SSRF:** `requests.get(user_url)` / `urllib.urlopen(user_url)` server-side. Allow-list hosts;
  block internal/metadata IPs.
- **Crypto / TLS:** `hashlib.md5/sha1` for security; `random`/`Random` for tokens (use `secrets`);
  `requests(..., verify=False)`, `ssl._create_unverified_context`, `urllib3.disable_warnings`.
- **Secrets & config:** hardcoded keys; `SECRET_KEY` in source; `DEBUG=True` in Django prod;
  `ALLOWED_HOSTS=['*']`; Flask `app.run(debug=True)` in prod; `app.config` secrets inline.

## Framework specifics
- **Django:** check `settings.py` for `DEBUG`, `SECRET_KEY`, `ALLOWED_HOSTS`, `CSRF`/`SECURE_*`
  cookie flags, `SECURE_SSL_REDIRECT`, middleware order. Views: `@login_required`/permission
  classes present on sensitive views? Object-level perms (IDOR)? `.extra()`/`RawSQL`/`.raw()`
  usage. Templates auto-escape (good) unless `|safe`/`mark_safe`. `csrf_exempt` decorators.
- **Flask:** manual auth is the norm, verify each sensitive route actually checks it. CSRF often
  absent unless Flask-WTF. `render_template_string` with input = SSTI. Session uses `SECRET_KEY`.
- **FastAPI:** dependency-injected auth (`Depends`), check it's applied to protected routes.
  Pydantic gives input validation (good): note it as a mitigation. CORS via `CORSMiddleware`:
  check `allow_origins` isn't `*` with credentials.

## Common non-security bugs
- **Mutable default arguments** (`def f(x=[])`): shared across calls; ruff B006 flags these.
- **Bare `except:` / `except Exception: pass`**: swallows errors (ruff BLE001).
- **Money as `float`**: use `Decimal`.
- **Naive datetimes** and `datetime.now()` without tz (ruff DTZ): timezone bugs.
- **Late binding in closures/loops**; **`is` vs `==`** for value comparison; **f-string in
  logging** (evaluates even when disabled).
- **Resource leaks:** files/connections opened without `with`.
- **Async:** blocking calls (sync `requests`, `time.sleep`, heavy CPU) inside `async def` block the
  event loop (ruff ASYNC).

## Dependency notes
Manifests: `requirements*.txt`, `pyproject.toml`, `Pipfile(.lock)`, `poetry.lock`, `setup.py`.
Flag unpinned (`package` with no version), and prioritize CVEs from `pip-audit`. Security-sensitive
libs to check versions on: Django, Flask, requests, urllib3, cryptography, PyYAML, Jinja2, Pillow.
