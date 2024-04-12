<script lang="ts">
	import Package_Detail from '@ryanatkn/fuz/Package_Detail.svelte';
	import Library_Footer from '@ryanatkn/fuz/Library_Footer.svelte';

	import {get_deployments} from '$lib/deployments.js';

	const {deployment} = get_deployments();
</script>

<svelte:head>
	<title>about {deployment.package_json.icon} {deployment.package_json.name}</title>
</svelte:head>

<main class="width_md">
	<header>
		<h1 class="mt_xl4">About</h1>
	</header>
	<section class="box w_100 mb_lg">
		<div class="panel p_md width_md">
			<Package_Detail pkg={deployment} />
		</div>
	</section>
	<section class="box mb_xl7">
		<Library_Footer pkg={deployment} />
	</section>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin: 0 auto;
	}
	h1 {
		display: flex;
		align-items: baseline;
		text-align: center;
	}
</style>
