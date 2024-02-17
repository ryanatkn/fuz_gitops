# orc

> a tool for managing many repos 🪄 [gitops.ryanatkn.com](https://gitops.ryanatkn.com/)

I maintain a lot of git repos between
[Spiderspace](https://github.com/spiderspace), [Fuz](https://github.com/fuz-dev),
[Gro](https://github.com/grogarden/gro), and [others](https://github.com/ryanatkn).
Orc is a tool for helping me orchestrate this complexity.
It's not orchestration in the Kubernetes or Pulumi sense (maybe it needs a rename).
It's an alternative to the monorepo pattern that more loosely couples repos:

- enables automations across repos without requiring them to be in the same monorepo
- allows management of the same repo in multiple Orc projects
- runs automations locally on your machine, giving you full control and visibility

With Orc you can:

- fetch metadata about collections of deployments and import it as typesafe JSON (using
  [Gro's public package patterns](https://github.com/grogarden/gro/blob/main/src/lib/docs/gro_plugin_sveltekit_frontend.md#well_known_package_json))
- publish a generated docs website for your collections of deployments
- import its components to view and interact with deployment collection metadata
- publish metadata about your collections of deployments to the web for other users and tools

planned additions:

- run updating operations and other workflows from the frontend in dev mode
  (ultimately, an `update all` button)

## Usage

- configure [`orc.config.ts`](/orc.config.ts)
- Orc calls the GitHub API using the environment variable `GITHUB_TOKEN_SECRET` for authorization,
  which is a [GitHub token](https://github.com/settings/tokens)
  (with "public access" for public repos, no options selected)
  in either `process.env`, a project-local `.env`, or the parent directory at `../.env`
  (currently optional to read public repos, but it's recommended regardless,
  and you'll need to select options to support private repos)
- re-export the `gro deployments` task by creating `$lib/deployments.task.ts` with
  the contents `export * from '@ryanatkn/fuz_gitops/deployments.task.js';`
- run `gro deployments` to update the local data

Getting started as a dev? Start with [Gro](https://github.com/grogarden/gro)
and the [Fuz template](https://github.com/fuz-dev/fuz_template).

TODO

- figure out better automation than manually running `gro deployments`
- show the rate limit info
- think about how Orc could better leverage both GitHub Actions and
  [Forgejo Actions](https://forgejo.org/docs/v1.20/user/actions/)
  without unwieldy compat

## License [🐦](https://wikipedia.org/wiki/Free_and_open-source_software)

[MIT](LICENSE)
