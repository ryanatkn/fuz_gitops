<script lang="ts">
	import PackageDetail from '@ryanatkn/fuz/PackageDetail.svelte';
	import EcosystemLinksPanel from '@ryanatkn/fuz/EcosystemLinksPanel.svelte';
	import {pkg_context} from '@ryanatkn/fuz/pkg.svelte.js';

	import PageFooter from '$lib/PageFooter.svelte';
	import PageHeader from '$lib/PageHeader.svelte';

	const pkg = pkg_context.get();
</script>

<svelte:head>
	<title>about {pkg.package_json.glyph} {pkg.package_json.name}</title>
</svelte:head>

<main class="width_upto_md">
	<div class="p_lg">
		<PageHeader repo={pkg}></PageHeader>
	</div>
	<EcosystemLinksPanel />
	<section class="box width_100 mb_lg">
		<div class="panel p_md width_upto_md">
			<PackageDetail {pkg} />
		</div>
	</section>
	<PageFooter />
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin: 0 auto;
	}
</style>
