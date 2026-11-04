# Verification — ORACULUM v1 — 2026-11-04

## Passed

- `npm test`: 20/20 tests, zero failures.
- `npm run typecheck`: passed, zero TypeScript errors.
- Vinext/Cloudflare production build: passed; all four API groups and dynamic homepage generated.
- Calculation fixtures: 78 unique tarot cards (22 + 56), sampling without replacement, all 64 distinct six-line patterns, Qian/Kun/Zhun identities, moving-line change to Gou (44), upstream saju fixture, Lichun year boundary, both late-Zi day rules, invalid dates rejected, Sun longitude near J2000.
- Actual route handlers bundled with esbuild and executed with a D1-compatible SQLite adapter and controlled authenticated-header context: anonymous read/write rejected; cross-origin write rejected; owner A cannot be read or deleted by owner B; catalogue canonicalization discards tampered names; snapshots unchanged on reopen; actual file-backed SQLite records survive a closed/reopened connection.
- AI network failure returns explicitly labeled rule fallback. Provider payload excludes original birth dates and unrelated supplied input properties. Deleting readings cannot reset active AI usage counters.
- Custom card count constrained to integers, shared chart longitude mapping, daily cycle provenance, distinct expert/academic output, guest pending results and expiry.

## Review and fixes

A separate review agent inspected the implementation and reran the initial 10 tests. Addressed findings: reversed zodiac label direction; whole-record deletion resetting rate limits; AI network-error fallback; precise-birth-input minimization and transmission disclosure; decimal spread dead end; login-handoff result loss; saved-ID propagation; false daily-card random description; identical expert/academic modes. Relevant regressions are now included in the 20-test suite.

## Environment limitations — NOT verified

- Native local D1 migration/preview could not run: Wrangler attempted a local fetch and failed; Vinext local preview reported `connect EACCES 127.0.0.1:<port>`. The in-process SQLite test adapter verifies route/query logic and file persistence, not Cloudflare's full production authentication or database service.
- Browser QA was not completed. A local-file frontend preview was rejected by the browser's URL policy (only HTTP/HTTPS allowed). No alternative browser surface or security-policy workaround was attempted.
- Source publication failed because the execution environment could not resolve `git.chatgpt-team.site`. No live deployment URL is claimed. Site registration exists but is unpublished.
- No real AI provider was called and no API key is configured. The endpoint has a configurable real server integration, with tested rule fallback.
- Pixel appearance, touch gestures on real mobile devices, print/PDF pagination, PWA installation, hosted login callback, D1 storage and hosted traffic/load behavior remain unverified.

## Implementation rulings

- Use the supported D1 runtime in the hosted architecture; PostgreSQL schema is a reference, not an active connection. Migration work is needed to move providers.
- Accept modern solar UTC+9 standard times only for saju; unsupported lunar/historical inputs are not approximated.
- Default to labeled rule explanations until AI credentials exist; no RAG or verified multilingual corpus is claimed.
- Limit the initial culture catalogue to five sourced entries. Other traditions remain explicitly unimplemented.
- Keep minimal request-rate metadata when deleting reading records, so deletion cannot reset billable AI limits.

## Deferred

Browser/hosted end-to-end checks, translation interfaces, admin tools, RAG, lunar calendar/local historical-time support, saju advanced calculations, astrological houses/ascendant/aspects, complete classical I Ching text, and server-generated PDFs.
