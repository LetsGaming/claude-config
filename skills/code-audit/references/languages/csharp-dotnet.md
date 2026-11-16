# C# / .NET: Audit Reference

Common frameworks: ASP.NET Core (MVC / Web API / Razor / Blazor), Entity Framework Core, older
ASP.NET/WebForms. The scanner runs tools only if present; always run the toolless dependency
reader (`*.csproj`/`packages.config`) and secret scan.

## Tools (if installed)
```bash
dotnet list package --vulnerable --include-transitive   # dependency CVEs (needs network)
dotnet build /warnaserror                               # surface warnings the project ignores
# security analyzers: Security Code Scan / Roslyn analyzers if referenced in the project
semgrep scan --config auto --json <root>
```

## Security patterns
- **SQL injection:** string-concatenated SQL in `SqlCommand`/`ExecuteSqlRaw`/`FromSqlRaw` with
  interpolation. **Safe:** parameterized `SqlParameter`, EF LINQ queries, `FromSqlInterpolated`
  (parameterizes): but `FromSqlRaw($"… {x}")` is NOT safe. Dapper with anonymous-object params is
  safe.
- **Command injection:** `Process.Start` with a shell/args built from input.
- **Insecure deserialization (classic .NET RCE):** `BinaryFormatter` (deprecated/dangerous),
  `SoapFormatter`, `NetDataContractSerializer`, `LosFormatter`; Json.NET with
  `TypeNameHandling.All`/`Auto` on untrusted data; JavaScriptSerializer with a type resolver.
- **XXE:** `XmlDocument`/`XmlReader` with DTD processing enabled (`DtdProcessing.Parse`);
  `XmlResolver` not null.
- **Path traversal / file:** `Path.Combine(base, userInput)` then open without checking containment
  (Combine happily accepts absolute/`..`); unrestricted file upload.
- **SSRF:** `HttpClient`/`WebRequest` to user-supplied URLs.
- **XSS:** Razor `@Html.Raw(userData)`; `@((MarkupString)userData)` in Blazor; writing to response
  without encoding. Razor auto-encodes `@value` (a mitigation).
- **Crypto/TLS:** `MD5`/`SHA1` for security; `DES`/`RC2`/ECB mode; `Random` for tokens (use
  `RandomNumberGenerator`); `ServerCertificateCustomValidationCallback` returning true /
  `ServicePointManager` bypass.
- **AuthZ/config:** missing `[Authorize]` on controllers/actions (or `[AllowAnonymous]` too broad);
  `app.UseDeveloperExceptionPage()` in prod (leaks details); `EnableDetailedErrors`; CORS
  `AllowAnyOrigin().AllowCredentials()`; antiforgery disabled; secrets in `appsettings.json`
  instead of user-secrets/Key Vault; `ASPNETCORE_ENVIRONMENT=Development` in prod.
- **Secrets:** hardcoded connection strings/keys; committed `appsettings.*.json` with secrets.

## Common non-security bugs
- **`async void`** (except event handlers): unobservable exceptions; **missing `await`** /
  fire-and-forget; **`.Result`/`.Wait()`** on async (deadlocks in some contexts).
- **`IDisposable` not disposed**: missing `using` on connections/streams/HttpClient misuse
  (creating many `HttpClient` instances → socket exhaustion; prefer `IHttpClientFactory`).
- **NullReferenceException**: flag whether nullable reference types (`<Nullable>enable`) is on.
- **Decimal vs double for money;** culture-dependent parsing/formatting; DateTime vs
  DateTimeOffset/UTC issues.
- Swallowed exceptions (`catch {}`), broad `catch (Exception)`.

## Dependency notes
`*.csproj` `<PackageReference>` / `packages.config` / `Directory.Packages.props`. Use `dotnet list
package --vulnerable` when the network allows; otherwise read the referenced package versions.
Check the target framework (`<TargetFramework>`): out-of-support .NET versions are a finding.
