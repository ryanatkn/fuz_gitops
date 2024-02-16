<script lang="ts">
	import Alert from '@ryanatkn/fuz/Alert.svelte';
	import Breadcrumb from '@ryanatkn/fuz/Breadcrumb.svelte';

	import Page_Header from '$lib/Page_Header.svelte';
	import Page_Footer from '$lib/Page_Footer.svelte';
	import Deployments_Tree from '$lib/Deployments_Tree.svelte';
	import type {Fetched_Deployment} from '$lib/fetch_deployments.js';

	export let deployment: Fetched_Deployment;
	export let deployments: Fetched_Deployment[];

	export let slug: string;

	// TODO ideally there would be one `Deployments_Tree` mounted by the layout with transitions

	$: route_deployment = deployments.find((p) => p.repo_name === slug);
</script>

<svelte:head>
	<title>{slug} - tree {deployment.package_json.icon} {deployment.package_json.name}</title>
</svelte:head>

<main class="box width_full">
	<section>
		<Page_Header pkg={deployment} />
	</section>
	<section class="tree">
		{#if !route_deployment}
			<div class="spaced">
				<Alert status="error"><p>cannot find <code>{slug}</code></p></Alert>
			</div>
		{/if}
		<Deployments_Tree {deployments} selected_deployment={route_deployment}>
			<div slot="nav" class="deployments_tree_nav">
				<Breadcrumb>{deployment.package_json.icon}</Breadcrumb>
			</div>
		</Deployments_Tree>
	</section>
	<section class="box">
		<Page_Footer pkg={deployment} />
	</section>
</main>

<style>
	section {
		width: 100%;
		margin-bottom: var(--spacing_4);
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
	}
	section:first-child {
		margin-top: var(--spacing_4);
	}
	.tree {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 100%;
	}
	.deployments_tree_nav {
		display: flex;
		margin-top: var(--spacing_1);
	}
	/* TODO hacky */
	.deployments_tree_nav :global(.breadcrumb) {
		justify-content: flex-start;
	}
</style>
