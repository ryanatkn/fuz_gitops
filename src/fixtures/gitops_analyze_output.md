[gitops_analyze] invoking gitops_analyze
[gitops_analyze] → gitops_analyze analyze dependency structure and relationships across repos
[gitops_analyze] resolving gitops configs on the filesystem in /home/desk/dev [
  'https://github.com/ryanatkn/zzz',
  'https://github.com/ryanatkn/moss',
  'https://github.com/ryanatkn/fuz',
  'https://github.com/ryanatkn/gro',
  'https://github.com/ryanatkn/belt',
  'https://github.com/ryanatkn/fuz_template',
  'https://github.com/ryanatkn/fuz_blog',
  'https://github.com/ryanatkn/fuz_mastodon',
  'https://github.com/ryanatkn/fuz_code',
  'https://github.com/ryanatkn/fuz_gitops',
  'https://github.com/ryanatkn/webdevladder.net',
  'https://github.com/ryanatkn/ryanatkn.com'
]
[gitops_analyze] # Dependency Analysis
[gitops_analyze] 
[gitops_analyze] ## Summary
[gitops_analyze] 
[gitops_analyze] - **Total packages**: 12
[gitops_analyze] - **Total dependencies**: 291
[gitops_analyze] - **Internal dependencies**: 55
[gitops_analyze] - **Wildcard dependencies**: 15
[gitops_analyze] - **Production/peer cycles**: 0
[gitops_analyze] - **Dev cycles**: 7
[gitops_analyze] 
[gitops_analyze] ## Publishing Order
[gitops_analyze] 
[gitops_analyze] 1. `@ryanatkn/moss` v0.36.0
[gitops_analyze] 2. `@ryanatkn/belt` v0.34.1
[gitops_analyze] 3. `@ryanatkn/fuz_template` v0.0.1
[gitops_analyze] 4. `webdevladder.net` v0.0.1
[gitops_analyze] 5. `ryanatkn.com` v0.0.1
[gitops_analyze] 6. `@ryanatkn/fuz_code` v0.26.0
[gitops_analyze] 7. `@ryanatkn/zzz` v0.0.1
[gitops_analyze] 8. `@ryanatkn/gro` v0.167.1
[gitops_analyze] 9. `@ryanatkn/fuz` v0.147.0
[gitops_analyze] 10. `@ryanatkn/fuz_mastodon` v0.32.0
[gitops_analyze] 11. `@ryanatkn/fuz_gitops` v0.50.1
[gitops_analyze] 12. `@ryanatkn/fuz_blog` v0.15.0
[gitops_analyze] 
[gitops_analyze] ## ⚠️ Dev Circular Dependencies
[gitops_analyze] 
[gitops_analyze] > These are normal and do not block publishing.
[gitops_analyze] 
[gitops_analyze] - `@ryanatkn/fuz` → `@ryanatkn/fuz_code` → `@ryanatkn/belt` → `@ryanatkn/fuz`
[gitops_analyze] - `@ryanatkn/fuz` → `@ryanatkn/fuz_code` → `@ryanatkn/belt` → `@ryanatkn/gro` → `@ryanatkn/fuz`
[gitops_analyze] - `@ryanatkn/belt` → `@ryanatkn/gro` → `@ryanatkn/moss` → `@ryanatkn/belt`
[gitops_analyze] - `@ryanatkn/fuz` → `@ryanatkn/fuz_code` → `@ryanatkn/belt` → `@ryanatkn/gro` → `@ryanatkn/moss` → `@ryanatkn/fuz`
[gitops_analyze] - `@ryanatkn/fuz_code` → `@ryanatkn/belt` → `@ryanatkn/gro` → `@ryanatkn/moss` → `@ryanatkn/fuz_code`
[gitops_analyze] - `@ryanatkn/gro` → `@ryanatkn/moss` → `@ryanatkn/gro`
[gitops_analyze] - `@ryanatkn/fuz` → `@ryanatkn/fuz_code` → `@ryanatkn/fuz`
[gitops_analyze] 
[gitops_analyze] ## ⚠️ Wildcard Dependencies
[gitops_analyze] 
[gitops_analyze] | Package | Dependency | Version |
[gitops_analyze] |---------|------------|---------|
[gitops_analyze] | `@ryanatkn/fuz` | `@ryanatkn/belt` | `*` |
[gitops_analyze] | `@ryanatkn/fuz` | `@ryanatkn/moss` | `*` |
[gitops_analyze] | `@ryanatkn/fuz_blog` | `@ryanatkn/belt` | `*` |
[gitops_analyze] | `@ryanatkn/fuz_blog` | `@ryanatkn/fuz` | `*` |
[gitops_analyze] | `@ryanatkn/fuz_blog` | `@ryanatkn/fuz_mastodon` | `*` |
[gitops_analyze] | `@ryanatkn/fuz_blog` | `@ryanatkn/gro` | `*` |
[gitops_analyze] | `@ryanatkn/fuz_blog` | `@ryanatkn/moss` | `*` |
[gitops_analyze] | `@ryanatkn/fuz_mastodon` | `@ryanatkn/belt` | `*` |
[gitops_analyze] | `@ryanatkn/fuz_mastodon` | `@ryanatkn/fuz` | `*` |
[gitops_analyze] | `@ryanatkn/fuz_mastodon` | `@ryanatkn/moss` | `*` |
[gitops_analyze] | `@ryanatkn/fuz_code` | `@ryanatkn/moss` | `*` |
[gitops_analyze] | `@ryanatkn/fuz_gitops` | `@ryanatkn/belt` | `*` |
[gitops_analyze] | `@ryanatkn/fuz_gitops` | `@ryanatkn/fuz` | `*` |
[gitops_analyze] | `@ryanatkn/fuz_gitops` | `@ryanatkn/gro` | `*` |
[gitops_analyze] | `@ryanatkn/fuz_gitops` | `@ryanatkn/moss` | `*` |
[gitops_analyze] 
[gitops_analyze] ## Internal Dependencies
[gitops_analyze] 
[gitops_analyze] - **@ryanatkn/zzz**
[gitops_analyze]   - @ryanatkn/belt 
[gitops_analyze]   - @ryanatkn/fuz (dev)
[gitops_analyze]   - @ryanatkn/gro (dev)
[gitops_analyze]   - @ryanatkn/moss (dev)
[gitops_analyze] - **@ryanatkn/moss**
[gitops_analyze]   - @ryanatkn/belt (dev)
[gitops_analyze]   - @ryanatkn/fuz (dev)
[gitops_analyze]   - @ryanatkn/fuz_code (dev)
[gitops_analyze]   - @ryanatkn/gro (dev)
[gitops_analyze] - **@ryanatkn/fuz**
[gitops_analyze]   - @ryanatkn/belt (peer)
[gitops_analyze]   - @ryanatkn/fuz_code (dev)
[gitops_analyze]   - @ryanatkn/gro (peer)
[gitops_analyze]   - @ryanatkn/moss (peer)
[gitops_analyze] - **@ryanatkn/gro**
[gitops_analyze]   - @ryanatkn/belt 
[gitops_analyze]   - @ryanatkn/fuz (dev)
[gitops_analyze]   - @ryanatkn/moss (dev)
[gitops_analyze] - **@ryanatkn/belt**
[gitops_analyze]   - @ryanatkn/fuz (dev)
[gitops_analyze]   - @ryanatkn/gro (dev)
[gitops_analyze]   - @ryanatkn/moss (dev)
[gitops_analyze] - **@ryanatkn/fuz_template**
[gitops_analyze]   - @ryanatkn/belt (dev)
[gitops_analyze]   - @ryanatkn/fuz (dev)
[gitops_analyze]   - @ryanatkn/gro (dev)
[gitops_analyze]   - @ryanatkn/moss (dev)
[gitops_analyze] - **@ryanatkn/fuz_blog**
[gitops_analyze]   - @ryanatkn/belt (peer)
[gitops_analyze]   - @ryanatkn/fuz (peer)
[gitops_analyze]   - @ryanatkn/fuz_code (dev)
[gitops_analyze]   - @ryanatkn/fuz_mastodon (peer)
[gitops_analyze]   - @ryanatkn/gro (peer)
[gitops_analyze]   - @ryanatkn/moss (peer)
[gitops_analyze] - **@ryanatkn/fuz_mastodon**
[gitops_analyze]   - @ryanatkn/belt (peer)
[gitops_analyze]   - @ryanatkn/fuz (peer)
[gitops_analyze]   - @ryanatkn/fuz_code (dev)
[gitops_analyze]   - @ryanatkn/gro (dev)
[gitops_analyze]   - @ryanatkn/moss (peer)
[gitops_analyze] - **@ryanatkn/fuz_code**
[gitops_analyze]   - @ryanatkn/belt (dev)
[gitops_analyze]   - @ryanatkn/fuz (dev)
[gitops_analyze]   - @ryanatkn/gro (dev)
[gitops_analyze]   - @ryanatkn/moss (peer)
[gitops_analyze] - **@ryanatkn/fuz_gitops**
[gitops_analyze]   - @ryanatkn/belt (peer)
[gitops_analyze]   - @ryanatkn/fuz (peer)
[gitops_analyze]   - @ryanatkn/gro (peer)
[gitops_analyze]   - @ryanatkn/moss (peer)
[gitops_analyze] - **webdevladder.net**
[gitops_analyze]   - @ryanatkn/belt (dev)
[gitops_analyze]   - @ryanatkn/fuz (dev)
[gitops_analyze]   - @ryanatkn/fuz_blog (dev)
[gitops_analyze]   - @ryanatkn/fuz_code (dev)
[gitops_analyze]   - @ryanatkn/fuz_mastodon (dev)
[gitops_analyze]   - @ryanatkn/gro (dev)
[gitops_analyze]   - @ryanatkn/moss (dev)
[gitops_analyze] - **ryanatkn.com**
[gitops_analyze]   - @ryanatkn/belt (dev)
[gitops_analyze]   - @ryanatkn/fuz (dev)
[gitops_analyze]   - @ryanatkn/fuz_blog (dev)
[gitops_analyze]   - @ryanatkn/fuz_gitops (dev)
[gitops_analyze]   - @ryanatkn/fuz_mastodon (dev)
[gitops_analyze]   - @ryanatkn/gro (dev)
[gitops_analyze]   - @ryanatkn/moss (dev)
[gitops_analyze] ✓ gitops_analyze
