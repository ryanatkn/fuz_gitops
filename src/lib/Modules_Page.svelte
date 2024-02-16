<script lang="ts">
	import Breadcrumb from '@ryanatkn/fuz/Breadcrumb.svelte';

	import Page_Header from '$lib/Page_Header.svelte';
	import Page_Footer from '$lib/Page_Footer.svelte';
	import Modules_Detail from '$lib/Modules_Detail.svelte';
	import type {Fetched_Deployment} from '$lib/fetch_deployments.js';

	export let deployment: Fetched_Deployment;
	export let deployments: Fetched_Deployment[];
</script>

<svelte:head>
	<title>modules {deployment.package_json.icon} {deployment.package_json.name}</title>
</svelte:head>

<main class="box width_full">
	<section>
		<Page_Header pkg={deployment} />
	</section>
	<section>
		<Modules_Detail {deployments}>
			<div slot="nav" class="row">
				<Breadcrumb>{deployment.package_json.icon}</Breadcrumb>
			</div>
		</Modules_Detail>
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
</style>
