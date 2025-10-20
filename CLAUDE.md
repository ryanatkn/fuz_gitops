# fuz_gitops

A tool for managing many repos - alternative to monorepo pattern that loosely couples repos.

## Core functionality

- Fetches metadata from repo collections via GitHub API
- Manages local repo clones and syncs branches
- Generates typesafe JSON from package.json and exported modules metadata
- Publishes docs websites for repo collections
- Tracks CI status and pull requests

## Architecture

```
gitops.config.ts -> local repos -> GitHub API -> repos.ts -> UI components
```

### Key files

- `gitops.config.ts` - user config defining repo collections
- `src/lib/gitops_sync.task.ts` - syncs local repos and generates UI data
- `src/lib/local_repo.ts` - manages local repo clones, branch switching
- `src/lib/github.ts` - GitHub API client for PRs, CI status
- `src/lib/fetch_repo_data.ts` - fetches remote repo metadata
- `src/routes/repos.ts` - generated data file with all repo info

## Configuration

```ts
// gitops.config.ts
export default {
	repos: ['https://github.com/owner/repo', {repo_url: '...', repo_dir: '...', branch: 'main'}],
};
```

Requires `SECRET_GITHUB_API_TOKEN` in `.env` for API access.

## Main operations

### `gro gitops_sync` Task

1. Loads config from `gitops.config.ts`
2. Resolves local repos (clones missing if `--download`)
3. Switches branches and syncs as needed
4. Fetches GitHub data (CI, PRs)
5. Generates `src/routes/repos.ts`
6. Updates cache

### Local repo management

- Resolves repo URLs to local directories
- Clones missing repos via SSH
- Switches branches maintaining clean workspace
- Runs `gro sync` after branch changes

### Data fetching

- Pull requests via GitHub API
- CI check runs and status
- Package metadata from .well-known endpoints
- Caches responses to minimize API calls

### Multi-repo publishing

#### Publishing Workflow

- `gro gitops_publish` - publishes repos in dependency order
- `gro gitops_plan` - generates a publishing plan (read-only prediction)
- `gro gitops_analyze` - analyzes dependencies and changesets
- `gro gitops_publish --dry` - simulates publishing without pre-flight checks or state persistence
- Handles circular dev dependencies by excluding from topological sort
- Waits for NPM propagation with exponential backoff
- Updates cross-repo dependencies automatically
- Pre-flight checks validate clean workspaces, branches, builds, and npm authentication (skipped for --dry runs)

**Build Validation (Fail-Fast Safety)**

The publishing workflow includes build validation in pre-flight checks to prevent broken state:

1. **Pre-flight phase** (before any publishing):
   - Runs `gro build` on all packages with changesets
   - Validates builds using current versions (no side effects)
   - Fails fast if ANY build fails

2. **Publishing phase** (after validation):
   - Runs `gro publish --no-build` for each package
   - Builds already validated, so no risk of build failures mid-publish
   - Also runs `gro deploy --no-build` if `--deploy` flag used

This prevents the known issue in `gro publish` where build failures leave repos in broken state (version bumped but not published).

**Plan vs Dry Run**

`gro gitops_plan`:
- **Read-only prediction** - Generates a publishing plan showing what would be published
- Uses fixed-point iteration to resolve transitive cascades (max 10 iterations)
- Shows all 4 publishing scenarios: explicit changesets, bump escalation, auto-generated changesets, and no changes
- No side effects - does not modify any files or state

`gro gitops_publish --dry`:
- **Simulated execution** - Runs the same code path as real publishing
- Skips pre-flight checks (workspace, branch, npm auth)
- Does NOT load or save publishing state (no `.gro/fuz_gitops/publish_state.json`)
- Only simulates packages with explicit changesets (can't auto-generate changesets without real publishes)
- Use plan for comprehensive "what would happen" analysis; use dry run to test execution flow

#### Changeset Semantics

Packages can publish in four distinct scenarios:

**1. Explicit Changesets (Normal Publishing)**
- Package has `.changeset/*.md` files
- Dependency updates don't require higher bump
- Behavior: Published with version bump from changesets
- Reported as: "Version Changes (from changesets)"

**2. Explicit Changesets with Bump Escalation**
- Package has `.changeset/*.md` files specifying bump type
- BUT dependency updates require a HIGHER bump
- Behavior: Published with escalated bump (e.g., `patch` → `minor` for breaking dep)
- Reported as: "Version Changes (bump escalation required)"
- Example: You write `patch` changeset, but `gro` (breaking) forces `minor`

**3. Auto-Generated Changesets**
- Package has NO `.changeset/*.md` files
- BUT has production/peer dependency updates
- Behavior: Changeset auto-generated, package republished
- Reported as: "Version Changes (auto-generated for dependency updates)"
- Example: `gro` publishes → `fuz` depends on `gro` → auto-changeset for `fuz`

**4. No Changes to Publish**
- Package has NO `.changeset/*.md` files
- Package has NO production/peer dependency updates
- Behavior: Skipped (not published)
- Reported as: Informational status (not a warning)
- This is normal: Only packages with changes should publish

**Dependency Update Behavior**

When a dependency is updated:
- **Production/peer deps**: Package must republish (triggers auto-changeset if needed)
- **Dev deps**: Package.json updated, NO republish (dev-only changes)

#### Key Publishing Modules

- `multi_repo_publisher.ts` - Main publishing orchestration
- `publishing_plan.ts` - Publishing plan generation and cascade analysis
- `changeset_reader.ts` - Parses changesets and predicts versions
- `changeset_generator.ts` - Auto-generates changesets for dependency updates
- `dependency_graph.ts` - Topological sorting and cycle detection
- `graph_validation.ts` - Shared cycle detection and publishing order computation
- `version_utils.ts` - Version comparison and bump type detection
- `npm_registry.ts` - NPM availability checks with retry
- `dependency_updater.ts` - Package.json updates with changesets
- `publishing_state.ts` - Failure recovery and resume support
- `pre_flight_checks.ts` - Pre-publish validation including build checks
- `operations.ts` - Dependency injection interfaces for testability (including build operations)

#### Publishing Algorithms

**Fixed-Point Iteration (Cascade Resolution)**

The publishing plan generation uses fixed-point iteration to resolve transitive breaking change cascades:

1. **Initial pass**: Identify all packages with explicit changesets
2. **Iteration loop** (max 10 iterations):
   - Calculate dependency updates based on predicted versions
   - For each package:
     - Check if dependencies require a bump (prod/peer deps only)
     - **Bump escalation**: If existing changesets specify lower bump than required, escalate
     - **Auto-changesets**: If no changesets but deps updated, generate auto-changeset
     - Track breaking changes to propagate to dependents
   - Loop until no new version changes discovered (fixed point reached)
3. **Final pass**: Calculate all dependency updates and cascades

The 10-iteration limit prevents infinite loops while handling complex dependency graphs. In practice, most repos converge in 2-3 iterations.

**Cycle Detection Strategy**

The system uses topological sort with dev dependency exclusion:

- **Production/peer cycles**: Block publishing (error, must be resolved)
  - These create impossible ordering: Package A depends on Package B which depends on Package A
  - Solution: Move one dependency to devDependencies or restructure
- **Dev cycles**: Allowed and normal (warning only)
  - Dev dependencies don't affect runtime, so cycles are safe
  - Topological sort excludes dev deps (`exclude_dev=true`) to break these cycles
- **Publishing order**: Computed via topological sort on prod/peer deps only
  - Ensures dependencies publish before dependents
  - Dev dependencies updated in separate phase after all publishing completes

This strategy enables practical multi-repo patterns (e.g., shared test utilities) while preventing runtime dependency issues.

## Data types

```ts
interface Repo extends Pkg {
	check_runs: Github_Check_Runs_Item | null;
	pull_requests: Array<Github_Pull_Request> | null;
}

interface Local_Repo {
	repo_name: string;
	repo_dir: string;
	repo_url: string;
	pkg: Pkg;
}
```

## UI components

- `Repos_Table.svelte` - dependency matrix view
- `Repos_Tree.svelte` - hierarchical repo browser
- `Modules_*.svelte` - module exploration
- `Pull_Requests_*.svelte` - PR tracking

## Commands

```bash
npm i -D @ryanatkn/fuz_gitops

# Data management
gro gitops_sync               # sync repos and update local data
gro gitops_sync --download    # clone missing repos

# Publishing
gro gitops_validate      # validate configuration (runs analyze, plan, and dry run)
gro gitops_analyze       # analyze dependencies and changesets
gro gitops_plan          # generate publishing plan
gro gitops_publish       # publish repos in dependency order
gro gitops_publish --dry # dry run without pre-flight checks
gro gitops_publish --no-plan # skip plan confirmation before publishing

# Development
gro dev                  # start dev server
gro build               # build static site
gro deploy              # deploy to GitHub Pages

# Fixture Management
gro src/fixtures/generate_repos # generate test git repos from fixture data
gro src/fixtures/update         # regenerate baseline outputs for gitops commands
gro test src/fixtures/check     # validate command outputs match baselines
```

## Commands Reference

Commands are categorized by their side effects:

### Read-Only Commands (Safe, No Side Effects)
- `gro gitops_analyze` - Analyze dependency graph, detect cycles
- `gro gitops_plan` - Generate publishing plan showing version changes and cascades
- `gro gitops_validate` - Run all validation checks (analyze + plan + dry run)
- `gro gitops_publish --dry` - Simulate publishing without pre-flight checks

### Data Sync Commands (Local Changes Only)
- `gro gitops_sync` - Fetch repo metadata, generate src/routes/repos.ts (also ensures repos are cloned and ready)

### Publishing Commands (Git & NPM Side Effects)
- `gro gitops_publish` - Publish packages, update dependencies, git commits

**Command Workflow:**
- `gitops_validate` runs: `gitops_analyze` + `gitops_plan` + `gitops_publish --dry`
- `gitops_publish` runs: `gitops_plan` (with confirmation) + actual publish

## Dependencies

- `@ryanatkn/gro` - build tool and task runner
- `@ryanatkn/fuz` - UI components and utilities
- `@ryanatkn/belt` - utility functions
- `@sveltejs/kit` - web framework
- `zod` - schema validation

## Patterns

- Uses Gro's well-known package.json patterns for metadata
- Generates static JSON for fast client-side rendering
- Caches API responses with 15-minute TTL
- Atomic file updates with format checking
- Supports both relative and absolute repo paths
- Functional programming patterns (arrow functions, pure functions)
- Changeset-driven versioning with auto-generation
- State persistence for publishing failure recovery

## Testability & Operations Pattern

This project uses **dependency injection** for all side effects, making it fully testable without mocks:

**Why:** Functions that call git, npm, or file system are hard to test. The operations pattern abstracts these into interfaces.

**How:** See `src/lib/operations.ts` - all external dependencies (git, npm, fs, process, build) are defined as interfaces. Tests provide mock implementations.

**Example:**
- Production: `multi_repo_publisher(repos, options, default_gitops_operations)`
- Tests: `multi_repo_publisher(repos, options, mock_gitops_operations)`

See `src/lib/default_operations.ts` for real implementations and test files for mock implementations.

## Testing

Uses vitest with **zero mocks** - all tests use the operations pattern for dependency injection (see above).

```bash
gro test                 # run all tests
gro test version_utils   # run specific test file
gro test src/fixtures/check # validate command output fixtures
```

Core modules tested:

- `version_utils.test.ts` - Version comparison and semver logic
- `changeset_reader.test.ts` - Changeset parsing and version prediction
- `dependency_graph.test.ts` - Topological sorting and cycle detection
- `changeset_generator.test.ts` - Auto-changeset content generation
- `pre_flight_checks.test.ts` - Workspace, branch, and npm validation
- `dependency_updater.test.ts` - Package.json updates and git commits
- `publishing_state.test.ts` - State management for resume functionality

### Fixture Testing

The fixture system uses **generated git repositories** for isolated, reproducible integration tests:

**Generated Test Repos:**
- `src/fixtures/repos/` - Auto-generated from fixture data (gitignored)
- `src/fixtures/repo_fixtures/*.ts` - Source of truth for test repo definitions
- `src/fixtures/generate_repos.ts` - Idempotent repo generation logic
- `src/fixtures/gitops.fixtures.config.ts` - Gitops config for test repos

**Fixture Scenarios (9 total):**
- `basic_publishing` - All 4 publishing scenarios (explicit, auto-generated, bump escalation, no changes)
- `deep_cascade` - 4-level dependency chains with cascading breaking changes
- `circular_dev_deps` - Dev dependency cycles (allowed, non-blocking)
- `circular_prod_deps_error` - Production circular dependencies (error detection)
- `private_packages` - Private package handling (skipped from publishing)
- `major_bumps` - Major version transitions (0.x → 1.0, 1.x → 2.0)
- `peer_deps_only` - Plugin/adapter patterns (peer dependencies only)
- `isolated_packages` - Independent packages with no internal dependencies
- `multiple_dep_types` - Packages with both peer and dev deps on same dependency

**Baseline Validation:**
- `src/fixtures/gitops_analyze_output.md` - Baseline for `gro gitops_analyze`
- `src/fixtures/gitops_plan_output.md` - Baseline for `gro gitops_plan`
- `src/fixtures/gitops_publish_dry_output.md` - Baseline for `gro gitops_publish --dry`
- `src/fixtures/check.test.ts` - Compares live output against baselines
- `src/fixtures/update.task.ts` - Regenerates baselines when needed

**Workflow:**
1. Define fixture data in `repo_fixtures/*.ts`
2. Run `gro src/fixtures/generate_repos` to create test git repos
3. Run `gro src/fixtures/update` to capture baseline outputs
4. Run `gro test src/fixtures/check` to validate outputs match baselines

Test repos are isolated from real workspace repos and can run in CI without cloning.

## Publishing Workflows

### Safe Validation Workflow

Before publishing, always validate your configuration:

```bash
# 1. Run comprehensive validation (no side effects)
gro gitops_validate

# 2. Review analyze output
gro gitops_analyze

# 3. Review plan to see what will be published
gro gitops_plan

# 4. Test with dry run
gro gitops_publish --dry

# 5. If everything looks good, publish
gro gitops_publish
```

### Real-World Examples

**Example 1: Publishing a single package with changesets**

```bash
# Create a changeset for your package
cd packages/my-package
npx changeset
# Follow prompts to describe changes

# Generate plan to see what will be published
gro gitops_plan
# Output shows: my-package: 1.0.0 → 1.1.0 (minor)

# Publish
gro gitops_publish
```

**Example 2: Publishing multiple packages with cascading dependencies**

```bash
# You have changesets in @my/core
# Dependents: @my/ui depends on @my/core

# Plan shows cascade
gro gitops_plan
# Output:
#   @my/core: 1.0.0 → 2.0.0 (major, BREAKING)
#   @my/ui: 1.5.0 → 2.0.0 (auto-changeset, BREAKING cascade)

# Publish in dependency order
gro gitops_publish
```

**Example 3: Recovering from failures with --resume**

```bash
# Publishing failed midway through
gro gitops_publish
# Error: Failed to publish @my/package-5

# Fix the issue, then resume
gro gitops_publish --resume
# Skips already-published packages, continues from failure
```

**Example 4: Using plan for planning**

```bash
# See what would happen without actually publishing
gro gitops_plan

# Save output to file for review
gro gitops_plan --format markdown --outfile publish-plan.md
```

**Example 5: Bump escalation**

```bash
# You created a patch changeset for @my/app
# But @my/core (dependency) has a breaking change

# Plan shows escalation
gro gitops_plan
# Output:
#   @my/core: 1.0.0 → 2.0.0 (major, BREAKING)
#   @my/app: 2.0.0 → 3.0.0 (patch → major, escalated)

# Publish handles escalation automatically
gro gitops_publish
```

## Troubleshooting

### Common Errors and Solutions

**Error: "Pre-flight checks failed: workspace has uncommitted changes"**

Solution: Commit or stash your changes before publishing
```bash
git status
git add .
git commit -m "prepare for publish"
```

**Error: "Pre-flight checks failed: not on main branch"**

Solution: Switch to main branch
```bash
git checkout main
git pull
```

**Error: "npm authentication failed"**

Solution: Log in to npm
```bash
npm login
npm whoami  # verify login
```

**Error: "Pre-flight checks failed: [package] failed to build"**

Solution: Fix the build errors before publishing
```bash
cd path/to/package
gro build  # See the full build error
# Fix the errors
gro build  # Verify it works
```

Build validation runs during pre-flight checks to prevent broken state. All packages must build successfully before any publishing begins.

**Warning: "Plan differs from actual publish"**

This can happen if:
- Another publish happened between plan generation and actual publish
- NPM registry has not propagated yet

Solution: Run plan again, compare outputs

**Error: "Circular dependency detected in production dependencies"**

Solution: Production/peer circular dependencies block publishing. You must:
1. Identify the cycle in `gro gitops_analyze` output
2. Move one dependency to devDependencies
3. Or restructure to remove the cycle

Note: Dev dependency cycles are normal and allowed.

**Error: "Failed to publish: package not found on NPM after 5 minutes"**

Solution: NPM propagation can be slow. Either:
- Wait longer and use `--resume`
- Check NPM registry status
- Verify package was actually published

**Issue: "Auto-changeset generated when I didn't expect it"**

This happens when:
- A dependency was published with a new version
- Your package has that dependency in dependencies or peerDependencies

This is correct behavior - packages must republish when their dependencies change.

**Issue: "Package not publishing even though I have a changeset"**

Check:
1. Changeset file is in `.changeset/` directory
2. Changeset file is not `README.md`
3. Changeset references the correct package name
4. Changeset has valid frontmatter format

**Issue: "Publish state file causing issues"**

The state file is stored in `.gro/fuz_gitops/publish_state.json`

To reset:
```bash
rm .gro/fuz_gitops/publish_state.json
```

### Debugging Tips

**View detailed dependency graph:**
```bash
gro gitops_analyze --format markdown --outfile deps.md
```

**Compare plan vs actual:**
```bash
# Before publishing
gro gitops_plan --format markdown --outfile plan.md

# After publishing (dry run)
gro gitops_publish --dry --format markdown --outfile actual.md

# Compare files
diff plan.md actual.md
```

**Check what changed since last publish:**
```bash
# In each repo
git log --oneline
ls .changeset/
```

## Output Directory

All gitops-generated files are stored in `.gro/fuz_gitops/`:
- `publish_state.json` - Persistent state for resume functionality
- Temporary output files during command execution

This directory should be gitignored (already in `.gitignore`).
