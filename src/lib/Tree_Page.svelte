<script lang="ts">
	import Breadcrumb from '@ryanatkn/fuz/Breadcrumb.svelte';

	import Page_Footer from '$lib/Page_Footer.svelte';
	import Page_Header from '$lib/Page_Header.svelte';
	import Deployments_Tree from '$lib/Deployments_Tree.svelte';
	import type {Fetched_Deployment} from '$lib/fetch_deployments.js';

	export let deployment: Fetched_Deployment;
	export let deployments: Fetched_Deployment[];

	// TODO ideally there would be one `Deployments_Tree` mounted by the layout with transitions
</script>

<svelte:head>
	<title>tree {deployment.package_json.icon} {deployment.name}</title>
</svelte:head>

<main class="box w_100">
	<div class="p_lg">
		<Page_Header pkg={deployment} />
	</div>
	<section class="tree">
		<Deployments_Tree {deployments}>
			<div slot="nav" class="deployments_tree_nav">
				<Breadcrumb>{deployment.package_json.icon}</Breadcrumb>
			</div>
		</Deployments_Tree>
	</section>
	<section class="box mb_xl7">
		<Page_Footer />
	</section>
</main>

<style>
	section {
		width: 100%;
		margin-bottom: var(--space_xl4);
		display: flex;
		justify-content: center;
	}
	section:first-child {
		margin-top: var(--space_xl4);
	}
	.tree {
		display: flex;
		flex-direction: row;
		align-items: flex-start;
	}
	.deployments_tree_nav {
		display: flex;
		margin-top: var(--space_xl);
	}
	/* TODO hacky */
	.deployments_tree_nav :global(.breadcrumb) {
		justify-content: flex-start;
	}
</style>
