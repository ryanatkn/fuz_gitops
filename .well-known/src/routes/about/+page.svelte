<script lang="ts">
	import Package_Detail from '@ryanatkn/fuz/Package_Detail.svelte';
	import Page_Footer from '@ryanatkn/fuz/Page_Footer.svelte';

	import {get_deployments} from '$lib/deployments.js';

	const {deployment} = get_deployments();
</script>

<svelte:head>
	<title>about {deployment.package_json.icon} {deployment.package_json.name}</title>
</svelte:head>

<main class="width_md">
	<div class="prose">
		<section>
			<header>
				<h1>{deployment.repo_name}</h1>
			</header>
		</section>
	</div>
	<section class="box width_full spaced">
		<div class="panel padded_md width_md">
			<Package_Detail pkg={deployment} />
		</div>
	</section>
	<div class="box">
		<Page_Footer pkg={deployment} />
	</div>
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
