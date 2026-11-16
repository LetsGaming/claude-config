# Rust: Audit Reference

Common frameworks: Actix-web, Axum, Rocket, Warp, Tokio. Rust's type system and ownership prevent
whole bug classes (memory safety, data races in safe code), so the audit focus shifts toward
`unsafe` blocks, panics, dependency CVEs, and logic/injection issues. The scanner runs `cargo-audit`
only if installed; always run the toolless dependency reader (`Cargo.toml`) and secret scan.

## Tools (if installed)
```bash
cargo audit                          # RustSec advisory DB: dependency CVEs (needs network)
cargo clippy --message-format=json   # lints: correctness, suspicious, complexity, perf
cargo geiger                         # counts unsafe usage across deps (if installed)
```

## Security / correctness patterns
- **`unsafe` blocks:** every `unsafe` is a place the compiler's guarantees are suspended, review
  each for out-of-bounds, invalid pointer, uninitialized memory, or broken invariants. Concentrate
  here; this is where memory-safety bugs actually live in Rust.
- **SQL injection:** `format!`-built queries passed to `sqlx`/`diesel`/`rusqlite` raw execution.
  **Safe:** `sqlx::query!`/bind parameters, Diesel's query builder. `query(&format!(...))` with
  input is the red flag.
- **Command injection:** `Command::new("sh").arg("-c").arg(user_input)`; prefer a fixed program
  with separate args and no shell.
- **Path traversal:** building paths from input without confirming the canonicalized path stays
  under the intended base.
- **SSRF:** `reqwest`/`hyper` requests to user-supplied URLs.
- **Crypto/TLS:** MD5/SHA1 for security; `danger_accept_invalid_certs(true)` on a reqwest client;
  non-CSPRNG for tokens (use `rand`'s CSPRNG / `ring`).
- **Deserialization:** serde is generally safe, but deserializing untrusted input into types with
  side effects, or using formats that allow arbitrary type instantiation, deserves a look.
- **Secrets & config:** hardcoded keys/tokens; committed `.env`; secrets in `Cargo.toml`/source.

## Common bugs / footguns
- **`.unwrap()` / `.expect()` / `panic!` on recoverable errors**: a panic in a request handler can
  take down a worker; user-triggerable panics are a DoS. Flag `unwrap` on `Result`/`Option` derived
  from input. Prefer `?` and proper error types.
- **Integer overflow**: wraps silently in release builds unless checked; use `checked_*`/
  `saturating_*` where input drives arithmetic.
- **`unwrap` on lock poisoning**; blocking calls inside async (`std::fs`/`std::thread::sleep` in a
  Tokio task): use the async equivalents.
- **`clone()` overuse** (perf) and unbounded channels/buffers (memory).
- Ignored `Result` (compiler warns via `#[must_use]`; check warnings aren't silenced).

## Dependency notes
`Cargo.toml`/`Cargo.lock`. `cargo audit` against the RustSec DB is authoritative when the network
allows; otherwise list dependencies and flag outdated/known-bad crates. Note the count and source
of `unsafe`-heavy dependencies. Crates are pinned via the lockfile (good): risk is staleness.
