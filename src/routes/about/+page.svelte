<script lang="ts">
	import Package_Detail from '@ryanatkn/fuz/Package_Detail.svelte';

	import {get_deployments} from '$lib/deployments.js';
	import Page_Footer from '$lib/Page_Footer.svelte';
	import Page_Header from '$lib/Page_Header.svelte';

	const {deployment} = get_deployments();
</script>

<svelte:head>
	<title>about {deployment.package_json.glyph} {deployment.package_json.name}</title>
</svelte:head>

<main class="width_md">
	<div class="p_lg">
		<Page_Header pkg={deployment}></Page_Header>
	</div>
	<section class="box w_100 mb_lg">
		<div class="panel p_md width_md">
			<Package_Detail pkg={deployment} />
		</div>
	</section>
	<Page_Footer />
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin: 0 auto;
	}
</style>
