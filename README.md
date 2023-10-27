# orc

> a tool for orchestrating many repos 🪄 [orc.ryanatkn.com](https://orc.ryanatkn.com/)

I maintain a lot of git repos between
[Felt](https://github.com/feltjs/felt), [Fuz](https://github.com/fuz-dev/fuz),
[Gro](https://github.com/grogarden/gro), and [others](https://github.com/ryanatkn).
Orc is a tool to help me orchestrate this complexity.
It's first user project is [Spiderspace](https://github.com/spiderspace/spiderspace).

The goal is to make a generic tool that works for your projects too,
but for now I'm hardcoding all values in
[`$lib/orc.config.ts`](src/lib/orc.config.ts).
If you want to try it yourself, you can fork the repo and change the config manually,
and eventually I'll stabilize the APIs and publish a reusable library.

## Usage

- see [`.env.example`](/.env.example) and add your own `.env` with `GITHUB_TOKEN`,
  whose value is a [GitHub token](https://github.com/settings/tokens)
  with the `public_repo` capability
  (optional for reads, and currently that's the only functionality,
  but it ups the rate limiting a lot)

TODO

- figure out better automation than manually running `gro packages`
- automate `.env` (gro sync?)

## License [🐦](https://wikipedia.org/wiki/Free_and_open-source_software)

[MIT](LICENSE)
