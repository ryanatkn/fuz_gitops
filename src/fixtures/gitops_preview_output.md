# Publishing Preview

## ❌ Errors

- Production dependency cycle: @test/pkg_a → @test/pkg_b → @test/pkg_a
- Failed to compute publishing order: Error: Circular dependency detected involving: @test/pkg_a, @test/pkg_b

## No Packages to Publish

No packages have changesets to publish.

## ⚠️ Warnings

- Dev dependency cycle (will be ignored): @test/tool_a → @test/tool_b → @test/tool_a

## Summary

- **Packages to publish**: 0
- **Dependency updates**: 0
- **Breaking changes**: 0
- **Warnings**: 1
- **Errors**: 2
