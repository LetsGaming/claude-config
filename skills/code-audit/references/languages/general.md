# General: Fallback Language Reference

Use this when the project contains a language **without a dedicated reference** here: e.g. C/C++,
Scala, Elixir, Swift, Dart, Perl, Lua, R, Clojure, Haskell, Objective-C, F#/VB, Groovy, Julia, and
so on. The key insight: **vulnerability and bug classes are universal; only the syntax and library
names change.** Map the concepts below onto whatever language you're looking at, and lean harder on
manual trust-boundary tracing (from `methodology.md`) since you'll have fewer automated aids.

## The universal method
1. Map the attack surface (entry points) and follow untrusted input to dangerous sinks: exactly as
   in `methodology.md`. This transfers to every language.
2. Check each universal sink category below for how it appears in *this* language.
3. Run any available general or language-specific tool (see the tool table).
4. Be explicit in the report's scope section that automated coverage was limited for this language,
   and that findings lean on manual review.

## Universal sinks: what to look for in any language
The pattern is always "untrusted input reaches a powerful operation as data-that-becomes-code."
- **Query execution (SQLi):** any query built by concatenating/interpolating input instead of using
  parameter binding / a query builder. Look for the language's DB API and whether placeholders are
  used.
- **Command / process execution:** the language's `system`/`exec`/`popen`/`spawn`/`Runtime`
  equivalent invoked with a string containing input, or via a shell. Safe form: an argument vector,
  no shell.
- **Code evaluation:** `eval`/`exec`/dynamic compile/reflection/`require`-from-input constructs run
  on untrusted data.
- **Deserialization:** turning untrusted bytes into objects (native serialization, unsafe
  YAML/XML/pickle-equivalents). Frequently RCE.
- **File paths:** paths built from input without confirming the resolved path stays inside the
  intended directory (traversal). Also unrestricted uploads.
- **Outbound requests (SSRF):** server-side HTTP/socket calls to user-supplied hosts/URLs.
- **Template / HTML rendering (XSS/SSTI):** input rendered into markup or a template without
  escaping, or user-controlled templates.
- **Crypto:** weak hashes (MD5/SHA1) for security, weak ciphers/modes (DES/RC4/ECB), non-CSPRNG
  randomness for tokens, disabled TLS verification, hardcoded keys/IVs.
- **Auth / session / access control:** missing authentication on sensitive operations; missing
  ownership/role checks (IDOR); weak password hashing; token/JWT handling.
- **Secrets & config:** hardcoded credentials; committed secret files; debug/verbose modes and
  stack-trace leakage in production; permissive CORS; exposed admin/debug endpoints.
- **Memory safety (C/C++/unmanaged):** buffer overflows, use-after-free, integer overflow, format-
  string bugs, unchecked `strcpy`/`sprintf`/`memcpy`, unvalidated array indexing. For these
  languages, memory safety is often the dominant risk: prioritize it.

## Universal bug classes (any language)
- Swallowed/ignored errors and broad catch-alls hiding failures.
- Missing null/None/empty handling; off-by-one; unchecked indexing.
- Resource leaks (files, sockets, connections, locks not released).
- Concurrency: shared mutable state without synchronization; races; deadlocks; unbounded workers.
- Numeric issues: integer overflow, float for money, precision/rounding.
- Time/timezone handling; locale-dependent parsing.
- Input validation gaps at the trust boundary.

## Finding the right tools for an unlisted language
Look for the language's standard linter and security scanner. A non-exhaustive map:

| Language | Linters / security tools | Dep manifest |
|---|---|---|
| C / C++ | `cppcheck`, `clang-tidy`, `flawfinder`, `scan-build` | Conan, vcpkg, CMake |
| Scala | `scalafix`, `wartremover`, Scapegoat | `build.sbt` |
| Elixir | `credo`, `sobelow` (Phoenix security) | `mix.exs` |
| Swift | `swiftlint`, `swift-format` | `Package.swift` |
| Dart / Flutter | `dart analyze` | `pubspec.yaml` |
| Perl | `perlcritic` | `cpanfile` |
| Lua | `luacheck` | `rockspec` |
| R | `lintr` | `DESCRIPTION` / renv |
| Haskell | `hlint` | `.cabal` / stack |
| Clojure | `clj-kondo` | `deps.edn` / `project.clj` |
| Kotlin/Java (covered) | see `java-kotlin.md` | - |

**`semgrep` is the best general fallback**: it supports many languages with security rulesets. The
scanner runs it automatically if it's installed. The toolless secret-scan and dependency-reader
baselines run regardless of language, so you always get *some* signal.

## Reporting
Same structure as any audit: ranked findings with `file:line`, project-specific fixes, quality and
roadmap sections. Just be honest in "Scope & limitations" that tool coverage was thinner for this
language and that findings are weighted toward manual review: that transparency is part of a
trustworthy audit.
