<script lang="ts">
	import {format_host} from '@fuz.dev/fuz_library/package_meta.js';
	import {page} from '$app/stores';
	import {base} from '$app/paths';
	import {ensure_end} from '@ryanatkn/belt/string.js';

	import type {Deployment} from '$lib/fetch_deployments.js';
	import {to_pull_url} from '$lib/github_helpers.js';

	export let deployments: Deployment[];
	export let deps = ['@fuz.dev/fuz', '@fuz.dev/fuz_library', '@grogarden/gro']; // TODO add felt

	// TODO fade out the `version` column if all deps are upgraded to the latest

	// TODO gray out the latest of each version for deps, but only if the max is knowable via a local dep, don't assume for externals

	// TODO hacky, handle regular deps too
	const lookup_dep_version = (deployment: Deployment, dep: string): string | null => {
		if (!deployment.package_json) return null;
		for (const key in deployment.package_json.dependencies) {
			if (key === dep) {
				return deployment.package_json.dependencies[key];
			}
		}
		for (const key in deployment.package_json.devDependencies) {
			if (key === dep) {
				return deployment.package_json.devDependencies[key];
			}
		}
		return null;
	};

	$: latest_version_by_dep = new Map<string, string | null>(
		deps.map((dep) => {
			const deployment = deployments.find((deployment) => deployment.package_json?.name === dep);
			if (!deployment?.package_json) return [dep, null];
			return [dep, deployment.package_json.version];
		}),
	);

	const format_version = (version: string | null): string =>
		version === null ? '' : version.replace(/^(\^|>=)\s*/u, '');

	const lookup_pull_requests = (deployments: Deployment[] | null, deployment: Deployment) => {
		const found = deployments?.find((p) => p.url === deployment.url);
		if (!found?.package_json) return null;
		const {pull_requests} = found;
		return pull_requests;
	};
</script>

<table>
	<thead>
		<th>detail</th>
		<th>homepage</th>
		<th>repo</th>
		<th>npm</th>
		<th>version</th>
		{#each deps as dep (dep)}
			<th>{dep}</th>
		{/each}
		<th>pull requests</th>
	</thead>
	{#each deployments as deployment}
		{@const package_json = deployment.package_json}
		{@const homepage_url = package_json ? deployment.homepage_url : null}
		<tr>
			<td>
				<div class="row">
					{#if package_json}
						<a href="{base}/tree/{deployment.repo_name}">{deployment.package_json.icon || '🌳'}</a>
					{/if}
				</div>
			</td>
			<td>
				<div class="row">
					{#if homepage_url}
						<a class:selected={homepage_url === $page.url.href} href={homepage_url} class="row">
							<img
								src="{ensure_end(homepage_url, '/')}favicon.png"
								alt="favicon to homepage at {homepage_url}"
								style:width="16px"
								style:height="16px"
								style:margin-right="var(--spacing_xs)"
							/>
							{format_host(homepage_url)}
						</a>
					{/if}
				</div>
			</td>
			<td>
				<div class="row">
					{#if package_json}
						<a href={deployment.repo_url}>{deployment.repo_name}</a>
						{@const check_runs = deployment.check_runs}
						{@const check_runs_completed = check_runs?.status === 'completed'}
						{@const check_runs_success = check_runs?.conclusion === 'success'}
						{#if check_runs && (!check_runs_completed || !check_runs_success)}
							<a
								href="{deployment.repo_url}/commits/main"
								title={!check_runs_completed
									? `status: ${check_runs.status}`
									: `CI failed: ${check_runs.conclusion}`}
								>{#if !check_runs_completed}🟡{:else}⚠️{/if}</a
							>
						{/if}
					{:else}
						<a href={deployment.url}>{format_host(deployment.url)}</a>
					{/if}
				</div>
			</td>
			<td>
				{#if package_json && deployment.npm_url}
					<div class="row">
						<a href={deployment.npm_url}><code>{deployment.name}</code></a>
					</div>
				{/if}
			</td>
			<td>
				{#if package_json && package_json.version !== '0.0.1'}
					<a href={deployment.changelog_url}>{format_version(package_json.version)}</a>
				{/if}
			</td>
			{#each deps as dep (dep)}
				{@const dep_version = lookup_dep_version(deployment, dep)}
				{@const formatted_dep_version = format_version(dep_version)}
				{@const dep_latest_version = latest_version_by_dep.get(dep)}
				<td>
					<div class:latest={!!dep_latest_version && formatted_dep_version === dep_latest_version}>
						{formatted_dep_version}
					</div>
				</td>
			{/each}
			<td>
				{#if package_json && deployment.repo_url}
					{@const pull_requests = lookup_pull_requests(deployments, deployment)}
					<!-- TODO show something like `and N more` with a link to a dialog list -->
					<div class="row">
						{#if pull_requests}
							{#each pull_requests as pull (pull)}
								<a href={to_pull_url(deployment.repo_url, pull)} class="chip" title={pull.title}
									>#{pull.number}</a
								>
							{/each}
						{/if}
					</div>
				{/if}
			</td>
		</tr>
	{/each}
</table>

<style>
	/* TODO add basic table styles upstream and delete this */
	th {
		text-align: left;
	}
	th,
	td {
		padding: 0 var(--spacing_xs);
	}
	tr:hover {
		background-color: var(--bg_5);
	}
	.latest {
		/* TODO even lighter, add `--text_4` to Fuz probably, or change the scaling of `--text_2` and `--text_3` */
		color: var(--text_3);
		/* TODO this is too subtle as `--faded_1`, change in Fuz to either lighter or `--faded_2` */
		/* opacity: var(--disabled_opacity); */
		opacity: var(--faded_2);
	}
</style>
