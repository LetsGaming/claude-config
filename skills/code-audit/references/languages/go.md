# Go: Audit Reference

Common frameworks: net/http (stdlib), Gin, Echo, Fiber, chi, gRPC. The scanner runs `gosec` if
it's already installed; it doesn't install the Go toolchain. Always run the toolless dependency
reader (`go.mod`) and secret scan.

## Tools (if installed)
```bash
gosec -fmt json -quiet ./...        # Go security scanner
staticcheck ./...                   # correctness + quality
go vet ./...                        # built-in vetting
govulncheck ./...                   # known-vuln stdlib/deps (needs network)
```

## Security patterns
- **SQL injection:** `fmt.Sprintf`/string concat inside `db.Query`/`db.Exec`. **Safe:**
  parameterized `db.Query("… WHERE id = $1", id)` / `?` placeholders; a query builder/ORM (sqlx,
  GORM) with bound args. GORM raw (`.Raw`, `.Exec`) with interpolation is a red flag.
- **Command injection:** `exec.Command("sh", "-c", userInput)`; `exec.Command(userInput, ...)`.
  Prefer a fixed binary with an arg slice and no shell.
- **Path traversal:** `filepath.Join(base, userInput)` then open without checking the cleaned path
  stays under base; `http.ServeFile` with user path. Use `filepath.Clean` + prefix check.
- **SSRF:** `http.Get(userURL)` / building requests to user-supplied hosts.
- **Crypto/TLS:** `crypto/md5`, `crypto/sha1` for security; `math/rand` for tokens (use
  `crypto/rand`); `tls.Config{InsecureSkipVerify: true}`.
- **Template injection:** `text/template` used to render HTML (no auto-escaping) instead of
  `html/template`.
- **Secrets & config:** hardcoded keys/tokens; secrets in code or committed `.env`; overly
  permissive CORS middleware; debug endpoints (`net/http/pprof`) exposed publicly.

## Common non-security bugs (Go-specific, high-value)
- **Ignored errors**: `_ = err` or unchecked returns; the single most common Go bug. `errcheck`/
  `go vet`/`staticcheck` catch many. Flag ignored errors on writes, closes, and DB calls.
- **`defer` in a loop**: resources pile up until the function returns.
- **Goroutine leaks / unbounded goroutines**: `go func(){}` with no lifecycle control; missing
  `context` cancellation; blocked channel sends.
- **Data races**: shared maps/slices written from multiple goroutines without a mutex (suggest
  `go test -race`). Maps are not concurrency-safe.
- **Nil pointer/interface** dereferences; `nil` map writes (panic); comparing error strings
  instead of `errors.Is`/`errors.As`.
- **Loop variable capture** in closures/goroutines (pre-1.22 semantics: check the Go version in
  `go.mod`).
- Not closing `resp.Body`/`rows`/files; ignoring `Close()` errors.

## Dependency notes
`go.mod`/`go.sum`. `govulncheck` is the authoritative source when the network allows it; otherwise
list required modules and versions and check for outdated/known-bad ones. Modules are pinned by
default (good): the risk is staleness and unpatched CVEs.
