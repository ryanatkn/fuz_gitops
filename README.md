# fuz_gitops

[<img src="/static/logo.svg" alt="a friendly blue spider facing you" align="right" width="192" height="192">](https://gitops.fuz.dev/)

> a tool for managing many repos 🪄 [gitops.fuz.dev](https://gitops.fuz.dev/)

fuz_gitops is alternative to the monorepo pattern that more loosely couples repos:

- enables automations across repos without requiring them to be in the same monorepo
- allows each repo to be managed from multiple fuz_gitops projects
- runs automations locally on your machine, giving you full control and visibility
  (big tradeoffs in both directions compared to GitHub actions)

With fuz_gitops you can:

- fetch metadata about collections of repos and import it as typesafe JSON (using
  [Gro's public package patterns](https://github.com/ryanatkn/gro/blob/main/src/docs/gro_plugin_sveltekit_app.md#well_known_package_json))
- publish a generated docs website for your collections of repos
- import its components to view and interact with repo collection metadata
- publish metadata about your collections of repos to the web for other users and tools
- publish multiple interdependent packages in dependency order with automatic dependency updates

## Usage

```bash
npm i -D @ryanatkn/fuz_gitops
```

- configure [`gitops.config.ts`](/gitops.config.ts)
- fuz_gitops calls the GitHub API using the environment variable `SECRET_GITHUB_API_TOKEN` for authorization,
  which is a [classic GitHub token](https://github.com/settings/tokens)
  (with "public access" for public repos, no options selected)
  or a [fine-grainted GitHub token (beta)](https://github.com/settings/tokens?type=beta)
  (with `"Public Repositories (read-only)"` selected)
  in either `process.env`, a project-local `.env`, or the parent directory at `../.env`
  (currently optional to read public repos, but it's recommended regardless,
  and you'll need to select options to support private repos)
- re-export the `gro gitops_sync` task by creating `$lib/gitops_sync.task.ts` with
  the contents `export * from '@ryanatkn/fuz_gitops/gitops_sync.task.js';`
- run `gro gitops_sync` to sync repos and update the local data

## Architecture

```
gitops.config.ts → local repos → GitHub API → repos.ts → UI components
```

- **Operations pattern**: Dependency injection for all side effects (git, npm, fs)
- **Fixture testing**: Generated git repos for isolated tests
- **Changeset-driven**: Automatic version bumps and dependency updates

See [CLAUDE.md](CLAUDE.md#architecture) for detailed documentation.

## Quick Start

### Syncing repo metadata

```bash
gro gitops_sync               # sync repos and generate UI data
gro gitops_sync --download    # clone missing repos first
```

### Publishing packages

```bash
gro gitops_validate      # validate before publishing (read-only)
gro gitops_publish       # publish all repos with changesets
```

**See [CLAUDE.md](CLAUDE.md) for comprehensive documentation:**

- Command reference (read-only vs side effects)
- Publishing workflows and examples
- Troubleshooting guide
- Architecture and testing patterns

Getting started as a dev? Start with [Gro](https://github.com/grogarden/gro)
and the [Fuz template](https://github.com/fuz-dev/fuz_template).

TODO

- figure out better automation than manually running `gro gitops_sync`
- show the rate limit info
- think about how fuz_gitops could use both GitHub Actions and
  [Forgejo Actions](https://forgejo.org/docs/v1.20/user/actions/)

## License [🐦](https://wikipedia.org/wiki/Free_and_open-source_software)

[MIT](LICENSE)
