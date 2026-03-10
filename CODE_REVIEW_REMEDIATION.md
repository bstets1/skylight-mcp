# Code Review Remediation Plan

**Created**: 2026-03-10
**Branch**: `claude/code-review-tech-debt-IkHae`

---

## Phase 1: Critical Bugs (Blocking)

### 1.1 Fix missing IDs in tool responses
- **Status**: [x] Done
- **Files**: `src/tools/family.ts`, `src/tools/lists.ts`
- **Issue**: `get_family_members` omits category IDs, `get_lists` omits list IDs, `get_list_items` omits item IDs. Multi-step workflows are broken without them.
- **Fix**: Add `id` fields to all formatted outputs in these tools.

### 1.2 Fix `addDays` timezone bug
- **Status**: [x] Done
- **Files**: `src/api/endpoints/calendar.ts`
- **Issue**: `new Date(dateStr + "T00:00:00")` uses local time, then `toISOString()` outputs UTC. In negative-offset timezones, dates shift by +1 day.
- **Fix**: Use `T12:00:00` instead of `T00:00:00` to avoid midnight rollover, or use pure string-based date arithmetic.

### 1.3 Fix `get_chores` dateEnd logic
- **Status**: [x] Done
- **Files**: `src/tools/chores.ts`
- **Issue**: `dateEnd` defaults to 7 days from today, not 7 days from the provided `startDate`.
- **Fix**: Compute default `dateEnd` relative to the parsed `startDate`.

### 1.4 Fix day-of-week timezone inconsistency
- **Status**: [x] Done
- **Files**: `src/utils/dates.ts`
- **Issue**: `new Date().getDay()` uses system timezone but result feeds into timezone-aware formatting.
- **Fix**: Determine current day-of-week using the configured timezone.

---

## Phase 2: Security & Dead Code Cleanup

### 2.1 Remove token logging
- **Status**: [x] Done
- **Files**: `src/api/auth.ts`
- **Issue**: Line 65 logs partial token to stderr.
- **Fix**: Remove or replace with non-sensitive log (e.g., "Login successful").

### 2.2 Remove dead 304 handler
- **Status**: [x] Done
- **Files**: `src/api/client.ts`
- **Issue**: Lines 209-212 are unreachable. `response.ok` is false for 304.
- **Fix**: Remove the dead code block.

### 2.3 Remove dead auth cache code
- **Status**: [x] Done
- **Files**: `src/api/auth.ts`
- **Issue**: `cachedAuth`, `getAuth()`, `clearAuthCache()` are never used.
- **Fix**: Remove the unused exports and variables.

### 2.4 Deduplicate `BASE_URL`
- **Status**: [x] Done
- **Files**: `src/api/client.ts`, `src/api/auth.ts`
- **Fix**: Export `BASE_URL` from one location and import in the other.

### 2.5 Fix hardcoded version
- **Status**: [x] Done
- **Files**: `src/server.ts`, `package.json`
- **Issue**: `version: "1.0.0"` hardcoded instead of reading from package.json.
- **Fix**: Import or read version from package.json.

---

## Phase 3: Robustness Improvements

### 3.1 Add fetch timeout
- **Status**: [x] Done
- **Files**: `src/api/client.ts`
- **Issue**: No timeout on fetch calls. Hung connections block indefinitely.
- **Fix**: Add `AbortSignal.timeout()` to fetch calls (30s default).

### 3.2 Fix silent date/time parse failures
- **Status**: [x] Done
- **Files**: `src/utils/dates.ts`
- **Issue**: Invalid inputs returned as-is. `parseTime("25:99")` passes silently.
- **Fix**: Add validation for hour/minute ranges in `parseTime`. Add YYYY-MM-DD date validation in `parseDate`.

### 3.3 Fix partial name matching
- **Status**: [x] Done
- **Files**: `src/api/endpoints/categories.ts`, `src/api/endpoints/lists.ts`
- **Issue**: `findCategoryByName` and `findListByName` use `.includes()` -- "da" matches "Dad", "Adam", etc. First partial match wins over later exact match.
- **Fix**: Prioritize exact matches. Try exact match first, fall back to partial only if no exact match.

### 3.4 Fix `update_calendar_event` request format
- **Status**: [x] Done
- **Files**: `src/tools/calendar.ts`
- **Issue**: Sends bare attributes without JSON:API envelope. May cause API errors.
- **Fix**: Wrap in `{ data: { type, id, attributes } }` format matching other tools.

---

## Phase 4: Tool Response Quality

### 4.1 Fix `Object.entries` raw attribute dumps
- **Status**: [x] Done
- **Files**: `src/tools/calendar.ts`, `src/tools/misc.ts`, `src/tools/photos.ts`, `src/tools/rewards.ts`, `src/tools/meals.ts`
- **Issue**: Several tools dump raw snake_case API keys. Nested values render as `[object Object]`.
- **Fix**: Use selective formatting with human-readable labels. Use `JSON.stringify` for nested values.

### 4.2 Add missing tool parameters
- **Status**: [x] Done
- **Files**: `src/tools/rewards.ts`, `src/tools/meals.ts`
- **Issue**: `update_reward` missing `categoryIds`, `update_recipe` missing `mealCategoryId`.
- **Fix**: Expose these parameters in the Zod schemas and pass them through to endpoints.

### 4.3 Fix `get_meal_sittings` to show recipe info
- **Status**: [x] Done
- **Files**: `src/tools/meals.ts`
- **Issue**: Shows date/meal_time but not what recipe is scheduled.
- **Fix**: Include recipe name from included/relationship data.

### 4.4 Remove redundant `?? default` after Zod defaults
- **Status**: [x] Done
- **Files**: `src/tools/chores.ts`, `src/tools/tasks.ts`
- **Fix**: Remove unnecessary `?? value` where Zod `.default()` already handles it.

---

## Phase 5: Type Safety & Consistency

### 5.1 Consolidate type definitions
- **Status**: [x] Done
- **Files**: `src/api/endpoints/meals.ts`, `src/api/endpoints/misc.ts`, `src/api/endpoints/photos.ts`, `src/api/types.ts`
- **Issue**: Three different type strategies across endpoint modules.
- **Fix**: Move local types from meals/misc/photos into `types.ts`. Replace `[key: string]: unknown` with actual typed attributes where possible.

### 5.2 Use structured errors in auth.ts
- **Status**: [x] Done
- **Files**: `src/api/auth.ts`
- **Issue**: Throws plain `Error` objects instead of `AuthenticationError` from `utils/errors.ts`.
- **Fix**: Use `AuthenticationError` for 401, `SkylightError` for other failures.

### 5.3 Fix config double-parse
- **Status**: [x] Done
- **Files**: `src/config.ts`, `src/server.ts`
- **Issue**: `loadConfig()` called in `server.ts`, then `getConfig()` calls it again. Caches disconnected.
- **Fix**: Have `server.ts` use `getConfig()` only, or have `loadConfig()` populate the shared cache.

---

## Phase 6: Test Coverage

### 6.1 Add tests for config.ts
- **Status**: [x] Done
- **Fix**: Test Zod validation, both auth methods, refinement rules. Mock `process.env`.

### 6.2 Add tests for api/client.ts
- **Status**: [x] Done
- **Fix**: Test auth header construction, URL building, 401 retry, error handling. Mock fetch.

### 6.3 Add tests for date/time edge cases
- **Status**: [x] Done
- **Fix**: Test timezone params in `parseDate`/`getDateOffset`, `parseTime` edge cases (12:30 AM/PM), `ParseError` class.

### 6.4 Add missing `ParseError` test
- **Status**: [x] Done
- **Files**: `tests/errors.test.ts`
- **Fix**: Add test for `ParseError` class (imported but never tested).

---

## Execution Log

| Time | Agent | Action | Result |
|------|-------|--------|--------|
| 2026-03-10 | Claude | 1.1: Added IDs to member/category output in family.ts, list output in lists.ts, and list item output in lists.ts | Done |
| 2026-03-10 | Claude | 1.2: Changed addDays in calendar.ts to use T12:00:00 instead of T00:00:00 to prevent timezone rollover | Done |
| 2026-03-10 | Claude | 1.3: Added getDateOffsetFrom helper in dates.ts; chores.ts dateEnd now defaults to 7 days from startDate | Done |
| 2026-03-10 | Claude | 1.4: parseDate day-of-week logic now uses Intl.DateTimeFormat to determine today's weekday in configured timezone | Done |
| 2026-03-10 | Claude | 3.1: Added `signal: AbortSignal.timeout(30_000)` to fetch call in client.ts request method | Done |
| 2026-03-10 | Claude | 3.2: Added hour/minute range validation in parseTime (0-23/0-59 for 24h, 1-12/0-59 for 12h); added month 1-12 and day 1-31 validation in parseDate YYYY-MM-DD branch | Done |
| 2026-03-10 | Claude | 3.3: Changed findCategoryByName and findListByName to try exact match first, then fall back to partial `.includes()` match | Done |
| 2026-03-10 | Claude | 3.4: Wrapped updateCalendarEvent body in JSON:API envelope `{ data: { type, id, attributes } }` in calendar endpoint | Done |
| 2026-03-10 | Claude | 2.1: Verified auth.ts line 65 already replaced with `console.error("[auth] Login successful")` — no token info logged | Done |
| 2026-03-10 | Claude | 2.2: Verified dead 304 handler already removed from client.ts; code flows directly from error handling to `response.json()` | Done |
| 2026-03-10 | Claude | 2.3: Verified `cachedAuth`, `getAuth()`, `clearAuthCache()` do not exist in auth.ts; grep confirms no imports anywhere | Done |
| 2026-03-10 | Claude | 2.4: Verified `BASE_URL` is exported from client.ts and imported in auth.ts — no duplicate definition | Done |
| 2026-03-10 | Claude | 2.5: Replaced `readFileSync`/`JSON.parse`/`__dirname` with `createRequire(import.meta.url)` to read package.json version | Done |
| 2026-03-10 | Claude | 4.1: Replaced Object.entries dump in get_recipe with selective fields (ingredients, instructions, prep_time, cook_time, servings) using JSON.stringify for nested values; other tools already had selective formatting | Done |
| 2026-03-10 | Claude | 4.2: Verified update_reward already has assignee/respawnOnRedemption params and update_recipe already has mealCategoryId param | Done |
| 2026-03-10 | Claude | 4.3: Updated getMealSittings endpoint to return included recipe data; tool handler now builds recipe lookup map and shows recipe name for each sitting | Done |
| 2026-03-10 | Claude | 4.4: Removed `?? true` for includeLate and `?? false` for recurring in chores.ts, and `?? false` for routine in tasks.ts (Zod .default() already provides these) | Done |
| 2026-03-10 | Claude | 5.1: Verified types already consolidated — MealCategoryResource, MealRecipeResource, MealSittingResource, AvatarResource, ColorResource, AlbumResource all defined in types.ts with typed attributes; endpoint files import from ../types.js | Done |
| 2026-03-10 | Claude | 5.2: Verified auth.ts already imports and uses AuthenticationError (for 401) and SkylightError (for other HTTP failures) from ../utils/errors.js | Done |
| 2026-03-10 | Claude | 5.3: Verified server.ts already uses getConfig() (which caches via cachedConfig) instead of calling loadConfig() directly — config is parsed once and cached | Done |
