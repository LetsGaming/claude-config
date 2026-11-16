# Ruby: Audit Reference

Common frameworks: Ruby on Rails, Sinatra, Hanami. The scanner runs `brakeman` if it's installed
(excellent Rails security scanner); always run the toolless dependency reader (`Gemfile.lock`) and
secret scan.

## Tools (if installed)
```bash
brakeman -f json -q .          # Rails static security scanner: very high signal
bundler-audit check --update   # dependency advisories (needs network)
rubocop --format json          # style + some security cops
```

## Security patterns
- **SQL injection:** string interpolation in `where("name = '#{x}'")`, `find_by_sql`, `.where(
  "… #{x}")`, raw `execute`. **Safe:** `where(name: x)`, `where("name = ?", x)`, parameterized/
  hash conditions. `order`/`pluck`/`select` with interpolated input are also injectable.
- **Command injection:** backticks, `system`, `exec`, `%x()`, `Open3`, `Kernel#open("|cmd")` with
  input.
- **Code execution / deserialization:** `eval`, `instance_eval`, `send`/`public_send` with a
  user-controlled method name; `Marshal.load`, `YAML.load` (use `YAML.safe_load`), `Oj` in unsafe
  mode on untrusted data.
- **Mass assignment:** `Model.new(params[:user])` without strong parameters (`params.require(...)
  .permit(...)`): attacker sets `admin: true`. A top Rails issue; brakeman flags it.
- **XSS:** `raw`, `html_safe`, `<%= ... %>` on unescaped user data (ERB auto-escapes by default,
  a mitigation, unless bypassed); `render inline:` with input.
- **SSRF / open redirect:** `Net::HTTP`/`open-uri` to user URLs; `redirect_to params[:url]`.
- **Crypto/TLS:** `Digest::MD5`/`SHA1` for security; `rand`/`SecureRandom` mix-ups (use
  `SecureRandom` for tokens); `OpenSSL::SSL::VERIFY_NONE`.
- **Mvc/config:** Rails `secret_key_base` committed; `config.consider_all_requests_local = true`
  in prod (leaks stack traces); missing CSRF (`protect_from_forgery`: usually on, flag skips);
  `skip_before_action :authenticate_user!` leaving endpoints open; strong-params bypasses.
- **Secrets:** hardcoded keys; committed `config/master.key`/`credentials.yml.enc` key; `.env`.

## Common non-security bugs
- N+1 queries (very common in Rails: look for iteration over associations without `includes`).
- `nil` errors (`NoMethodError` on nil); missing `try`/safe navigation `&.`.
- Callbacks with side effects causing surprising ordering; fat models/controllers.
- Monkey-patching core classes; global state.

## Dependency notes
`Gemfile`/`Gemfile.lock`. `bundler-audit` is authoritative when network allows; otherwise read
the lockfile specs and flag known-vulnerable gems and outdated Rails. Rails version itself is a
prime CVE source: check it against known advisories.
