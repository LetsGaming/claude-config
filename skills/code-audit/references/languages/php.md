# PHP: Audit Reference

Common frameworks: Laravel, Symfony, WordPress (and plugins), CodeIgniter, plain PHP. The scanner
runs tools only if already installed; always run the toolless dependency reader (`composer.json`)
and secret scan.

## Tools (if installed)
```bash
psalm --output-format=json          # static analysis (taint mode: --taint-analysis)
phpstan analyse --error-format=json
# security-specific:
composer audit                      # dependency advisories (needs network)
semgrep scan --config auto --json <root>
```

## Security patterns
- **SQL injection:** variables interpolated into query strings (`"SELECT … WHERE id='$id'"`),
  `mysqli_query`/`->query()` with concatenation, raw `DB::raw`/`DB::statement` in Laravel with
  input. **Safe:** PDO prepared statements with bound params; Eloquent/Doctrine query builders;
  parameterized `DB::select('… ?', [$id])`.
- **Command injection:** `system`, `exec`, `shell_exec`, `passthru`, backticks, `popen`, `proc_open`
  with user input.
- **Code execution:** `eval`, `assert` with input, `create_function`, `call_user_func`(`_array`)
  with user-controlled callable, dynamic `include`/`require` from input (LFI/RFI).
- **Insecure deserialization:** `unserialize()` on untrusted data (object injection → RCE);
  prefer `json_decode`.
- **XSS:** `echo`/`print` of user data without `htmlspecialchars`; in Blade, `{!! $x !!}` (unescaped)
  vs `{{ $x }}` (escaped: a mitigation); Twig `|raw`.
- **Path traversal / file:** `file_get_contents`/`fopen`/`include` with user path; unrestricted
  `move_uploaded_file` (upload of executable `.php`); check upload type/extension allow-list.
- **Crypto/TLS:** `md5`/`sha1` for passwords (use `password_hash`/`password_verify` with bcrypt/
  argon2); `mt_rand`/`rand` for tokens (use `random_bytes`); `CURLOPT_SSL_VERIFYPEER=false`.
- **Secrets & config:** hardcoded creds; committed `.env`; `display_errors=On` in prod; `APP_DEBUG
  =true` (Laravel) / `APP_ENV=dev` in prod; `APP_KEY` missing/committed.
- **Framework:** Laravel, mass assignment (`$fillable`/`$guarded` misconfigured, `Model::create
  ($request->all())`); missing CSRF (usually on by default: flag `VerifyCsrfToken` exclusions);
  auth middleware coverage on routes. WordPress: missing nonce checks, missing capability checks
  (`current_user_can`), unsanitized `$_GET`/`$_POST`, unescaped output; plugin/core version CVEs.

## Common non-security bugs
- Loose comparison `==` vs `===` (PHP type juggling: a real security footgun in auth checks).
- `@` error suppression hiding failures; empty `catch`.
- Null/undefined array key access; assuming `$_POST` keys exist.
- Global state via `$GLOBALS`/superglobals scattered through logic.

## Dependency notes
`composer.json`/`composer.lock`. Use `composer audit` when the network allows; otherwise list
`require`/`require-dev` versions. Flag known-vulnerable framework versions and abandoned packages.
For WordPress, the version and each plugin version are prime CVE sources.
