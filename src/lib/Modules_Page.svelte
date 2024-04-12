<script lang="ts">
	import Breadcrumb from '@ryanatkn/fuz/Breadcrumb.svelte';
	import Library_Footer from '@ryanatkn/fuz/Library_Footer.svelte';

	import Page_Header from '$lib/Page_Header.svelte';
	import Modules_Detail from '$lib/Modules_Detail.svelte';
	import type {Fetched_Deployment} from '$lib/fetch_deployments.js';

	export let deployment: Fetched_Deployment;
	export let deployments: Fetched_Deployment[];
</script>

<svelte:head>
	<title>modules {deployment.package_json.icon} {deployment.package_json.name}</title>
</svelte:head>

<main class="box w_100">
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
	<section class="box mb_xl7">
		<Library_Footer pkg={deployment} />
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
</style>
