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
  [Gro's public package patterns](https://github.com/grogarden/gro/blob/main/src/lib/docs/gro_plugin_sveltekit_frontend.md#well_known_package_json))
- publish a generated docs website for your collections of repos
- import its components to view and interact with repo collection metadata
- publish metadata about your collections of repos to the web for other users and tools

planned additions:

- run updating operations and other workflows from the frontend in dev mode
  (ultimately, an `update all` button)

## Usage

```bash
npm i -D @ryanatkn/fuz_gitops
```

- configure [`fuz.config.ts`](/fuz.config.ts)
- fuz_gitops calls the GitHub API using the environment variable `GITHUB_TOKEN_SECRET` for authorization,
  which is a [classic GitHub token](https://github.com/settings/tokens)
  (with "public access" for public repos, no options selected)
  or a [fine-grainted GitHub token (beta)](https://github.com/settings/tokens?type=beta)
  (with `"Public Repositories (read-only)"` selected)
  in either `process.env`, a project-local `.env`, or the parent directory at `../.env`
  (currently optional to read public repos, but it's recommended regardless,
  and you'll need to select options to support private repos)
- re-export the `gro gitops` task by creating `$lib/gitops.task.ts` with
  the contents `export * from '@ryanatkn/fuz_gitops/gitops.task.js';`
- run `gro gitops` to update the local data

Getting started as a dev? Start with [Gro](https://github.com/grogarden/gro)
and the [Fuz template](https://github.com/fuz-dev/fuz_template).

TODO

- figure out better automation than manually running `gro gitops`
- show the rate limit info
- think about how fuz_gitops could better leverage both GitHub Actions and
  [Forgejo Actions](https://forgejo.org/docs/v1.20/user/actions/)
  without unwieldy compat

## License [🐦](https://wikipedia.org/wiki/Free_and_open-source_software)

[MIT](LICENSE)
