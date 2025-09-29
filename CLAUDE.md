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
- `src/lib/gitops.task.ts` - main Gro task orchestrating operations
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

### `gro gitops` Task

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

- `gro gitops_publish` - publishes repos in dependency order
- Handles circular dev dependencies by excluding from topological sort
- Waits for NPM propagation with exponential backoff
- Updates cross-repo dependencies automatically

Key modules:

- `npm_registry.ts` - NPM availability checks with retry
- `dependency_updater.ts` - Package.json updates
- `multi_repo_publisher.ts` - Simple orchestration

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
gro gitops               # update local data
gro gitops --download    # clone missing repos
gro dev                  # start dev server
gro build               # build static site
gro deploy              # deploy to GitHub Pages
```

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
