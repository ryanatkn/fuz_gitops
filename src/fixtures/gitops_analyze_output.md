# Dependency Analysis

## Summary

- **Total packages**: 12
- **Total dependencies**: 291
- **Internal dependencies**: 55
- **Wildcard dependencies**: 15
- **Production/peer cycles**: 0
- **Dev cycles**: 7

## Publishing Order

1. `@ryanatkn/moss` v0.36.0
2. `@ryanatkn/belt` v0.34.1
3. `@ryanatkn/fuz_template` v0.0.1
4. `webdevladder.net` v0.0.1
5. `ryanatkn.com` v0.0.1
6. `@ryanatkn/fuz_code` v0.26.0
7. `@ryanatkn/zzz` v0.0.1
8. `@ryanatkn/gro` v0.167.1
9. `@ryanatkn/fuz` v0.147.0
10. `@ryanatkn/fuz_mastodon` v0.32.0
11. `@ryanatkn/fuz_gitops` v0.50.1
12. `@ryanatkn/fuz_blog` v0.15.0

## ⚠️ Dev Circular Dependencies

> These are normal and do not block publishing.

- `@ryanatkn/fuz` → `@ryanatkn/fuz_code` → `@ryanatkn/belt` → `@ryanatkn/fuz`
- `@ryanatkn/fuz` → `@ryanatkn/fuz_code` → `@ryanatkn/belt` → `@ryanatkn/gro` → `@ryanatkn/fuz`
- `@ryanatkn/belt` → `@ryanatkn/gro` → `@ryanatkn/moss` → `@ryanatkn/belt`
- `@ryanatkn/fuz` → `@ryanatkn/fuz_code` → `@ryanatkn/belt` → `@ryanatkn/gro` → `@ryanatkn/moss` → `@ryanatkn/fuz`
- `@ryanatkn/fuz_code` → `@ryanatkn/belt` → `@ryanatkn/gro` → `@ryanatkn/moss` → `@ryanatkn/fuz_code`
- `@ryanatkn/gro` → `@ryanatkn/moss` → `@ryanatkn/gro`
- `@ryanatkn/fuz` → `@ryanatkn/fuz_code` → `@ryanatkn/fuz`

## ⚠️ Wildcard Dependencies

| Package                  | Dependency               | Version |
| ------------------------ | ------------------------ | ------- |
| `@ryanatkn/fuz`          | `@ryanatkn/belt`         | `*`     |
| `@ryanatkn/fuz`          | `@ryanatkn/moss`         | `*`     |
| `@ryanatkn/fuz_blog`     | `@ryanatkn/belt`         | `*`     |
| `@ryanatkn/fuz_blog`     | `@ryanatkn/fuz`          | `*`     |
| `@ryanatkn/fuz_blog`     | `@ryanatkn/fuz_mastodon` | `*`     |
| `@ryanatkn/fuz_blog`     | `@ryanatkn/gro`          | `*`     |
| `@ryanatkn/fuz_blog`     | `@ryanatkn/moss`         | `*`     |
| `@ryanatkn/fuz_mastodon` | `@ryanatkn/belt`         | `*`     |
| `@ryanatkn/fuz_mastodon` | `@ryanatkn/fuz`          | `*`     |
| `@ryanatkn/fuz_mastodon` | `@ryanatkn/moss`         | `*`     |
| `@ryanatkn/fuz_code`     | `@ryanatkn/moss`         | `*`     |
| `@ryanatkn/fuz_gitops`   | `@ryanatkn/belt`         | `*`     |
| `@ryanatkn/fuz_gitops`   | `@ryanatkn/fuz`          | `*`     |
| `@ryanatkn/fuz_gitops`   | `@ryanatkn/gro`          | `*`     |
| `@ryanatkn/fuz_gitops`   | `@ryanatkn/moss`         | `*`     |

## Internal Dependencies

- **@ryanatkn/zzz**
  - @ryanatkn/belt
  - @ryanatkn/fuz (dev)
  - @ryanatkn/gro (dev)
  - @ryanatkn/moss (dev)
- **@ryanatkn/moss**
  - @ryanatkn/belt (dev)
  - @ryanatkn/fuz (dev)
  - @ryanatkn/fuz_code (dev)
  - @ryanatkn/gro (dev)
- **@ryanatkn/fuz**
  - @ryanatkn/belt (peer)
  - @ryanatkn/fuz_code (dev)
  - @ryanatkn/gro (peer)
  - @ryanatkn/moss (peer)
- **@ryanatkn/gro**
  - @ryanatkn/belt
  - @ryanatkn/fuz (dev)
  - @ryanatkn/moss (dev)
- **@ryanatkn/belt**
  - @ryanatkn/fuz (dev)
  - @ryanatkn/gro (dev)
  - @ryanatkn/moss (dev)
- **@ryanatkn/fuz_template**
  - @ryanatkn/belt (dev)
  - @ryanatkn/fuz (dev)
  - @ryanatkn/gro (dev)
  - @ryanatkn/moss (dev)
- **@ryanatkn/fuz_blog**
  - @ryanatkn/belt (peer)
  - @ryanatkn/fuz (peer)
  - @ryanatkn/fuz_code (dev)
  - @ryanatkn/fuz_mastodon (peer)
  - @ryanatkn/gro (peer)
  - @ryanatkn/moss (peer)
- **@ryanatkn/fuz_mastodon**
  - @ryanatkn/belt (peer)
  - @ryanatkn/fuz (peer)
  - @ryanatkn/fuz_code (dev)
  - @ryanatkn/gro (dev)
  - @ryanatkn/moss (peer)
- **@ryanatkn/fuz_code**
  - @ryanatkn/belt (dev)
  - @ryanatkn/fuz (dev)
  - @ryanatkn/gro (dev)
  - @ryanatkn/moss (peer)
- **@ryanatkn/fuz_gitops**
  - @ryanatkn/belt (peer)
  - @ryanatkn/fuz (peer)
  - @ryanatkn/gro (peer)
  - @ryanatkn/moss (peer)
- **webdevladder.net**
  - @ryanatkn/belt (dev)
  - @ryanatkn/fuz (dev)
  - @ryanatkn/fuz_blog (dev)
  - @ryanatkn/fuz_code (dev)
  - @ryanatkn/fuz_mastodon (dev)
  - @ryanatkn/gro (dev)
  - @ryanatkn/moss (dev)
- **ryanatkn.com**
  - @ryanatkn/belt (dev)
  - @ryanatkn/fuz (dev)
  - @ryanatkn/fuz_blog (dev)
  - @ryanatkn/fuz_gitops (dev)
  - @ryanatkn/fuz_mastodon (dev)
  - @ryanatkn/gro (dev)
  - @ryanatkn/moss (dev)
