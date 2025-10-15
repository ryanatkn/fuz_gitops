# Publishing Preview

## ❌ Errors

- Production dependency cycle: @test/pkg_a → @test/pkg_b → @test/pkg_a
- Failed to compute publishing order: Error: Circular dependency detected involving: @test/pkg_a, @test/pkg_b

## No Packages to Publish

No packages have changesets to publish.

## ℹ️ No Changes to Publish

_These packages have no changesets and no dependency updates:_

- `1 dev dependency cycle(s) detected (normal, shown in gitops_analyze)`

## Summary

- **Packages to publish**: 0
- **Dependency updates**: 0
- **Major version bumps**: 0
- **Warnings**: 0
- **Errors**: 2
