<script lang="ts">
	import {base} from '$app/paths';
	import type {Snippet} from 'svelte';

	import type {Fetched_Deployment} from '$lib/fetch_deployments.js';

	interface Props {
		deployments: Fetched_Deployment[];
		/**
		 * The selected package, if any.
		 */
		selected_deployment?: Fetched_Deployment;
		children: Snippet;
	}

	const {deployments, selected_deployment, children}: Props = $props();
</script>

<nav>
	<menu class="names panel p_md">
		{#each deployments as deployment}
			{@const selected = deployment === selected_deployment}
			<li style:display="contents">
				{#if deployment.package_json}<a
						class="menu_item"
						class:selected
						href="{base}/tree/{deployment.repo_name}"
						><div class="ellipsis">
							{deployment.repo_name}{#if deployment.package_json.icon}{' '}{deployment.package_json
									.icon}{/if}
						</div></a
					>{/if}
			</li>
		{/each}
	</menu>
	{@render children()}
</nav>

<style>
	nav {
		display: flex;
		flex-direction: column;
		position: sticky;
		top: var(--space_md);
		width: var(--nav_width, 240px);
		padding: var(--space_lg);
		padding-right: 0;
	}
	.names {
		padding: var(--space_md);
	}
	/* TODO should be a CSS class or variable, probably add :focus behavior */
	.names a:hover {
		background-color: var(--bg_5);
	}
	.names a:is(:active, .selected) {
		background-color: var(--bg_7);
	}
</style>
