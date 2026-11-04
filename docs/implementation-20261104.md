# ORACULUM v1 design and implementation

User authorization: implement an executable website now, with working tarot, saju, I Ching, explanations and protected records first. Proceed without a design approval interruption.

Architecture: Next.js-compatible React/TypeScript on Vinext, Cloudflare Workers, D1 + Drizzle for deployed user-owned records. PostgreSQL reference schema included; no claim of a live PostgreSQL deployment. Deterministic engines separated from interpretations. lunar-javascript is a Chinese calendar engine: Korean lunar date discrepancies and pre-1962 Korean time rules excluded in v1. Accept solar dates in modern Korea and document UTC+9 to UTC+8 conversion for solar-term boundaries. Astronomy Engine geocentric tropical positions, no invented ascendant/houses.

Visual direction: editorial observatory/library, ink navy, parchment gold, line astronomy, independent custom vector card art. Desktop sidebar + full width workspace; mobile bottom navigation.

1. Engines and reference data: tests fail for deck cardinality, unique draws, all 64 unique hexagrams and changing-line maps, library fixture, date validation and astronomical fixtures. Implement lib/data and lib/engines; pass full tests.
2. Protected storage: Drizzle schema and migrations; authentication, same-origin mutations, per-user reads/deletes and bounded validation. Snapshot results are immutable; explain and save independently. Test authorization predicate and validation, then local HTTP persistence and unauthorized operations.
3. Product UI: homepage, tarot spreads with card selection/flip, saju form/chart, I Ching coin/manual input, astronomy chart, searchable encyclopedia with source links, records reopen/export/delete, guide/settings and grounded explanation panel. No fake AI: default explicit rule-based explanations; optional server LLM endpoint consumes only verified snapshots.
4. Verify: automated engine tests, TypeScript, production build, migrations and browser interaction at desktop/mobile. Package and privately deploy via Sites. Document gaps and commands.

Review focus: invalid dates / unsupported lunar modes reject; cross-user IDs cannot read/delete; six lines ordered bottom-up; stored random results never reroll; missing AI key clearly falls back without pretending to use LLM.

Progress: scaffold ready; dependency install running.

Completed: engine/reference modules, protected API routes and migrations, all planned first-stage screens and original vector art. Review fixes and regressions complete. Final automated suite 20/20, TypeScript/build passed. Native local Worker and browser QA blocked by environment; source publishing failed DNS. See verification-20261104.md. Scope remains v1, with advanced features explicitly deferred.
