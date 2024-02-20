<script lang="ts">
	import {base} from '$app/paths';

	import type {Fetched_Deployment} from '$lib/fetch_deployments.js';

	export let deployments: Fetched_Deployment[];

	/**
	 * The selected package, if any.
	 */
	export let selected_deployment: Fetched_Deployment | undefined = undefined;
</script>

<nav>
	<menu class="names panel padded_md">
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
	<slot />
</nav>

<style>
	nav {
		display: flex;
		flex-direction: column;
		position: sticky;
		top: var(--spacing_md);
		width: var(--nav_width, 240px);
		padding: var(--spacing_lg);
		padding-right: 0;
	}
	.names {
		padding: var(--spacing_md);
	}
	/* TODO should be a CSS class or variable, probably add :focus behavior */
	.names a:hover {
		background-color: var(--bg_5);
	}
	.names a:is(:active, .selected) {
		background-color: var(--bg_7);
	}
</style>
