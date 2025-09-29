[gitops_preview] invoking gitops_preview
[gitops_preview] → gitops_preview preview what will happen during multi-repo publishing based on changesets
[gitops_preview] 🔍 Previewing multi-repo publishing plan...

[gitops_preview] resolving gitops configs on the filesystem in /home/desk/dev [
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
[gitops_preview]   Found 12 local repos
[gitops_preview] 📋 Generating publishing preview...

➤ [gitops_preview]   Predicted @ryanatkn/zzz: 0.0.1 → 0.1.0 (minor) 
➤ [gitops_preview]   Predicted @ryanatkn/gro: 0.167.1 → 0.168.0 (minor) 
➤ [gitops_preview]   Predicted @ryanatkn/fuz_gitops: 0.50.1 → 0.51.0 (minor) 
[gitops_preview] # Publishing Preview
[gitops_preview] 
[gitops_preview] ## Publishing Order
[gitops_preview] 
[gitops_preview] `@ryanatkn/moss` → `@ryanatkn/belt` → `@ryanatkn/fuz_template` → `webdevladder.net` → `ryanatkn.com` → `@ryanatkn/fuz_code` → `@ryanatkn/zzz` → `@ryanatkn/gro` → `@ryanatkn/fuz` → `@ryanatkn/fuz_mastodon` → `@ryanatkn/fuz_gitops` → `@ryanatkn/fuz_blog`
[gitops_preview] 
[gitops_preview] ## Version Changes (from changesets)
[gitops_preview] 
[gitops_preview] | Package | From | To | Bump | Breaking |
[gitops_preview] |---------|------|----|------|----------|
[gitops_preview] | `@ryanatkn/zzz` | 0.0.1 | 0.1.0 | minor | 💥 Yes |
[gitops_preview] | `@ryanatkn/gro` | 0.167.1 | 0.168.0 | minor | 💥 Yes |
[gitops_preview] | `@ryanatkn/fuz_gitops` | 0.50.1 | 0.51.0 | minor | 💥 Yes |
[gitops_preview] 
[gitops_preview] ## Version Changes (auto-generated for dependency updates)
[gitops_preview] 
[gitops_preview] | Package | From | To | Bump | Breaking |
[gitops_preview] |---------|------|-----|------|----------|
[gitops_preview] | `@ryanatkn/fuz` | 0.147.0 | 0.148.0 | minor | 💥 Yes |
[gitops_preview] | `@ryanatkn/fuz_blog` | 0.15.0 | 0.16.0 | minor | 💥 Yes |
[gitops_preview] 
[gitops_preview] ## Breaking Change Cascades
[gitops_preview] 
[gitops_preview] - `@ryanatkn/gro` affects: `@ryanatkn/fuz`, `@ryanatkn/fuz_blog`, `@ryanatkn/fuz_gitops`
[gitops_preview] 
[gitops_preview] ## Dependency Updates
[gitops_preview] 
[gitops_preview] ### @ryanatkn/zzz
[gitops_preview] 
[gitops_preview] | Dependency | New Version | Type | Triggers Republish |
[gitops_preview] |------------|-------------|------|-------------------|
[gitops_preview] | `@ryanatkn/gro` | 0.168.0 | devDependencies | No |
[gitops_preview] 
[gitops_preview] ### @ryanatkn/moss
[gitops_preview] 
[gitops_preview] | Dependency | New Version | Type | Triggers Republish |
[gitops_preview] |------------|-------------|------|-------------------|
[gitops_preview] | `@ryanatkn/gro` | 0.168.0 | devDependencies | No |
[gitops_preview] 
[gitops_preview] ### @ryanatkn/fuz
[gitops_preview] 
[gitops_preview] | Dependency | New Version | Type | Triggers Republish |
[gitops_preview] |------------|-------------|------|-------------------|
[gitops_preview] | `@ryanatkn/gro` | 0.168.0 | peerDependencies | Yes |
[gitops_preview] | `@ryanatkn/gro` | 0.168.0 | devDependencies | No |
[gitops_preview] 
[gitops_preview] ### @ryanatkn/belt
[gitops_preview] 
[gitops_preview] | Dependency | New Version | Type | Triggers Republish |
[gitops_preview] |------------|-------------|------|-------------------|
[gitops_preview] | `@ryanatkn/gro` | 0.168.0 | devDependencies | No |
[gitops_preview] 
[gitops_preview] ### @ryanatkn/fuz_template
[gitops_preview] 
[gitops_preview] | Dependency | New Version | Type | Triggers Republish |
[gitops_preview] |------------|-------------|------|-------------------|
[gitops_preview] | `@ryanatkn/gro` | 0.168.0 | devDependencies | No |
[gitops_preview] 
[gitops_preview] ### @ryanatkn/fuz_blog
[gitops_preview] 
[gitops_preview] | Dependency | New Version | Type | Triggers Republish |
[gitops_preview] |------------|-------------|------|-------------------|
[gitops_preview] | `@ryanatkn/gro` | 0.168.0 | peerDependencies | Yes |
[gitops_preview] | `@ryanatkn/gro` | 0.168.0 | devDependencies | No |
[gitops_preview] 
[gitops_preview] ### @ryanatkn/fuz_mastodon
[gitops_preview] 
[gitops_preview] | Dependency | New Version | Type | Triggers Republish |
[gitops_preview] |------------|-------------|------|-------------------|
[gitops_preview] | `@ryanatkn/gro` | 0.168.0 | devDependencies | No |
[gitops_preview] 
[gitops_preview] ### @ryanatkn/fuz_code
[gitops_preview] 
[gitops_preview] | Dependency | New Version | Type | Triggers Republish |
[gitops_preview] |------------|-------------|------|-------------------|
[gitops_preview] | `@ryanatkn/gro` | 0.168.0 | devDependencies | No |
[gitops_preview] 
[gitops_preview] ### @ryanatkn/fuz_gitops
[gitops_preview] 
[gitops_preview] | Dependency | New Version | Type | Triggers Republish |
[gitops_preview] |------------|-------------|------|-------------------|
[gitops_preview] | `@ryanatkn/gro` | 0.168.0 | peerDependencies | Yes |
[gitops_preview] | `@ryanatkn/gro` | 0.168.0 | devDependencies | No |
[gitops_preview] 
[gitops_preview] ### webdevladder.net
[gitops_preview] 
[gitops_preview] | Dependency | New Version | Type | Triggers Republish |
[gitops_preview] |------------|-------------|------|-------------------|
[gitops_preview] | `@ryanatkn/gro` | 0.168.0 | devDependencies | No |
[gitops_preview] 
[gitops_preview] ### ryanatkn.com
[gitops_preview] 
[gitops_preview] | Dependency | New Version | Type | Triggers Republish |
[gitops_preview] |------------|-------------|------|-------------------|
[gitops_preview] | `@ryanatkn/fuz_gitops` | 0.51.0 | devDependencies | No |
[gitops_preview] | `@ryanatkn/gro` | 0.168.0 | devDependencies | No |
[gitops_preview] 
[gitops_preview] ## ⚠️ Warnings
[gitops_preview] 
[gitops_preview] - Dev dependency cycle (will be ignored): @ryanatkn/fuz → @ryanatkn/fuz_code → @ryanatkn/belt → @ryanatkn/fuz
[gitops_preview] - Dev dependency cycle (will be ignored): @ryanatkn/fuz → @ryanatkn/fuz_code → @ryanatkn/belt → @ryanatkn/gro → @ryanatkn/fuz
[gitops_preview] - Dev dependency cycle (will be ignored): @ryanatkn/belt → @ryanatkn/gro → @ryanatkn/moss → @ryanatkn/belt
[gitops_preview] - Dev dependency cycle (will be ignored): @ryanatkn/fuz → @ryanatkn/fuz_code → @ryanatkn/belt → @ryanatkn/gro → @ryanatkn/moss → @ryanatkn/fuz
[gitops_preview] - Dev dependency cycle (will be ignored): @ryanatkn/fuz_code → @ryanatkn/belt → @ryanatkn/gro → @ryanatkn/moss → @ryanatkn/fuz_code
[gitops_preview] - Dev dependency cycle (will be ignored): @ryanatkn/gro → @ryanatkn/moss → @ryanatkn/gro
[gitops_preview] - Dev dependency cycle (will be ignored): @ryanatkn/fuz → @ryanatkn/fuz_code → @ryanatkn/fuz
[gitops_preview] - @ryanatkn/moss has no changesets and no dependency updates - won't be published
[gitops_preview] - @ryanatkn/belt has no changesets and no dependency updates - won't be published
[gitops_preview] - @ryanatkn/fuz_template has no changesets and no dependency updates - won't be published
[gitops_preview] - @ryanatkn/fuz_mastodon has no changesets and no dependency updates - won't be published
[gitops_preview] - @ryanatkn/fuz_code has no changesets and no dependency updates - won't be published
[gitops_preview] - webdevladder.net has no changesets and no dependency updates - won't be published
[gitops_preview] - ryanatkn.com has no changesets and no dependency updates - won't be published
[gitops_preview] 
[gitops_preview] ## Summary
[gitops_preview] 
[gitops_preview] - **Packages to publish**: 5
[gitops_preview] - **Dependency updates**: 15
[gitops_preview] - **Breaking changes**: 1
[gitops_preview] - **Warnings**: 14
[gitops_preview] - **Errors**: 0
[gitops_preview] ✓ gitops_preview
