<script lang="ts">
	import Breadcrumb from '@ryanatkn/fuz/Breadcrumb.svelte';

	import Page_Footer from '$lib/Page_Footer.svelte';
	import Page_Header from '$lib/Page_Header.svelte';
	import Modules_Detail from '$lib/Modules_Detail.svelte';
	import type {Fetched_Repo} from '$lib/repo.js';

	interface Props {
		repo: Fetched_Repo;
		repos: Fetched_Repo[];
	}

	const {repo, repos}: Props = $props();
</script>

<svelte:head>
	<title>modules {repo.package_json.glyph} {repo.package_json.name}</title>
</svelte:head>

<main class="box w_100">
	<div class="p_lg">
		<Page_Header pkg={repo} />
	</div>
	<section>
		<Modules_Detail {repos}>
			{#snippet nav_footer()}
				<nav class="row">
					<Breadcrumb>{repo.package_json.glyph}</Breadcrumb>
				</nav>
			{/snippet}
		</Modules_Detail>
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
</style>
