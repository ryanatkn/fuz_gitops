# TODO: src_json Refactoring - Types in Belt

> Plan revised 2024-11-22. Execute across belt, gro, fuz repos.

## Goal

Consolidate `src_json` types and schemas in belt. Update to fuz's rich
array-based format. Keep generation logic in gro, helpers in fuz.

## Final Design

```
Belt                          Gro                           Fuz
─────                         ───                           ───
src_json.ts:                  src_json.ts:                  src_json.ts:
  Src_Json (Zod)                src_json_create()             re-exports from belt
  Module_Json                   src_json_serialize()          identifier_display_name_get()
  Identifier_Json               src_modules_create()          identifier_import_generate()
  Identifier_Kind               Src_Json_Mapper
  Generic_Param_Info          gro_plugin_sveltekit_app.ts   pkg.svelte.ts:
  Parameter_Info                (uses src_json.ts)            Pkg class (reactive)
  Component_Prop_Info                                       module.svelte.ts:
                              imports types from belt         Module class (reactive)
pkg_json.ts:                                                identifier.svelte.ts:
  Pkg_Json                                                    Identifier class (reactive)
  pkg_json_parse()
  pkg_repo_name_parse()                                     imports types from belt
  pkg_org_url_parse()
```

## Design Decisions

- **Types/schemas in belt** - shared dependency for both gro and fuz
- **Generation in gro** - build-time tooling stays in build tool
- **Helpers in fuz** - UI-oriented functions (`get_identifier_display_name`, etc.)
- **No gro→fuz dependency** - build tool should not depend on UI library
- **Rich format everywhere** - array-based `Module_Json` with full `Identifier_Json`

## Naming Convention

Following fuz's domain-first, action-last pattern:

```ts
// Belt type renames (src_json.ts)
Src_Modules                    →   (removed, inline Array<Module_Json>)
Src_Module                     →   Module_Json
Src_Module_Declaration         →   Identifier_Json
Src_Module_Declaration_Kind    →   Identifier_Kind
declarations (field)           →   identifiers

// Belt renames (pkg.ts → pkg_json.ts)
Pkg                    →   Pkg_Json
parse_pkg              →   pkg_json_parse
parse_repo_name        →   pkg_repo_name_parse
parse_org_url          →   pkg_org_url_parse

// Gro renames
create_src_json        →   src_json_create
serialize_src_json     →   src_json_serialize
Map_Src_Json           →   Src_Json_Mapper
Map_Package_Json       →   Package_Json_Mapper
to_src_modules         →   src_modules_create

// Fuz renames (src_json.ts)
get_identifier_display_name    →   identifier_display_name_get
generate_import_statement      →   identifier_import_generate
```

## Migration Order

### Phase 1: Belt

Update `src_json.ts` to rich format:

- [x] Remove `Src_Modules` type (inline `Array<Module_Json>` in `Src_Json`)
- [x] Rename `Src_Module` → `Module_Json`
- [x] Rename `Src_Module_Declaration` → `Identifier_Json` with rich fields
- [x] Rename `Src_Module_Declaration_Kind` → `Identifier_Kind` (add `'constructor'`)
- [x] Rename `declarations` field → `identifiers`
- [x] Add supporting types from fuz: `Generic_Param_Info`, `Parameter_Info`, `Component_Prop_Info`
- [x] Update Zod schemas to match new structure

Rename `pkg.ts` → `pkg_json.ts`:

- [x] Rename `Pkg` → `Pkg_Json`
- [x] Rename `parse_pkg` → `pkg_json_parse`
- [x] Rename `parse_repo_name` → `pkg_repo_name_parse`
- [x] Rename `parse_org_url` → `pkg_org_url_parse`
- [x] Update package.json exports (glob pattern, no change needed)

Update `CLAUDE.md`:

- [x] Remove "API documentation system types (use fuz's src_json.ts)"
- [x] Add: "Src_Json types/schemas - shared by gro (generation) and fuz (UI)"

Publish new version. (pending)

### Phase 2: Gro

- [ ] Update `src_json.ts` - import types from belt, keep generation logic
- [ ] Remove fuz import (line 7: `import {Src_Json, Src_Modules} from '@ryanatkn/fuz/src_json.js'`)
- [ ] Rename functions: `src_json_create`, `src_json_serialize`, `src_modules_create`
- [ ] Rename types: `Src_Json_Mapper`, `Package_Json_Mapper`
- [ ] Update `parse_exports.ts` - import `Identifier_Kind` from belt
- [ ] Update `parse_exports_context.ts` - import from belt
- [ ] Update generation to produce rich format
- [ ] Update tests
- [ ] Publish new version

### Phase 3: Fuz

Update `src_json.ts`:

- [ ] Remove type definitions (now in belt)
- [ ] Re-export types from belt for convenience
- [ ] Rename `get_identifier_display_name` → `identifier_display_name_get`
- [ ] Rename `generate_import_statement` → `identifier_import_generate`

Update reactive classes:

- [ ] `pkg.svelte.ts` - use `Pkg_Json` from belt as underlying data type
- [ ] `module.svelte.ts` - use `Module_Json` from belt
- [ ] `identifier.svelte.ts` - use `Identifier_Json` from belt

Update `CLAUDE.md`:

- [ ] Note types come from belt, fuz re-exports for convenience

Publish new version.

### Phase 4: Downstream

- [ ] fuz_gitops - update imports if needed
- [ ] fuz_template, fuz_blog, fuz_code, etc. - run `gro gen`
- [ ] gro's own package.ts - run `gro gen`

## Breaking Changes

**Belt:**
- `@ryanatkn/belt/src_json.js` - type renames, format change (object → array modules)
- `@ryanatkn/belt/pkg.js` → `@ryanatkn/belt/pkg_json.js` - file and export renames

**Gro:**
- `src_json_create`, `src_json_serialize`, `src_modules_create` - function renames
- `Src_Json_Mapper`, `Package_Json_Mapper` - type renames

**Fuz:**
- `@ryanatkn/fuz/src_json.js` - types now re-exported from belt
- `identifier_display_name_get`, `identifier_import_generate` - function renames

**Format:**
- `.well-known/src.json` - now rich (array-based modules, full identifiers)

## Files Summary

### Modify (Belt)

- `src/lib/src_json.ts` - update to rich format, rename types, update Zod schemas
- `src/lib/pkg.ts` → `src/lib/pkg_json.ts` - rename file, types, and functions
- `package.json` - update exports for file rename
- `CLAUDE.md` - update scope documentation

### Modify (Gro)

- `src/lib/src_json.ts` - import from belt, rename functions, keep generation
- `src/lib/parse_exports.ts` - import `Identifier_Kind` from belt
- `src/lib/parse_exports_context.ts` - import from belt
- `src/lib/gro_plugin_sveltekit_app.ts` - update function names
- `src/lib/package_json.ts` - rename `Map_Package_Json` → `Package_Json_Mapper`

### Modify (Fuz)

- `src/lib/src_json.ts` - remove types, re-export from belt, rename helpers
- `src/lib/pkg.svelte.ts` - use `Pkg_Json` from belt
- `src/lib/module.svelte.ts` - use `Module_Json` from belt
- `src/lib/identifier.svelte.ts` - use `Identifier_Json` from belt
- `CLAUDE.md` - note types come from belt

### Already Done (fuz_gitops)

- Migrated to `repo.pkg.*` pattern
- Using fuz's `Module_Json` types
- Fixed `create_mock_repo` test helper
