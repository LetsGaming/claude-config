# Java / Kotlin: Audit Reference

Common frameworks: Spring / Spring Boot, Jakarta/Java EE, Quarkus, Micronaut, Android. The scanner
doesn't install Java tooling (heavy toolchain); it will run tools only if already present.

## Tools (if installed / available)
```bash
# SpotBugs + FindSecBugs, PMD, or the OWASP Dependency-Check plugin via the build tool:
mvn -q verify                          # if plugins configured
mvn org.owasp:dependency-check-maven:check
gradle dependencyCheckAnalyze
semgrep scan --config auto --json <root>   # if installed: good Java coverage
```
Always run the toolless dependency reader (parses `pom.xml`/`build.gradle`) and secret scan.

## Security patterns
- **SQL injection:** string-concatenated JDBC (`stmt.execute("… " + x)`), string-built JPQL/HQL,
  `@Query` with concatenation. **Safe:** `PreparedStatement` with `?`, JPA parameter binding,
  Spring Data derived queries.
- **Command injection:** `Runtime.getRuntime().exec(userInput)`, `ProcessBuilder` with untrusted
  args.
- **Deserialization (classic Java RCE):** `ObjectInputStream.readObject()` on untrusted data;
  unsafe XML/JSON with polymorphic typing (Jackson `enableDefaultTyping`/`@JsonTypeInfo`);
  vulnerable libs (older Jackson, Log4j: check for Log4Shell-era versions).
- **XXE:** `DocumentBuilderFactory`/`SAXParserFactory`/`XMLInputFactory` without disabling DTDs
  and external entities.
- **SSRF / path traversal:** `new URL(userInput).openStream()`; `new File(base, userInput)` /
  `Files.newInputStream` without containment.
- **Crypto/TLS:** `MessageDigest.getInstance("MD5"|"SHA-1")` for security; `Cipher.getInstance
  ("AES/ECB/…")` or `"DES"`; `java.util.Random`/`Math.random` for tokens (use `SecureRandom`);
  custom `TrustManager`/`HostnameVerifier` that accept everything.
- **Spring specifics:** Spring Security config, are endpoints secured (`authorizeHttpRequests`),
  or is there a `permitAll()`/`ignoring()` that's too broad? CSRF disabled? Actuator endpoints
  exposed (`/actuator/*`) without auth? SpEL injection (`@PreAuthorize` with input, `#{}` on user
  data). `@CrossOrigin("*")`. Mass assignment via `@ModelAttribute` binding all fields.
- **Secrets & config:** hardcoded creds; secrets in `application.properties`/`application.yml`;
  `server.error.include-stacktrace=always`; H2 console enabled in prod; debug/dev profiles active.

## Common non-security bugs
- **NullPointerException** risk: missing null checks (Kotlin's nullability helps; flag `!!` and
  platform-type leaks from Java interop).
- **Resource leaks**: streams/connections not in try-with-resources.
- **Concurrency**: shared mutable state without synchronization; non-thread-safe fields on
  singleton Spring beans; `SimpleDateFormat` shared across threads.
- **equals/hashCode** contract violations; `==` on objects instead of `.equals`.
- **Money as `double`/`float`**: use `BigDecimal`.
- Swallowed exceptions (`catch (Exception e) {}`), broad catches hiding failures.

## Dependency notes
`pom.xml` (Maven), `build.gradle(.kts)` (Gradle). Flag known-vulnerable versions (Log4j
2.x < 2.17, older Jackson-databind, Spring versions with published CVEs, Struts). Prefer OWASP
Dependency-Check output when available; otherwise list versions and check the notable libs above.
