# Dependency Analysis

## Summary

- **Total packages**: 25
- **Total dependencies**: 18
- **Internal dependencies**: 18
- **Wildcard dependencies**: 0
- **Production/peer cycles**: 0
- **Dev cycles**: 1

## Publishing Order

1. `@test/repo_a` v0.1.0
2. `@test/repo_d` v0.1.0
3. `@test/repo_e` v0.1.0
4. `@test/leaf` v0.1.0
5. `@test/tool_a` v1.0.0
6. `@test/tool_b` v1.0.0
7. `@test/public_lib` v1.0.0
8. `@test/private_tool` v1.0.0
9. `@test/unstable` v0.9.5
10. `@test/stable` v1.5.2
11. `@test/core` v2.0.0
12. `@test/utils` v1.0.0
13. `@test/repo_b` v0.1.0
14. `@test/branch` v0.1.0
15. `@test/consumer` v1.0.0
16. `@test/app_using_unstable` v1.0.0
17. `@test/app_using_stable` v2.3.0
18. `@test/complex_app` v3.0.0
19. `@test/plugin_a` v1.0.0
20. `@test/plugin_b` v1.5.0
21. `@test/adapter` v3.0.0
22. `@test/repo_c` v0.1.0
23. `@test/trunk` v0.1.0
24. `@test/root` v0.1.0

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
  - @test/utils (peer)
