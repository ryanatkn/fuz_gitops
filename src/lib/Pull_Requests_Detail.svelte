<script lang="ts">
	import {base} from '$app/paths';

	import {to_pull_requests, type Filter_Pull_Request} from '$lib/github_helpers.js';
	import type {Repo} from '$lib/repo.js';

	interface Props {
		repos: Repo[];
		filter_pull_request?: Filter_Pull_Request | undefined;
	}

	const {repos, filter_pull_request}: Props = $props();

	const pull_requests = $derived(to_pull_requests(repos, filter_pull_request));
</script>

<div class="width_md">
	<section class="panel p_sm">
		<table>
			<thead><tr><th>repo</th><th>number</th><th>title</th></tr></thead>
			<tbody>
				{#each pull_requests as pull_request}
					<tr>
						<td
							><a href="{base}/tree/{pull_request.repo.repo_name}"
								>{pull_request.repo
									.repo_name}{#if pull_request.repo.package_json.glyph}{' '}{pull_request.repo
										.package_json.glyph}{/if}</a
							></td
						>
						<td
							><a
								href="{pull_request.repo.repo_url}/pull/{pull_request.pull_request.number}"
								title={pull_request.pull_request.title}>#{pull_request.pull_request.number}</a
							></td
						>
						<td><div>{pull_request.pull_request.title}</div></td>
					</tr>
				{/each}
			</tbody>
		</table>
	</section>
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
