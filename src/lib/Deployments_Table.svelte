<script lang="ts">
	import {page} from '$app/stores';
	import {base} from '$app/paths';
	import {format_url} from '@ryanatkn/belt/url.js';

	import type {Fetched_Deployment} from '$lib/fetch_deployments.js';
	import {to_pull_url} from '$lib/github_helpers.js';

	interface Props {
		deployments: Fetched_Deployment[];
		deps?: string[];
	}

	const {deployments, deps = ['@ryanatkn/fuz', '@ryanatkn/gro']}: Props = $props();

	// TODO fade out the `version` column if all deps are upgraded to the latest

	// TODO gray out the latest of each version for deps, but only if the max is knowable via a local dep, don't assume for externals

	// TODO hacky, handle regular deps too
	const lookup_dep_version = (deployment: Fetched_Deployment, dep: string): string | null => {
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

	const latest_version_by_dep = $derived(
		new Map<string, string | null>(
			deps.map((dep) => {
				const deployment = deployments.find((deployment) => deployment.package_json.name === dep);
				if (!deployment?.package_json) return [dep, null];
				return [dep, deployment.package_json.version];
			}),
		),
	);

	const format_version = (version: string | null): string =>
		version === null ? '' : version.replace(/^(\^|>=)\s*/, '');

	const lookup_pull_requests = (
		deployments: Fetched_Deployment[] | null,
		deployment: Fetched_Deployment,
	) => {
		const found = deployments?.find((p) => p.url === deployment.url);
		if (!found?.package_json) return null;
		const {pull_requests} = found;
		return pull_requests;
	};
</script>

<table>
	<thead>
		<tr>
			<th>tree</th>
			<th>homepage</th>
			<th>repo</th>
			<th>npm</th>
			<th>version</th>
			{#each deps as dep (dep)}
				<th>{dep}</th>
			{/each}
			<th>pull requests</th>
		</tr>
	</thead>
	<tbody>
		{#each deployments as deployment}
			{@const {package_json, homepage_url} = deployment}
			<tr>
				<td>
					<div class="row">
						{#if package_json}
							<a href="{base}/tree/{deployment.repo_name}">{package_json.glyph ?? '🌳'}</a>
						{/if}
					</div>
				</td>
				<td>
					<div class="row">
						{#if homepage_url}
							<a class:selected={homepage_url === $page.url.href} href={homepage_url} class="row">
								<img
									src={deployment.logo_url}
									alt={deployment.logo_alt}
									style:width="16px"
									style:height="16px"
									style:margin-right="var(--space_xs)"
								/>
								{format_url(homepage_url)}
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
							<a href={deployment.url}>{format_url(deployment.url)}</a>
						{/if}
					</div>
				</td>
				<td>
					{#if deployment.npm_url}
						<div class="row">
							<a href={deployment.npm_url}><code>{deployment.name}</code></a>
						</div>
					{/if}
				</td>
				<td>
					{#if package_json.version !== '0.0.1'}
						<a href={deployment.changelog_url}>{format_version(package_json.version)}</a>
					{/if}
				</td>
				{#each deps as dep (dep)}
					{@const dep_version = lookup_dep_version(deployment, dep)}
					{@const formatted_dep_version = format_version(dep_version)}
					{@const dep_latest_version = latest_version_by_dep.get(dep)}
					<td>
						<div
							class:latest={!!dep_latest_version && formatted_dep_version === dep_latest_version}
						>
							{formatted_dep_version}
						</div>
					</td>
				{/each}
				<td>
					{#if deployment.repo_url}
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
	</tbody>
</table>

<style>
	/* TODO add basic table styles upstream and delete this */
	th {
		text-align: left;
	}
	th,
	td {
		padding: 0 var(--space_xs);
	}
	tr:hover {
		background-color: var(--bg_5);
	}
	.latest {
		/* TODO even lighter, add `--text_4` to Fuz probably, or change the scaling of `--text_2` and `--text_3` */
		color: var(--text_3);
		/* TODO this is too subtle as `--fade_1`, change in Fuz to either lighter or `--fade_2` */
		/* opacity: var(--disabled_opacity); */
		opacity: var(--fade_2);
	}
</style>
