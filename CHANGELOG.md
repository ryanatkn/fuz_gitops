# @ryanatkn/fuz_gitops

## 0.40.0

### Minor Changes

- rename `SECRET_GITHUB_TOKEN` from `GITHUB_TOKEN_SECRET` ([fb306be](https://github.com/ryanatkn/fuz_gitops/commit/fb306be))

## 0.39.0

### Minor Changes

- add `gro gitops_ready` task ([#31](https://github.com/ryanatkn/fuz_gitops/pull/31))

## 0.38.0

### Minor Changes

- upgrade to use `create_context` ([deab96d](https://github.com/ryanatkn/fuz_gitops/commit/deab96d))

## 0.37.0

### Minor Changes

- bump required node version to `20.17` ([e114227](https://github.com/ryanatkn/fuz_gitops/commit/e114227))

## 0.36.0

### Minor Changes

- upgrade `@ryanatkn/fuz@0.119` from `0.118.2` and `@ryanatkn/moss@0.12` from `0.11.1` ([df573dc](https://github.com/ryanatkn/fuz_gitops/commit/df573dc))

## 0.35.0

### Minor Changes

- upgrade deps ([117e0f4](https://github.com/ryanatkn/fuz_gitops/commit/117e0f4))

## 0.34.0

### Minor Changes

- loosen peer deps temporarily ([a7dc4c7](https://github.com/ryanatkn/fuz_gitops/commit/a7dc4c7))

## 0.33.0

### Minor Changes

- change the gitops config source of truth from a deployment url to the repo url ([#30](https://github.com/ryanatkn/fuz_gitops/pull/30))

## 0.32.0

### Minor Changes

- pin peer deps ([#29](https://github.com/ryanatkn/fuz_gitops/pull/29))
- rename `Repo` from `Deployment` ([#29](https://github.com/ryanatkn/fuz_gitops/pull/29))

## 0.31.1

### Patch Changes

- format repos with multiline strings ([7799fc2](https://github.com/ryanatkn/fuz_gitops/commit/7799fc2))

## 0.31.0

### Minor Changes

- upgrade `@ryanatkn/fuz@0.110.4` from `0.108.4` ([acb7bb4](https://github.com/ryanatkn/fuz_gitops/commit/acb7bb4))

## 0.30.2

### Patch Changes

- add tsconfig `sourceRoot` ([b50c370](https://github.com/ryanatkn/fuz_gitops/commit/b50c370))
- publish src files ([68129cc](https://github.com/ryanatkn/fuz_gitops/commit/68129cc))
- enable tsconfig `declaration` and `declarationMap` ([936beb5](https://github.com/ryanatkn/fuz_gitops/commit/936beb5))

## 0.30.1

### Patch Changes

- improve `gro gitops` path handling and add a banner to the generated `repos.ts` ([f18720d](https://github.com/ryanatkn/fuz_gitops/commit/f18720d))

## 0.30.0

### Minor Changes

- change `$routes/repos.ts` from `$lib/deployments.json` and add `outdir` to `gro gitops` to customize it ([#28](https://github.com/ryanatkn/fuz_gitops/pull/28))

### Patch Changes

- add `sideEffects` to `package.json` ([c91c043](https://github.com/ryanatkn/fuz_gitops/commit/c91c043))

## 0.29.1

### Patch Changes

- upgrade gro with correctly formatted exports ([28379ed](https://github.com/ryanatkn/fuz_gitops/commit/28379ed))

## 0.29.0

### Minor Changes

- support `node@20.12` and later ([46b804b](https://github.com/ryanatkn/fuz_gitops/commit/46b804b))

## 0.28.0

### Minor Changes

- upgrade `node@22.3` and `@ryanatkn/gro@0.120.0` ([eca969a](https://github.com/ryanatkn/fuz_gitops/commit/eca969a))

## 0.27.0

### Minor Changes

- throw on 401s in GitHub fetch helpers to abort on invalid tokens ([#24](https://github.com/ryanatkn/fuz_gitops/pull/24))

## 0.26.0

### Minor Changes

- set peer deps for `svelte` and `@sveltejs/kit` ([#23](https://github.com/ryanatkn/fuz_gitops/pull/23)) ([287df05](https://github.com/ryanatkn/fuz_gitops/commit/287df05))

## 0.25.0

### Minor Changes

- upgrade to svelte 5 ([#21](https://github.com/ryanatkn/fuz_gitops/pull/21))
- rename `Modules_Nav` from `Modules_Menu` ([#21](https://github.com/ryanatkn/fuz_gitops/pull/21))

### Patch Changes

- add `Page_Header` and `Page_Footer` ([#21](https://github.com/ryanatkn/fuz_gitops/pull/21))

## 0.24.0

### Minor Changes

- upgrade deps ([1e0ef29](https://github.com/ryanatkn/fuz_gitops/commit/1e0ef29))

## 0.23.1

### Patch Changes

- format URLs correctly with pathname ([89c315f](https://github.com/ryanatkn/fuz_gitops/commit/89c315f))

## 0.23.0

### Minor Changes

- upgrade `@ryanatkn/fuz@0.91.0` ([1a5a0f7](https://github.com/ryanatkn/fuz_gitops/commit/1a5a0f7))

## 0.22.0

### Minor Changes

- upgrade deps ([32be3d9](https://github.com/ryanatkn/fuz_gitops/commit/32be3d9))

## 0.21.0

### Minor Changes

- upgrade deps ([d6e8234](https://github.com/ryanatkn/fuz_gitops/commit/d6e8234))

## 0.20.1

### Patch Changes

- fix imports ([cf7aecd](https://github.com/ryanatkn/fuz_gitops/commit/cf7aecd))

## 0.20.0

### Minor Changes

- gitops.fuz.dev ([#20](https://github.com/ryanatkn/fuz_gitops/pull/20))

## 0.19.0

### Minor Changes

- upgrade ([205563c](https://github.com/ryanatkn/fuz_gitops/commit/205563c))

## 0.18.0

### Minor Changes

- republish ([9cc181e](https://github.com/ryanatkn/fuz_gitops/commit/9cc181e))

## 0.17.0

### Minor Changes

- upgrade @grogarden/util and switch to use its `fetch_value` ([#18](https://github.com/ryanatkn/fuz_gitops/pull/18))

## 0.16.3

### Patch Changes

- use `selected` instead of `active` for link classes ([1cdc18f](https://github.com/ryanatkn/fuz_gitops/commit/1cdc18f))

## 0.16.2

### Patch Changes

- fix `parse_deployments` to require a `homepage_url` ([d1bccb4](https://github.com/ryanatkn/fuz_gitops/commit/d1bccb4))

## 0.16.1

### Patch Changes

- fix tree nav flex direction ([a1cc247](https://github.com/ryanatkn/fuz_gitops/commit/a1cc247))

## 0.16.0

### Minor Changes

- fix local package `gro gitops` ([#15](https://github.com/ryanatkn/fuz_gitops/pull/15))

### Patch Changes

- add `Page_Footer`, `Page_Header`, and page components ([#16](https://github.com/ryanatkn/fuz_gitops/pull/16))
- add tree nav component ([#12](https://github.com/ryanatkn/fuz_gitops/pull/12))

## 0.15.0

### Minor Changes

- query and display CI status ([#17](https://github.com/ryanatkn/fuz_gitops/pull/17))

### Patch Changes

- fix pull request links ([523131f](https://github.com/ryanatkn/fuz_gitops/commit/523131f))

## 0.14.0

### Minor Changes

- rename `Deployments_Table` from `Repo_Table` ([70d4b0d](https://github.com/ryanatkn/fuz_gitops/commit/70d4b0d))

## 0.13.3

### Patch Changes

- make Deployments_Tree full the available width ([19809e1](https://github.com/ryanatkn/fuz_gitops/commit/19809e1))

## 0.13.2

### Patch Changes

- fix local package ([fb802a2](https://github.com/ryanatkn/fuz_gitops/commit/fb802a2))

## 0.13.1

### Patch Changes

- fix deployments.json type ([3bb681a](https://github.com/ryanatkn/fuz_gitops/commit/3bb681a))

## 0.13.0

### Minor Changes

- upgrade gro with src_json ([#13](https://github.com/ryanatkn/fuz_gitops/pull/13))

## 0.12.0

### Minor Changes

- upgrade deps ([b25acb6](https://github.com/ryanatkn/fuz_gitops/commit/b25acb6))

## 0.11.0

### Minor Changes

- rename `Modules_Detail` slot `"nav"` from `"menu"` ([#11](https://github.com/ryanatkn/fuz_gitops/pull/11))

### Patch Changes

- add `Deployments_Tree` ([#11](https://github.com/ryanatkn/fuz_gitops/pull/11))
- add breadcrumb to `Modules_Detail` ([6088428](https://github.com/ryanatkn/fuz_gitops/commit/6088428))

## 0.10.9

### Patch Changes

- fix whitespace ([7de4255](https://github.com/ryanatkn/fuz_gitops/commit/7de4255))

## 0.10.8

### Patch Changes

- add `gitops.task.ts` ([1e2dc8f](https://github.com/ryanatkn/fuz_gitops/commit/1e2dc8f))
- use `if-modified-since` and `last-modified` headers ([68e4f47](https://github.com/ryanatkn/fuz_gitops/commit/68e4f47))

## 0.10.7

### Patch Changes

- improve `Pull_Requests_Detail` ([9887469](https://github.com/ryanatkn/fuz_gitops/commit/9887469))

## 0.10.6

### Patch Changes

- add `Pull_Requests_Detail` ([#10](https://github.com/ryanatkn/fuz_gitops/pull/10))

## 0.10.5

### Patch Changes

- fix `Modules_Detail` layout ([c6d69c3](https://github.com/ryanatkn/fuz_gitops/commit/c6d69c3))

## 0.10.4

### Patch Changes

- improve `Modules_Detail` ([4e379a1](https://github.com/ryanatkn/fuz_gitops/commit/4e379a1))

## 0.10.3

### Patch Changes

- fix a link ([00b94f0](https://github.com/ryanatkn/fuz_gitops/commit/00b94f0))

## 0.10.2

### Patch Changes

- show only published deployments ([e61c437](https://github.com/ryanatkn/fuz_gitops/commit/e61c437))

## 0.10.1

### Patch Changes

- rearrange repo table columns ([6041e50](https://github.com/ryanatkn/fuz_gitops/commit/6041e50))

## 0.10.0

### Minor Changes

- upgrade deps ([b6b7f7b](https://github.com/ryanatkn/fuz_gitops/commit/b6b7f7b))

## 0.9.0

### Minor Changes

- upgrade deps ([#9](https://github.com/ryanatkn/fuz_gitops/pull/9))

## 0.8.2

### Patch Changes

- publish sample data ([#8](https://github.com/ryanatkn/fuz_gitops/pull/8))
- add `Modules_Detail.svelte` and `Modules_Nav.svelte` ([#8](https://github.com/ryanatkn/fuz_gitops/pull/8))

## 0.8.1

### Patch Changes

- add `package.ts` ([7e888d3](https://github.com/ryanatkn/fuz_gitops/commit/7e888d3))

## 0.8.0

### Minor Changes

- upgrade deps ([2c0164c](https://github.com/ryanatkn/fuz_gitops/commit/2c0164c))

## 0.7.1

### Patch Changes

- log package cache status ([fe97baf](https://github.com/ryanatkn/fuz_gitops/commit/fe97baf))

## 0.7.0

### Minor Changes

- add cache for `gro gitops` ([#7](https://github.com/ryanatkn/fuz_gitops/pull/7))
- snake_case everywhere ([#7](https://github.com/ryanatkn/fuz_gitops/pull/7))

## 0.6.2

### Patch Changes

- add favicon to `Deployments_Table` ([9c0e326](https://github.com/ryanatkn/fuz_gitops/commit/9c0e326))

## 0.6.1

### Patch Changes

- make `Github_Pull_Request` `body` nullable ([77f0ad6](https://github.com/ryanatkn/fuz_gitops/commit/77f0ad6))

## 0.6.0

### Minor Changes

- extract `$lib/github.ts` ([#6](https://github.com/ryanatkn/fuz_gitops/pull/6))
- add `Github_Pull_Request` schema and parse fetch response ([#6](https://github.com/ryanatkn/fuz_gitops/pull/6))

## 0.5.2

### Patch Changes

- fix package fetching error handling ([b7cb0df](https://github.com/ryanatkn/fuz_gitops/commit/b7cb0df))

## 0.5.1

### Patch Changes

- add peer dep for @octokit/request ([8dbc32a](https://github.com/ryanatkn/fuz_gitops/commit/8dbc32a))

## 0.5.0

### Minor Changes

- support `pull_requests` for public repos ([#5](https://github.com/ryanatkn/fuz_gitops/pull/5))

## 0.4.0

### Minor Changes

- parse `Gitops_Config` ([1ed8dc4](https://github.com/ryanatkn/fuz_gitops/commit/1ed8dc4))

### Patch Changes

- strict config ([1ed8dc4](https://github.com/ryanatkn/fuz_gitops/commit/1ed8dc4))

## 0.3.0

### Minor Changes

- rename `Gitops_Config` `deployments` from `repos` ([0e16e6f](https://github.com/ryanatkn/fuz_gitops/commit/0e16e6f))

## 0.2.1

### Patch Changes

- fix generated type file path ([49f61b1](https://github.com/ryanatkn/fuz_gitops/commit/49f61b1))

## 0.2.0

### Minor Changes

- update exports ([fb9de5d](https://github.com/ryanatkn/fuz_gitops/commit/fb9de5d))

## 0.1.1

### Patch Changes

- upgrade gro to fix default svelte exports ([33f0f77](https://github.com/ryanatkn/fuz_gitops/commit/33f0f77))

## 0.1.0

### Minor Changes

- init ([408f471](https://github.com/ryanatkn/fuz_gitops/commit/408f471))
