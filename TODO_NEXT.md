# TODO_NEXT

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

### 4. Validate Auto-Changeset Generation in Real Publish
- Publish a package with explicit changesets
- Verify dependent packages get auto-generated changesets
- Check changeset content format is correct
- Ensure git commits are clean

### 5. Test Breaking Change Cascades
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