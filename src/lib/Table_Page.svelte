<script lang="ts">
	import Page_Footer from '$lib/Page_Footer.svelte';
	import Page_Header from '$lib/Page_Header.svelte';
	import Deployments_Table from '$lib/Deployments_Table.svelte';
	import type {Fetched_Deployment} from '$lib/fetch_deployments.js';

	export let deployment: Fetched_Deployment;
	export let deployments: Fetched_Deployment[];
</script>

<svelte:head>
	<title>table {deployment.package_json.icon} {deployment.package_json.name}</title>
</svelte:head>

<main class="box">
	<section>
		<Page_Header pkg={deployment} />
	</section>
	<section>
		<div class="panel p_md">
			<Deployments_Table {deployments} />
		</div>
	</section>
	<section class="box mb_xl7">
		<Page_Footer />
	</section>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin: 0 auto;
	}
	section {
		margin-bottom: var(--space_xl4);
	}
	section:first-child {
		margin-top: var(--space_xl4);
	}
</style>
