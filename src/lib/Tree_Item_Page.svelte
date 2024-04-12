<script lang="ts">
	import Alert from '@ryanatkn/fuz/Alert.svelte';
	import Breadcrumb from '@ryanatkn/fuz/Breadcrumb.svelte';

	import Page_Footer from '$lib/Page_Footer.svelte';
	import Page_Header from '$lib/Page_Header.svelte';
	import Deployments_Tree from '$lib/Deployments_Tree.svelte';
	import type {Fetched_Deployment} from '$lib/fetch_deployments.js';

	interface Props {
		deployment: Fetched_Deployment;
		deployments: Fetched_Deployment[];
		slug: string;
	}

	const {deployment, deployments, slug}: Props = $props();

	// TODO ideally there would be one `Deployments_Tree` mounted by the layout with transitions

	const route_deployment = $derived(deployments.find((p) => p.repo_name === slug));
</script>

<svelte:head>
	<title>{slug} - tree {deployment.package_json.icon} {deployment.package_json.name}</title>
</svelte:head>

<main class="box w_100">
	<div class="p_lg">
		<Page_Header pkg={deployment} />
	</div>
	<section class="tree">
		{#if !route_deployment}
			<div class="mb_lg">
				<Alert status="error"><p>cannot find <code>{slug}</code></p></Alert>
			</div>
		{/if}
		<Deployments_Tree {deployments} selected_deployment={route_deployment}>
			{#snippet nav()}
				<div class="deployments_tree_nav">
					<Breadcrumb>{deployment.package_json.icon}</Breadcrumb>
				</div>
			{/snippet}
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
		flex-wrap: wrap;
		justify-content: center;
	}
	section:first-child {
		margin-top: var(--space_xl4);
	}
	.tree {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 100%;
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
