# Publishing Preview

## Publishing Order

`@ryanatkn/belt` → `@ryanatkn/zzz` → `@ryanatkn/gro` → `@ryanatkn/fuz_gitops`

## Version Changes (from changesets)

| Package | From | To | Bump | Breaking |
|---------|------|----|------|----------|
| `@ryanatkn/belt` | 0.34.1 | 0.34.2 | patch | No |
| `@ryanatkn/zzz` | 0.0.1 | 0.1.0 | minor | 💥 Yes |
| `@ryanatkn/gro` | 0.167.1 | 0.168.0 | minor | No |
| `@ryanatkn/fuz_gitops` | 0.50.1 | 0.51.0 | minor | No |

## Version Changes (auto-generated for dependency updates)

| Package | From | To | Bump | Breaking |
|---------|------|-----|------|----------|
| `@ryanatkn/moss` | 0.36.0 | 0.36.1 | patch | No |
| `@ryanatkn/fuz` | 0.147.0 | 0.147.1 | patch | No |
| `@ryanatkn/fuz_template` | 0.0.1 | 0.0.2 | patch | No |
| `@ryanatkn/fuz_blog` | 0.15.0 | 0.15.1 | patch | No |
| `@ryanatkn/fuz_mastodon` | 0.32.0 | 0.32.1 | patch | No |
| `@ryanatkn/fuz_code` | 0.26.0 | 0.26.1 | patch | No |
| `webdevladder.net` | 0.0.1 | 0.0.2 | patch | No |
| `ryanatkn.com` | 0.0.1 | 0.0.2 | patch | No |

## Breaking Change Cascades

- `@ryanatkn/zzz` affects: (none - no packages depend on zzz in prod/peer deps)

## Dependency Updates

### @ryanatkn/zzz

| Dependency | New Version | Type | Triggers Republish |
|------------|-------------|------|-------------------|
| `@ryanatkn/belt` | 0.34.2 | dependencies | No |

### @ryanatkn/moss

| Dependency | New Version | Type | Triggers Republish |
|------------|-------------|------|-------------------|
| `@ryanatkn/belt` | 0.34.2 | devDependencies | No |
| `@ryanatkn/fuz` | 0.147.1 | devDependencies | No |
| `@ryanatkn/gro` | 0.168.0 | devDependencies | No |

### @ryanatkn/fuz

| Dependency | New Version | Type | Triggers Republish |
|------------|-------------|------|-------------------|
| `@ryanatkn/belt` | 0.34.2 | peerDependencies | Yes |
| `@ryanatkn/gro` | 0.168.0 | peerDependencies | Yes |
| `@ryanatkn/moss` | 0.36.1 | peerDependencies | Yes |
| `@ryanatkn/belt` | 0.34.2 | devDependencies | No |
| `@ryanatkn/gro` | 0.168.0 | devDependencies | No |
| `@ryanatkn/moss` | 0.36.1 | devDependencies | No |

### @ryanatkn/gro

| Dependency | New Version | Type | Triggers Republish |
|------------|-------------|------|-------------------|
| `@ryanatkn/belt` | 0.34.2 | dependencies | No |
| `@ryanatkn/fuz` | 0.147.1 | devDependencies | No |
| `@ryanatkn/moss` | 0.36.1 | devDependencies | No |

### @ryanatkn/fuz_template

| Dependency | New Version | Type | Triggers Republish |
|------------|-------------|------|-------------------|
| `@ryanatkn/belt` | 0.34.2 | devDependencies | No |
| `@ryanatkn/fuz` | 0.147.1 | devDependencies | No |
| `@ryanatkn/gro` | 0.168.0 | devDependencies | No |
| `@ryanatkn/moss` | 0.36.1 | devDependencies | No |

### @ryanatkn/fuz_blog

| Dependency | New Version | Type | Triggers Republish |
|------------|-------------|------|-------------------|
| `@ryanatkn/belt` | 0.34.2 | peerDependencies | Yes |
| `@ryanatkn/fuz` | 0.147.1 | peerDependencies | Yes |
| `@ryanatkn/gro` | 0.168.0 | peerDependencies | Yes |
| `@ryanatkn/moss` | 0.36.1 | peerDependencies | Yes |
| `@ryanatkn/belt` | 0.34.2 | devDependencies | No |
| `@ryanatkn/fuz` | 0.147.1 | devDependencies | No |
| `@ryanatkn/gro` | 0.168.0 | devDependencies | No |
| `@ryanatkn/moss` | 0.36.1 | devDependencies | No |

### @ryanatkn/fuz_mastodon

| Dependency | New Version | Type | Triggers Republish |
|------------|-------------|------|-------------------|
| `@ryanatkn/belt` | 0.34.2 | peerDependencies | Yes |
| `@ryanatkn/fuz` | 0.147.1 | peerDependencies | Yes |
| `@ryanatkn/moss` | 0.36.1 | peerDependencies | Yes |
| `@ryanatkn/belt` | 0.34.2 | devDependencies | No |
| `@ryanatkn/fuz` | 0.147.1 | devDependencies | No |
| `@ryanatkn/gro` | 0.168.0 | devDependencies | No |
| `@ryanatkn/moss` | 0.36.1 | devDependencies | No |

### @ryanatkn/fuz_code

| Dependency | New Version | Type | Triggers Republish |
|------------|-------------|------|-------------------|
| `@ryanatkn/moss` | 0.36.1 | peerDependencies | Yes |
| `@ryanatkn/belt` | 0.34.2 | devDependencies | No |
| `@ryanatkn/fuz` | 0.147.1 | devDependencies | No |
| `@ryanatkn/gro` | 0.168.0 | devDependencies | No |
| `@ryanatkn/moss` | 0.36.1 | devDependencies | No |

### @ryanatkn/fuz_gitops

| Dependency | New Version | Type | Triggers Republish |
|------------|-------------|------|-------------------|
| `@ryanatkn/belt` | 0.34.2 | peerDependencies | No |
| `@ryanatkn/fuz` | 0.147.1 | peerDependencies | No |
| `@ryanatkn/gro` | 0.168.0 | peerDependencies | No |
| `@ryanatkn/moss` | 0.36.1 | peerDependencies | No |
| `@ryanatkn/belt` | 0.34.2 | devDependencies | No |
| `@ryanatkn/fuz` | 0.147.1 | devDependencies | No |
| `@ryanatkn/gro` | 0.168.0 | devDependencies | No |
| `@ryanatkn/moss` | 0.36.1 | devDependencies | No |

### webdevladder.net

| Dependency | New Version | Type | Triggers Republish |
|------------|-------------|------|-------------------|
| `@ryanatkn/belt` | 0.34.2 | devDependencies | No |
| `@ryanatkn/fuz` | 0.147.1 | devDependencies | No |
| `@ryanatkn/gro` | 0.168.0 | devDependencies | No |
| `@ryanatkn/moss` | 0.36.1 | devDependencies | No |

### ryanatkn.com

| Dependency | New Version | Type | Triggers Republish |
|------------|-------------|------|-------------------|
| `@ryanatkn/belt` | 0.34.2 | devDependencies | No |
| `@ryanatkn/fuz` | 0.147.1 | devDependencies | No |
| `@ryanatkn/fuz_gitops` | 0.51.0 | devDependencies | No |
| `@ryanatkn/gro` | 0.168.0 | devDependencies | No |
| `@ryanatkn/moss` | 0.36.1 | devDependencies | No |

## ⚠️ Warnings

- `@ryanatkn/moss` has no changesets and no dependency updates - won't be published
- `@ryanatkn/fuz` has no changesets and no dependency updates - won't be published
- `@ryanatkn/fuz_template` has no changesets and no dependency updates - won't be published
- `@ryanatkn/fuz_blog` has no changesets and no dependency updates - won't be published
- `@ryanatkn/fuz_mastodon` has no changesets and no dependency updates - won't be published
- `@ryanatkn/fuz_code` has no changesets and no dependency updates - won't be published
- `webdevladder.net` has no changesets and no dependency updates - won't be published
- `ryanatkn.com` has no changesets and no dependency updates - won't be published

## Summary

- **Packages to publish**: 12
- **Dependency updates**: 44
- **Breaking changes**: 1
- **Warnings**: 8
- **Errors**: 0