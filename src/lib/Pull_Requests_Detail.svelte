<script lang="ts">
	import {base} from '$app/paths';
	import {format_url} from '@ryanatkn/belt/url.js';

	import {to_pull_requests, type Filter_Pull_Request} from '$lib/github_helpers.js';
	import type {Fetched_Deployment, Unfetched_Deployment} from '$lib/fetch_deployments.js';

	interface Props {
		deployments: Fetched_Deployment[];
		unfetched_deployments: Unfetched_Deployment[];
		filter_pull_request?: Filter_Pull_Request | undefined;
	}

	const {deployments, unfetched_deployments, filter_pull_request}: Props = $props();

	const pull_requests = $derived(to_pull_requests(deployments, filter_pull_request));
</script>

<div class="width_md">
	<section class="panel p_sm">
		<table>
			<thead><tr><th>repo</th><th>number</th><th>title</th></tr></thead>
			<tbody>
				{#each pull_requests as pull_request}
					<tr>
						<td
							><a href="{base}/tree/{pull_request.deployment.repo_name}"
								>{pull_request.deployment
									.repo_name}{#if pull_request.deployment.package_json.glyph}{' '}{pull_request
										.deployment.package_json.glyph}{/if}</a
							></td
						>
						<td
							><a
								href="{pull_request.deployment.repo_url}/pull/{pull_request.pull_request.number}"
								title={pull_request.pull_request.title}>#{pull_request.pull_request.number}</a
							></td
						>
						<td><div>{pull_request.pull_request.title}</div></td>
					</tr>
				{/each}
			</tbody>
		</table>
	</section>
	{#if unfetched_deployments.length}
		<section class="panel p_sm">
			<p>⚠️ Some deployments could not be fetched:</p>
			<ul class="unstyled">
				{#each unfetched_deployments as { url }}
					<li><a href={url}>{format_url(url)}</a></li>
				{/each}
			</ul>
		</section>
	{/if}
</div>

<style>
	th,
	td {
		padding: 0 var(--space_md);
	}
	section {
		margin-bottom: var(--space_xl5);
	}
</style>
