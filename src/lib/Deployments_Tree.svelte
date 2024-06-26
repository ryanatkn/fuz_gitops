<script lang="ts">
	import Package_Summary from '@ryanatkn/fuz/Package_Summary.svelte';
	import Package_Detail from '@ryanatkn/fuz/Package_Detail.svelte';
	import {base} from '$app/paths';
	import {format_url} from '@ryanatkn/belt/url.js';
	import type {Snippet} from 'svelte';

	import type {Fetched_Deployment} from '$lib/fetch_deployments.js';
	import Deployments_Tree_Nav from '$lib/Deployments_Tree_Nav.svelte';

	interface Props {
		deployments: Fetched_Deployment[];
		/**
		 * The selected package, if any.
		 */
		selected_deployment?: Fetched_Deployment | undefined;
		nav: Snippet;
	}

	const {deployments, selected_deployment, nav}: Props = $props();
</script>

<div class="deployments_tree">
	<Deployments_Tree_Nav {deployments} {selected_deployment}>
		{@render nav()}
	</Deployments_Tree_Nav>
	{#if selected_deployment}
		<section class="detail_wrapper">
			<div class="panel detail p_md">
				<Package_Detail pkg={selected_deployment} />
			</div>
		</section>
	{:else}
		<menu class="summaries">
			{#each deployments as deployment}
				<li class="panel p_md box">
					{#if deployment.package_json}
						<Package_Summary pkg={deployment}>
							{#snippet repo_name(repo_name)}
								<a href="{base}/tree/{repo_name}" class="repo_name">{repo_name}</a>
							{/snippet}
						</Package_Summary>
					{:else}
						<div class="width_sm">
							<p>
								failed to fetch <code>.well-known/package.json</code> from
								<a href={deployment.url}>{format_url(deployment.url)}</a>
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
		padding: var(--space_lg);
		gap: var(--space_lg);
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		justify-content: flex-start;
		align-items: flex-start;
	}
	.summaries li {
		margin-bottom: var(--space_xl);
	}
	.repo_name {
		font-size: var(--size_xl2);
		font-weight: 500;
		text-align: center;
		margin-bottom: var(--space_xl);
	}
	.detail_wrapper {
		padding: var(--space_lg);
		width: 100%;
	}
	.detail {
		display: flex;
	}
</style>
