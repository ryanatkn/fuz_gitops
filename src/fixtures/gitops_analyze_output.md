# Dependency Analysis

## Summary

- **Total packages**: 34
- **Total dependencies**: 21
- **Internal dependencies**: 21
- **Wildcard dependencies**: 0
- **Production/peer cycles**: 1
- **Dev cycles**: 1

## ❌ Production/Peer Circular Dependencies

> **These block publishing and must be resolved!**

- `@test/pkg_a` → `@test/pkg_b` → `@test/pkg_a`

## ⚠️ Dev Circular Dependencies

> These are normal and do not block publishing.

- `@test/tool_a` → `@test/tool_b` → `@test/tool_a`

## Internal Dependencies

- **@test/repo_b**
  - @test/repo_a
- **@test/repo_c**
  - @test/repo_b (peer)
- **@test/repo_e**
  - @test/repo_a (dev)
- **@test/branch**
  - @test/leaf
- **@test/trunk**
  - @test/branch (peer)
- **@test/root**
  - @test/trunk
- **@test/tool_a**
  - @test/tool_b (dev)
- **@test/tool_b**
  - @test/tool_a (dev)
- **@test/consumer**
  - @test/public_lib
  - @test/private_tool (dev)
- **@test/app_using_unstable**
  - @test/unstable
- **@test/app_using_stable**
  - @test/stable (peer)
- **@test/complex_app**
  - @test/unstable
  - @test/stable
- **@test/plugin_a**
  - @test/core (peer)
- **@test/plugin_b**
  - @test/core (peer)
  - @test/utils (peer)
- **@test/adapter**
  - @test/core (dev)
- **@test/pkg_a**
  - @test/pkg_b (peer)
- **@test/pkg_b**
  - @test/pkg_a
- **@test/plugin**
  - @test/core (peer)
