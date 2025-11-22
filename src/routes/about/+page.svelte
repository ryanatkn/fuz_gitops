<script lang="ts">
	import Package_Detail from '@ryanatkn/fuz/Package_Detail.svelte';
	import Ecosystem_Links_Panel from '@ryanatkn/fuz/Ecosystem_Links_Panel.svelte';

	import {repos_context} from '$lib/repo.js';
	import Page_Footer from '$lib/Page_Footer.svelte';
	import Page_Header from '$lib/Page_Header.svelte';

	const {repo} = repos_context.get();
</script>

<svelte:head>
	<title>about {repo.pkg.package_json.glyph} {repo.pkg.package_json.name}</title>
</svelte:head>

<main class="width_upto_md">
	<div class="p_lg">
		<Page_Header pkg={repo.pkg}></Page_Header>
	</div>
	<Ecosystem_Links_Panel />
	<section class="box width_100 mb_lg">
		<div class="panel p_md width_upto_md">
			<Package_Detail pkg={repo.pkg} />
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
