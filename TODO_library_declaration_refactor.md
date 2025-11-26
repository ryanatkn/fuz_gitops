# TODO: Library and Declaration Refactor

Unify terminology across belt, fuz, and fuz_gitops.

## Summary of Changes

| Current                         | New                               |
| ------------------------------- | --------------------------------- |
| `SrcJson`                       | `SourceJson`                      |
| `PkgJson`                       | `LibraryJson`                     |
| `Pkg` class                     | `Library` class                   |
| `pkg.svelte.ts`                 | `library.svelte.ts`               |
| `package.ts` (generated)        | `library.ts` (generated)          |
| `package.gen.ts`                | `library.gen.ts`                  |
| `Identifier` / `IdentifierJson` | `Declaration` / `DeclarationJson` |
| `identifier.svelte.ts`          | `declaration.svelte.ts`           |
| `PackageSummary`                | `LibrarySummary`                  |
| `PackageDetail`                 | `LibraryDetail`                   |

---

## Phase 1: Belt ✅ COMPLETE

- [x] `src/lib/src_json.ts` → `src/lib/source_json.ts`
- [x] `src/lib/pkg_json.ts` → `src/lib/library_json.ts`
- [x] All type/function renames complete
- [x] Route re-exports updated
- [x] Belt published

---

## Phase 2: Fuz ✅ COMPLETE

### 2.1 Core Files ✅ COMPLETE

Created new files:

- [x] `src/lib/library.svelte.ts` (replaces pkg.svelte.ts)
- [x] `src/lib/declaration.svelte.ts` (replaces identifier.svelte.ts)
- [x] `src/lib/module.svelte.ts` (updated)
- [x] `src/lib/library_helpers.ts` (replaces package_helpers.ts)
- [x] `src/lib/declaration_contextmenu.ts` (replaces identifier_contextmenu.ts)
- [x] `src/lib/DeclarationDetail.svelte` (replaces IdentifierDetail.svelte)
- [x] `src/lib/DeclarationLink.svelte` (replaces IdentifierLink.svelte)
- [x] `src/lib/ApiDeclarationList.svelte` (replaces ApiIdentifierList.svelte)
- [x] `src/lib/api_search.svelte.ts` (updated)

Deleted old files:

- [x] pkg.svelte.ts, identifier.svelte.ts, package_helpers.ts
- [x] identifier_contextmenu.ts, IdentifierDetail.svelte, IdentifierLink.svelte
- [x] ApiIdentifierList.svelte

### 2.2 Component Renames ✅ COMPLETE

- [x] `src/lib/PackageSummary.svelte` → `LibrarySummary.svelte`
- [x] `src/lib/PackageDetail.svelte` → `LibraryDetail.svelte`

### 2.3 Generation Files ✅ COMPLETE

- [x] `src/lib/package_gen.ts` → `src/lib/library_gen.ts`
  - Renamed `package_gen()` → `library_gen()`
- [x] `src/lib/package_gen_helpers.ts` → `src/lib/library_gen_helpers.ts`
  - Renamed `package_gen_*` functions → `library_gen_*`
- [x] `src/routes/package.gen.ts` → `src/routes/library.gen.ts`
  - Updated import from library_gen
- [x] Generated output: `src/routes/package.ts` → `src/routes/library.ts`
  - Export: `export const library_json = library_json_parse(package_json, source_json)`

### 2.4 Lib Files ✅ COMPLETE

**Docs components:**

- [x] `src/lib/ApiIndex.svelte`
- [x] `src/lib/ApiModule.svelte`
- [x] `src/lib/Docs.svelte`
- [x] `src/lib/DocsContent.svelte`
- [x] `src/lib/DocsFooter.svelte`
- [x] `src/lib/DocsLink.svelte`
- [x] `src/lib/DocsModulesList.svelte`
- [x] `src/lib/DocsPrimaryNav.svelte`
- [x] `src/lib/DocsTertiaryNav.svelte`
- [x] `src/lib/ModuleLink.svelte`
- [x] `src/lib/TypeLink.svelte`
- [x] `src/lib/tome.ts` - renamed `related_identifiers` → `related_declarations`

**TypeScript analysis files:**

- [x] `src/lib/ts_helpers.ts` - updated to DeclarationJson, DeclarationKind
- [x] `src/lib/tsdoc_helpers.ts` - updated to DeclarationJson
- [x] `src/lib/svelte_helpers.ts` - updated to DeclarationJson
- [x] `src/lib/library_gen_helpers.ts` - updated to SourceJson, declarations

### 2.5 Route Files ✅ COMPLETE

- [x] `src/routes/+layout.svelte` - imports Library, library_context
- [x] `src/routes/+page.svelte` - imports library_context
- [x] `src/routes/about/+page.svelte` - imports LibraryDetail, library_context
- [x] `src/routes/docs/+layout.svelte` - uses library_context
- [x] `src/routes/docs/LibraryDetail/+page.svelte` - renamed from PackageDetail
- [x] `src/routes/docs/LibrarySummary/+page.svelte` - renamed from PackageSummary
- [x] `src/routes/docs/tomes.ts` - updated to LibrarySummary, LibraryDetail, related_declarations

### 2.6 Test Files ✅ COMPLETE

- [x] `src/test/package_gen_helpers.test.ts` → `library_gen_helpers.test.ts`
  - Renamed all SrcJson → SourceJson
  - Renamed all identifier → declaration refs
  - Renamed all package*gen*_ → library*gen*_
- [x] `src/test/fixtures/svelte/svelte_test_helpers.ts` - updated to DeclarationJson
- [x] `src/test/fixtures/ts/ts_test_helpers.ts` - updated to DeclarationJson

### 2.7 Verification ✅ COMPLETE

- [x] Gro updated to use new belt imports (source_json.js, library_json.js)
- [x] Run `gro gen` - regenerate library.ts
- [x] Run `gro check` - all type errors fixed (802 tests pass)
- [x] Fixed ts_helpers.test.ts - updated imports and identifiers → declarations
- [x] Fixed fixtures/ts/update.task.ts - updated extract_declaration_from_source
- [x] Updated CLAUDE.md with new terminology (Library, Declaration, library.gen.ts, etc.)
- [ ] Manual testing of docs site
- [ ] Publish fuz

---

## Phase 3: fuz_gitops 🚧 IN PROGRESS

See `TODO_repo_pkg_refactor.md` for detailed design.

### 3.1 Update RepoJson

```ts
// Old
interface RepoJson {
  package_json: PackageJson;
  check_runs: ...;
  pull_requests: ...;
}

// New
interface RepoJson {
  library_json: LibraryJson;  // contains package_json + source_json + computed props
  check_runs: ...;
  pull_requests: ...;
}
```

### 3.2 Update Repo class (composition)

- [ ] Change to composition: `readonly library: Library`
- [ ] Add convenience getters delegating to `this.library.*`
- [ ] Constructor creates Library from `repo_json.library_json`

### 3.3 Refactor LocalRepo and resolution types

- [ ] Rename `ResolvedLocalRepo` → `LocalRepoPath`
- [ ] Rename `UnresolvedLocalRepo` → `LocalRepoMissing` (descriptor-last pattern)
- [ ] Rename `resolve_local_repo()` → `local_repo_locate()` (domain-first)
- [ ] Rename `resolve_local_repos()` → `local_repos_ensure()` (domain-first)
- [ ] Rename `load_local_repo()` → `local_repo_load()` (domain-first)
- [ ] Rename `load_local_repos()` → `local_repos_load()` (domain-first)
- [ ] `LocalRepo` no longer extends - has `library: Library` + needed fields only
- [ ] Import from `src/routes/library.ts` in `local_repo_load()`
- [ ] Add validation: halt with actionable error if library.ts missing

### 3.4 Update sync task

- [ ] Read `library.ts` from each repo (was stubbed)
- [ ] Update generated `repos.ts` structure
- [ ] Update `fetch_repo_data.ts` to use `library.package_json`

### 3.5 Update UI components

- [ ] Update imports from fuz
- [ ] Update references (convenience getters maintain compatibility)
- [ ] Update tomes: `related_identifiers` → `related_declarations`

### 3.6 Update gen files

- [ ] `package.gen.ts` → `library.gen.ts`
- [ ] Delete `package.ts`, regenerate as `library.ts`

### 3.7 Update tests

- [ ] Update test helpers to use Library
- [ ] Update fixture loaders

---

## Phase 4: Other Repos

Each repo needs:

1. `src/routes/package.gen.ts` → `src/routes/library.gen.ts`
   ```ts
   import {library_gen} from '@ryanatkn/fuz/library_gen.js';
   export const gen = library_gen();
   ```
2. Delete `src/routes/package.ts` (will be replaced by `library.ts`)
3. Update route files importing from fuz:
   - `@ryanatkn/fuz/pkg.svelte.js` → `@ryanatkn/fuz/library.svelte.js`
   - `@ryanatkn/fuz/PackageDetail.svelte` → `@ryanatkn/fuz/LibraryDetail.svelte`
   - `Pkg` → `Library`, `pkg_context` → `library_context`
   - `package_json, src_json` → `library_json` (from `$routes/library.js`)
   - Component props: `{pkg}` → `{library}`
4. If using tomes: `related_identifiers` → `related_declarations`
5. Run `gro gen` to regenerate `library.ts`
6. Run `gro typecheck` to verify

Repos:

- [x] moss - library.gen.ts, deleted package.ts, updated all pkg→library imports/props
- [x] belt
- [x] gro - updated source_json.ts, imports, tests, library.gen.ts
- [x] fuz_code - library.gen.ts
- [ ] fuz_blog
- [ ] fuz_mastodon
- [ ] fuz_template
- [ ] fuz_gitops
- [ ] webdevladder.net

---

## Notes

- No deprecation aliases - clean break
- `PackageJson` stays (npm's package.json)
- `ModuleJson` stays (modules contain declarations)
- Library constructor takes `library_json: LibraryJson`
- Generated file exports `library_json` (not `library`) to avoid naming conflicts

## Key Import Mappings

```ts
// Old → New
'@ryanatkn/belt/src_json.js' → '@ryanatkn/belt/source_json.js'
'@ryanatkn/belt/pkg_json.js' → '@ryanatkn/belt/library_json.js'

SrcJson → SourceJson
IdentifierJson → DeclarationJson
IdentifierKind → DeclarationKind
identifier_get_display_name → declaration_get_display_name
identifier_generate_import → declaration_generate_import

'./pkg.svelte.js' → './library.svelte.js'
'./identifier.svelte.js' → './declaration.svelte.js'
'./package_helpers.js' → './library_helpers.js'

Pkg → Library
pkg_context → library_context
Identifier → Declaration
identifiers → declarations
lookup_identifier → lookup_declaration
search_identifiers → search_declarations
```
