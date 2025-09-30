# Publishing Preview

## Publishing Order

`@test/repo_a` → `@test/repo_d` → `@test/repo_e` → `@test/leaf` → `@test/tool_a` → `@test/tool_b` → `@test/public_lib` → `@test/private_tool` → `@test/unstable` → `@test/stable` → `@test/core` → `@test/utils` → `@test/repo_b` → `@test/branch` → `@test/consumer` → `@test/app_using_unstable` → `@test/app_using_stable` → `@test/complex_app` → `@test/plugin_a` → `@test/plugin_b` → `@test/adapter` → `@test/repo_c` → `@test/trunk` → `@test/root`

## Version Changes (from changesets)

| Package              | From  | To    | Bump  | Breaking |
| -------------------- | ----- | ----- | ----- | -------- |
| `@test/repo_a`       | 0.1.0 | 0.2.0 | minor | 💥 Yes   |
| `@test/leaf`         | 0.1.0 | 0.2.0 | minor | 💥 Yes   |
| `@test/tool_a`       | 1.0.0 | 1.1.0 | minor | No       |
| `@test/tool_b`       | 1.0.0 | 1.0.1 | patch | No       |
| `@test/public_lib`   | 1.0.0 | 1.1.0 | minor | No       |
| `@test/private_tool` | 1.0.0 | 1.1.0 | minor | No       |
| `@test/unstable`     | 0.9.5 | 1.0.0 | major | 💥 Yes   |
| `@test/stable`       | 1.5.2 | 2.0.0 | major | 💥 Yes   |
| `@test/core`         | 2.0.0 | 2.1.0 | minor | No       |
| `@test/utils`        | 1.0.0 | 1.0.1 | patch | No       |
| `@test/plugin_b`     | 1.5.0 | 1.5.1 | patch | No       |

## Version Changes (bump escalation required)

| Package             | From  | To    | Changesets Bump | Required Bump | Breaking |
| ------------------- | ----- | ----- | --------------- | ------------- | -------- |
| `@test/complex_app` | 3.0.0 | 4.0.0 | patch           | major         | 💥 Yes   |
| `@test/repo_c`      | 0.1.0 | 0.2.0 | patch           | minor         | 💥 Yes   |
| `@test/trunk`       | 0.1.0 | 0.2.0 | patch           | minor         | 💥 Yes   |
| `@test/root`        | 0.1.0 | 0.2.0 | patch           | minor         | 💥 Yes   |

> ⬆️ These packages have changesets, but dependencies require a larger version bump.

## Version Changes (auto-generated for dependency updates)

| Package                    | From  | To    | Bump  | Breaking |
| -------------------------- | ----- | ----- | ----- | -------- |
| `@test/repo_b`             | 0.1.0 | 0.2.0 | minor | 💥 Yes   |
| `@test/branch`             | 0.1.0 | 0.2.0 | minor | 💥 Yes   |
| `@test/root`               | 0.1.0 | 0.2.0 | minor | 💥 Yes   |
| `@test/consumer`           | 1.0.0 | 1.0.1 | patch | No       |
| `@test/app_using_unstable` | 1.0.0 | 2.0.0 | major | 💥 Yes   |
| `@test/app_using_stable`   | 2.3.0 | 3.0.0 | major | 💥 Yes   |
| `@test/plugin_a`           | 1.0.0 | 1.0.1 | patch | No       |
| `@test/adapter`            | 3.0.0 | 3.0.1 | patch | No       |

## Breaking Change Cascades

- `@test/repo_a` affects: `@test/repo_b`
- `@test/repo_b` affects: `@test/repo_c`
- `@test/leaf` affects: `@test/branch`
- `@test/branch` affects: `@test/trunk`
- `@test/trunk` affects: `@test/root`
- `@test/unstable` affects: `@test/app_using_unstable`, `@test/complex_app`
- `@test/stable` affects: `@test/app_using_stable`, `@test/complex_app`

## Dependency Updates

### @test/repo_b

| Dependency     | New Version | Type         | Triggers Republish |
| -------------- | ----------- | ------------ | ------------------ |
| `@test/repo_a` | 0.2.0       | dependencies | Yes                |

### @test/repo_c

| Dependency     | New Version | Type             | Triggers Republish |
| -------------- | ----------- | ---------------- | ------------------ |
| `@test/repo_b` | 0.2.0       | peerDependencies | Yes                |

### @test/repo_e

| Dependency     | New Version | Type            | Triggers Republish |
| -------------- | ----------- | --------------- | ------------------ |
| `@test/repo_a` | 0.2.0       | devDependencies | No                 |

### @test/branch

| Dependency   | New Version | Type         | Triggers Republish |
| ------------ | ----------- | ------------ | ------------------ |
| `@test/leaf` | 0.2.0       | dependencies | Yes                |

### @test/trunk

| Dependency     | New Version | Type             | Triggers Republish |
| -------------- | ----------- | ---------------- | ------------------ |
| `@test/branch` | 0.2.0       | peerDependencies | Yes                |

### @test/root

| Dependency    | New Version | Type         | Triggers Republish |
| ------------- | ----------- | ------------ | ------------------ |
| `@test/trunk` | 0.2.0       | dependencies | Yes                |

### @test/tool_a

| Dependency     | New Version | Type            | Triggers Republish |
| -------------- | ----------- | --------------- | ------------------ |
| `@test/tool_b` | 1.0.1       | devDependencies | No                 |

### @test/tool_b

| Dependency     | New Version | Type            | Triggers Republish |
| -------------- | ----------- | --------------- | ------------------ |
| `@test/tool_a` | 1.1.0       | devDependencies | No                 |

### @test/consumer

| Dependency           | New Version | Type            | Triggers Republish |
| -------------------- | ----------- | --------------- | ------------------ |
| `@test/tool_a`       | 1.1.0       | dependencies    | Yes                |
| `@test/tool_b`       | 1.0.1       | dependencies    | Yes                |
| `@test/public_lib`   | 1.1.0       | dependencies    | Yes                |
| `@test/private_tool` | 1.1.0       | devDependencies | No                 |

### @test/app_using_unstable

| Dependency       | New Version | Type         | Triggers Republish |
| ---------------- | ----------- | ------------ | ------------------ |
| `@test/unstable` | 1.0.0       | dependencies | Yes                |

### @test/app_using_stable

| Dependency     | New Version | Type             | Triggers Republish |
| -------------- | ----------- | ---------------- | ------------------ |
| `@test/stable` | 2.0.0       | peerDependencies | Yes                |

### @test/complex_app

| Dependency       | New Version | Type         | Triggers Republish |
| ---------------- | ----------- | ------------ | ------------------ |
| `@test/unstable` | 1.0.0       | dependencies | Yes                |
| `@test/stable`   | 2.0.0       | dependencies | Yes                |

### @test/plugin_a

| Dependency   | New Version | Type             | Triggers Republish |
| ------------ | ----------- | ---------------- | ------------------ |
| `@test/core` | 2.1.0       | peerDependencies | Yes                |

### @test/plugin_b

| Dependency    | New Version | Type             | Triggers Republish |
| ------------- | ----------- | ---------------- | ------------------ |
| `@test/core`  | 2.1.0       | peerDependencies | Yes                |
| `@test/utils` | 1.0.1       | peerDependencies | Yes                |

### @test/adapter

| Dependency    | New Version | Type             | Triggers Republish |
| ------------- | ----------- | ---------------- | ------------------ |
| `@test/utils` | 1.0.1       | peerDependencies | Yes                |

## ⚠️ Warnings

- Dev dependency cycle (will be ignored): @test/tool_a → @test/tool_b → @test/tool_a

## ℹ️ No Changes to Publish

_These packages have no changesets and no dependency updates:_

- `@test/repo_d`
- `@test/repo_e`

## Summary

- **Packages to publish**: 22
- **Dependency updates**: 20
- **Breaking changes**: 7
- **Warnings**: 1
- **Errors**: 0
