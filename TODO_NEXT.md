# TODO_NEXT

## Recently Completed ✅

### Fixture Testing Infrastructure
- ✅ Created in-memory fixture system (`src/fixtures/repo_fixtures/`)
  - Type-safe fixture definitions with expected outcomes
  - Mock operations that work without filesystem/git
  - Fast unit tests for publishing logic
  - Six comprehensive fixtures covering all major scenarios (30+ test repos)
  - Generic test code that validates all fixtures
  - Enhanced validation: info, warnings, errors fields
- ✅ Fixed integration tests to use real repos
  - Updated to use root `gitops.config.ts`
  - Regenerated baseline outputs from actual commands
  - All 171 tests passing (was 168)
- ✅ Consolidated constants in `src/lib/paths.ts`
  - Extracted `DEFAULT_REPOS_DIR` constant
  - Made `repos_dir` required on `Gitops_Config`
  - Fixed path resolution logic

### Expanded Fixture Test Coverage
- ✅ Added three new comprehensive fixtures:
  - `private_packages.ts` - Tests private package handling (appear in preview but don't publish)
  - `major_bumps.ts` - Tests major version transitions (0.x → 1.0, 1.x → 2.0) with cascading
  - `peer_deps_only.ts` - Tests plugins/adapters pattern with only peer dependencies
- ✅ Enhanced test validation
  - Added `info` field to type definitions and all fixtures
  - Validates warnings and errors if specified
  - All tests use generic validation functions

### Cascade Calculation Bugs - FIXED! ✅

**What Was Broken:**
- Single-pass algorithm couldn't propagate changes discovered late in the process
- Transitive cascades failed (repo_a → repo_b worked, but repo_b → repo_c failed)
- Affected 5 out of 6 fixtures

**The Fix:** Multi-pass fixed-point iteration in `publishing_preview.ts`
- Loops until no new version changes discovered (convergence)
- Each iteration: calculate dependencies → add auto-changesets → check escalations
- Resolves ALL transitive cascades correctly
- Maximum 10 iterations (typical: 2-3 for deep chains)

**Verified Fixes:**
- ✅ `basic_publishing.ts`: repo_c now correctly gets 0.2.0 (was 0.1.1)
- ✅ `deep_cascade.ts`: trunk and root now correctly get 0.2.0 (were 0.1.1)
- ✅ `circular_dev_deps.ts`: consumer now correctly gets 1.0.1 with breaking cascade
- ✅ `private_packages.ts`: consumer now correctly gets 1.0.1 with proper cascade
- ✅ `peer_deps_only.ts`: plugin_b now correctly gets 1.5.1 (peer deps work)
- ✅ `major_bumps.ts`: Already worked - major escalation was correct
- ✅ All 171 tests passing
- ✅ Integration test baselines regenerated

## Concrete Next Steps

### 1. Test Real Dry Run with Actual Changesets
- Run `gro gitops_publish --dry` on actual repos with changesets
- Verify output matches preview expectations
- Test with bump escalation scenario (patch changeset + breaking dep)

### 2. Test Resume Functionality
- Simulate failed publish (kill mid-process)
- Verify `--resume` flag works correctly
- Test that dry runs don't interfere with resume state

### 3. Add Missing Test Coverage
Priority modules without tests:
- `npm_registry.ts` - NPM availability checks, exponential backoff
- `pre_flight_checks.ts` - Workspace/branch validation
- `dependency_updater.ts` - Package.json updates with changesets
- `publishing_state.ts` - State persistence and resume logic

### 5. Validate Auto-Changeset Generation in Real Publish
- Publish a package with explicit changesets
- Verify dependent packages get auto-generated changesets
- Check changeset content format is correct
- Ensure git commits are clean

### 6. Test Breaking Change Cascades
- Create breaking change in leaf package (e.g., moss)
- Verify cascade propagates correctly (moss → gro → fuz → fuz_blog)
- Check all affected packages get appropriate bumps

## Speculative Improvements

### Output & Reporting

**1. Rich Terminal Output**
- Progress bars for NPM wait loops
- Tree view of dependency updates during publish
- Colored diff preview before confirmation
- Live status indicators (⏳ → ✅ → 💾)

**2. HTML Report Generation**
- `gro gitops_preview --format html --outfile preview.html`
- Interactive dependency graph visualization
- Click to expand version details
- Export/share preview with team

**3. Slack/Discord Notifications**
- Post publish summary to chat
- Include breaking changes alert
- Link to git tags and NPM packages
- Configurable via `gitops.config.ts`

### Safety & Validation

**4. Pre-Publish Validation**
- Run `gro check` on all repos before publishing
- Verify tests pass for packages being published
- Check for uncommitted changes in dependent packages
- Lint changeset descriptions

**5. Rollback Support**
- `gro gitops_rollback` to undo last publish
- Store pre-publish git SHAs
- Automated git revert + npm unpublish
- Safety check: only if <1 hour old

**6. Dry Run Simulation Improvements**
- Simulate auto-changeset generation in dry mode
- Show predicted commit messages
- Estimate NPM wait time based on package size
- Preview git tags that would be created

### Developer Experience

**7. Interactive Mode**
- `gro gitops_publish --interactive`
- Review each package before publishing
- Skip/retry individual packages
- Edit auto-generated changeset messages

**8. Changeset Templates**
- `gro gitops_changeset --template breaking`
- Pre-defined templates for common changes
- Team-specific conventions
- Auto-populate from git commits

**9. Publishing Profiles**
- `gitops.config.ts` with multiple profiles
- `--profile production` vs `--profile beta`
- Different strategies per environment
- Selective package publishing

### Advanced Features

**10. Parallel Publishing**
- Publish independent packages in parallel
- Respect dependency order, maximize concurrency
- Configurable worker pool size
- Show parallel progress

**11. Monorepo Integration**
- Support workspaces in single repo
- Compare with lerna/changesets
- Hybrid mode: some repos multi, some mono
- Benchmark performance differences

**12. Version Constraints**
- Enforce version policies in config
- Prevent major bumps on Fridays
- Require manual approval for breaking changes
- Block publish if deps are outdated

**13. Analytics Dashboard**
- Track publish frequency per package
- Breaking change rate over time
- NPM download stats integration
- CI failure correlation

**14. Git Integration Enhancements**
- Auto-create PRs for dependency updates
- Tag format customization
- Squash commits before publishing
- Generate CHANGELOG.md automatically

### Performance

**15. Caching Optimizations**
- Cache NPM registry checks (15min → 1hr)
- Parallel changeset file reads
- Memoize dependency graph builds
- Background refresh for GitHub API data

**16. Incremental Publishing**
- Only check repos with git changes since last publish
- Skip unchanged packages in analysis
- Faster preview for large repo collections

## Questions to Explore

- Should bump escalation be opt-in per package?
- How to handle version conflicts across branches?
- Support for non-NPM registries (GitHub, private)?
- Integration with GitHub Actions workflows?
- Metrics: What should we track about publish health?