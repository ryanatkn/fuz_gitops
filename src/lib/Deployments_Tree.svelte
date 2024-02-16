<script lang="ts">
	import Package_Summary from '@ryanatkn/fuz/Package_Summary.svelte';
	import Package_Detail from '@ryanatkn/fuz/Package_Detail.svelte';
	import {strip_end, strip_start} from '@ryanatkn/belt/string.js';
	import {base} from '$app/paths';

	import type {Fetched_Deployment} from '$lib/fetch_deployments.js';
	import Deployments_Tree_Nav from '$lib/Deployments_Tree_Nav.svelte';

	export let deployments: Fetched_Deployment[];

	/**
	 * The selected package, if any.
	 */
	export let selected_deployment: Fetched_Deployment | undefined = undefined;
</script>

<div class="deployments_tree">
	<Deployments_Tree_Nav {deployments} {selected_deployment}>
		<slot name="nav" />
	</Deployments_Tree_Nav>
	{#if selected_deployment}
		<section class="detail_wrapper">
			<div class="panel detail">
				<Package_Detail pkg={selected_deployment} />
			</div>
		</section>
	{:else}
		<menu class="summaries">
			{#each deployments as deployment}
				<li class="panel padded_md box">
					{#if deployment.package_json}
						<Package_Summary pkg={deployment}>
							<svelte:fragment slot="repo_name" let:repo_name>
								<a href="{base}/tree/{repo_name}" class="repo_name">{repo_name}</a>
							</svelte:fragment>
						</Package_Summary>
					{:else}
						<div class="prose width_sm">
							<p>
								failed to fetch <code>.well-known/package.json</code> from
								<a href={deployment.url}
									>{strip_end(strip_start(deployment.url, 'https://'), '/')}</a
								>
							</p>
						</div>
					{/if}
				</li>
			{/each}
		</menu>
	{/if}
</div>

<style>
	.deployments_tree {
		width: 100%;
		display: flex;
		flex-direction: row;
		align-items: flex-start;
	}
	.summaries {
		padding: var(--spacing_lg);
		gap: var(--spacing_lg);
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		justify-content: flex-start;
		align-items: flex-start;
	}
	.summaries li {
		margin-bottom: var(--spacing_1);
	}
	.repo_name {
		font-size: var(--size_2);
		font-weight: 500;
		text-align: center;
	}
	.detail_wrapper {
		padding: var(--spacing_lg);
		width: 100%;
	}
	.detail {
		display: flex;
	}
</style>
