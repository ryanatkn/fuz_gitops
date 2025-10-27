# TypeScript `noUncheckedIndexedAccess` Issues - Remaining Work

Total TypeScript errors: 87
- ✅ Fixed: 31 errors (safe-to-assert cases)
- ⚠️ Remaining: 31 errors (need proper handling)
- 📦 Other: 25 errors (Logger type mismatch, dependency issue)

---

## ⚠️ UNSAFE - Needs Proper Handling (31 errors)

### Regex Match Arrays (9 errors) - HIGH PRIORITY

**src/lib/semver.ts:38-40** - Regex match capture groups (3 errors)
```typescript
const match = version.match(SEMVER_REGEX);
return {
  major: parseInt(match[1], 10),  // ❌ match[1] undefined if no match
  minor: parseInt(match[2], 10),
  patch: parseInt(match[3], 10),
  prerelease: match[4],
};
```
**Fix**: Check `if (!match) throw ...;` before accessing indices

**src/lib/semver.ts:81-82** - Prerelease part array access (2 errors)
```typescript
const a_part = a_parts[j];
const b_part = b_parts[j];
const a_is_numeric = /^\d+$/.test(a_part);  // ❌ Could be undefined
const b_is_numeric = /^\d+$/.test(b_part);
```
**Fix**: Check parts exist before testing

**src/lib/semver.ts:86-87, 99** - String operations on parts (4 errors)
```typescript
const a_num = parseInt(a_part, 10);  // ❌ a_part undefined
const b_num = parseInt(b_part, 10);
const cmp = a_part.localeCompare(b_part);  // ❌ Both undefined
```
**Fix**: Handle undefined parts (missing part = lower precedence in comparison)

### Regex Match Arrays (3 errors) - Changeset Reader

**src/lib/changeset_reader.ts:37-40** - Frontmatter match (1 error)
```typescript
const match = content.match(/^---([\s\S]*?)---\n([\s\S]*?)$/);
const frontmatter = match[1];  // ❌ Could be undefined
const summary = match[2].trim();
```
**Fix**: Check `if (!match) throw ...;`

**src/lib/changeset_reader.ts:48, 50** - Package regex matches (2 errors)
```typescript
while ((match = package_regex.exec(frontmatter)) !== null) {
  packages.push({
    name: match[1],       // ❌ Could be undefined
    bump_type: match[2],  // ❌ Could be undefined
```
**Fix**: Regex groups should be guaranteed by regex pattern, but TS can't verify

### Object Property Access (2 errors) - MEDIUM PRIORITY

**src/lib/Repos_Table.svelte:24, 29** - Dictionary access
```typescript
// Line 24
return repo.package_json.dependencies[key];  // ❌ Returns undefined
// Line 29
return repo.package_json.devDependencies[key];
```
**Type**: Returns `string | undefined` but function signature expects `string | null`
**Fix**: Change return type or add `?? null` coalesce

### Unvalidated Array Access (8 errors) - HIGH PRIORITY

**src/lib/publishing_plan.ts:585** - Dependency updates array (1 error)
```typescript
log.info(`    ${dep_name} → ${updates[0].new_version}...`);  // ❌ updates might be empty
```
**Fix**: Check `updates.length > 0` before accessing

**src/lib/multi_repo_publisher.ts** - Various pkg_name uses (NOT in loop) (11 errors)
These errors are ONLY for uses of `pkg_name` NOT in the main loop. The loop assignment was fixed, but verify all downstream uses are safe.

### Unvalidated Preflight Checks (4 errors) - Build validation

**src/lib/preflight_checks.ts:151-158** - Build repo array access
```typescript
const repo = repos_to_build[i];  // ✅ FIXED - was in loop
```
Already fixed.

---

## ✅ ALL SAFE CASES - FULLY FIXED

### Version String Splits (Always 3+ parts) - 5 errors ✅

**src/lib/version_utils.ts**
- Line 92: `major! === 0` ✅
- Lines 113-114: `new_parts[0]!`, `old_parts[0]!`, etc. ✅
- Lines 143-147: `major!`, `minor!`, `patch!` ✅

**src/lib/test_helpers.ts**
- Line 131: `${major!}.${minor!}.${patch! + 1}` ✅

### Loop Iteration (i < array.length) - 2 errors ✅

**src/lib/preflight_checks.ts**
- Line 150: `repos_to_build[i]!` ✅

**src/lib/multi_repo_publisher.ts**
- Line 103: `order[i]!` (fixes all 11 uses of pkg_name downstream) ✅

### Validated Length Access - 1 error ✅

**src/lib/preflight_checks.ts**
- Line 173: `repos[0]!.repo_dir` (after `repos.length > 0` check) ✅

### Test Expectations with Length Validation - 8 errors ✅

**src/lib/multi_repo_publisher.test.ts**
- Line 51-54: `published[0]!`, `published[1]!` (after `.toBe(2)`) ✅
- Line 96: `failed[0]!` (after `.toBe(1)`) ✅
- Line 183: `published[0]!` (after `.toBe(1)`) ✅

**src/lib/dependency_updater.test.ts**
- Lines 576-577: `failed[0]!` x2 (after `.toHaveLength(1)`) ✅

**src/lib/dependency_graph.test.ts**
- Line 306: `orders[0]!` x2 (loop guarantees non-empty) ✅

**src/lib/fixtures/check.test.ts**
- Line 372: `fixture_to_local_repos(basic_publishing)[0]!` ✅
- Line 399: `version_changes[0]!` (after `.length > 0` check) ✅

**src/lib/changeset_generator.test.ts**
- Line 209: `updates[0]!` (after `.toHaveLength(1)`) ✅

### Previously Fixed (from initial batch)

**src/lib/semver.test.ts**
- Line 45: `ordered[i]!`, `ordered[i + 1]!` ✅

**src/lib/changeset_reader.test.ts**
- Lines 57, 73: `packages[0]!` ✅

**src/lib/multi_repo_publisher.test.ts**
- Lines 244-245: `wait_calls[0]!`, `wait_calls[1]!` ✅

**src/lib/npm_registry.test.ts**
- Lines 170-179: `wait_calls[0-2]!` x5 ✅

---

**TOTAL SAFE CASES FIXED: 31 errors**

## 📊 Final Status

| Category | Count | Status |
|----------|-------|--------|
| **✅ Safe to Assert with !** | **31** | **FULLY FIXED** |
| ❌ **Unsafe - Need Proper Handling** | **31** | **PENDING** |

### Progress: 31/62 TypeScript errors fixed (50%)

**Note**: 25 additional errors are Logger type mismatches (dependency version issue), not index access issues.

## 🔧 Next Steps

1. **Regex match arrays** - Add null/existence checks before accessing capture groups
2. **Object property access** - Handle undefined in return statements
3. **Unvalidated array access** - Add length validation or use optional chaining

## 📝 Implementation Notes

- All safe cases (31 errors) have been fixed with `!` assertions
- Remaining 31 errors require proper error handling (not just assertions)
- 25 Logger errors are a separate dependency version issue (not index access)
