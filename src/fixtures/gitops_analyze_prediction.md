# Dependency Analysis

## Summary

- **Total packages**: 12
- **Total dependencies**: 67
- **Internal dependencies**: 37
- **Wildcard dependencies**: 15
- **Production/peer cycles**: 0
- **Dev cycles**: 7

## Publishing Order

1. `@ryanatkn/belt` v0.34.1
2. `@ryanatkn/zzz` v0.0.1
3. `@ryanatkn/moss` v0.36.0
4. `@ryanatkn/gro` v0.167.1
5. `@ryanatkn/fuz` v0.147.0
6. `@ryanatkn/fuz_template` v0.0.1
7. `@ryanatkn/fuz_mastodon` v0.32.0
8. `@ryanatkn/fuz_blog` v0.15.0
9. `@ryanatkn/fuz_code` v0.26.0
10. `@ryanatkn/fuz_gitops` v0.50.1
11. `webdevladder.net` v0.0.1
12. `ryanatkn.com` v0.0.1

## ⚠️ Dev Circular Dependencies

> These are normal and do not block publishing.

- `@ryanatkn/belt` → `@ryanatkn/fuz` → `@ryanatkn/belt`
- `@ryanatkn/belt` → `@ryanatkn/gro` → `@ryanatkn/belt`
- `@ryanatkn/belt` → `@ryanatkn/moss` → `@ryanatkn/belt`
- `@ryanatkn/fuz` → `@ryanatkn/fuz_code` → `@ryanatkn/fuz`
- `@ryanatkn/fuz` → `@ryanatkn/gro` → `@ryanatkn/fuz`
- `@ryanatkn/fuz` → `@ryanatkn/moss` → `@ryanatkn/fuz`
- `@ryanatkn/gro` → `@ryanatkn/moss` → `@ryanatkn/gro`

## ⚠️ Wildcard Dependencies

| Package | Dependency | Version |
|---------|------------|---------|
| `@ryanatkn/fuz` | `@ryanatkn/belt` | `*` |
| `@ryanatkn/fuz` | `@ryanatkn/moss` | `*` |
| `@ryanatkn/fuz_blog` | `@ryanatkn/belt` | `*` |
| `@ryanatkn/fuz_blog` | `@ryanatkn/fuz` | `*` |
| `@ryanatkn/fuz_blog` | `@ryanatkn/fuz_mastodon` | `*` |
| `@ryanatkn/fuz_blog` | `@ryanatkn/gro` | `*` |
| `@ryanatkn/fuz_blog` | `@ryanatkn/moss` | `*` |
| `@ryanatkn/fuz_mastodon` | `@ryanatkn/belt` | `*` |
| `@ryanatkn/fuz_mastodon` | `@ryanatkn/fuz` | `*` |
| `@ryanatkn/fuz_mastodon` | `@ryanatkn/moss` | `*` |
| `@ryanatkn/fuz_code` | `@ryanatkn/moss` | `*` |
| `@ryanatkn/fuz_gitops` | `@ryanatkn/belt` | `*` |
| `@ryanatkn/fuz_gitops` | `@ryanatkn/fuz` | `*` |
| `@ryanatkn/fuz_gitops` | `@ryanatkn/gro` | `*` |
| `@ryanatkn/fuz_gitops` | `@ryanatkn/moss` | `*` |

## Internal Dependencies

- **@ryanatkn/zzz**
  - @ryanatkn/belt

- **@ryanatkn/moss**

- **@ryanatkn/fuz**
  - @ryanatkn/belt (peer)
  - @ryanatkn/gro (peer)
  - @ryanatkn/moss (peer)

- **@ryanatkn/gro**
  - @ryanatkn/belt

- **@ryanatkn/belt**

- **@ryanatkn/fuz_template**

- **@ryanatkn/fuz_blog**
  - @ryanatkn/belt (peer)
  - @ryanatkn/fuz (peer)
  - @ryanatkn/fuz_mastodon (peer)
  - @ryanatkn/gro (peer)
  - @ryanatkn/moss (peer)

- **@ryanatkn/fuz_mastodon**
  - @ryanatkn/belt (peer)
  - @ryanatkn/fuz (peer)
  - @ryanatkn/moss (peer)

- **@ryanatkn/fuz_code**
  - @ryanatkn/moss (peer)

- **@ryanatkn/fuz_gitops**
  - @ryanatkn/belt (peer)
  - @ryanatkn/fuz (peer)
  - @ryanatkn/gro (peer)
  - @ryanatkn/moss (peer)

- **webdevladder.net**

- **ryanatkn.com**