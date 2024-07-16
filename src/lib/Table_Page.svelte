<script lang="ts">
	import Page_Footer from '$lib/Page_Footer.svelte';
	import Page_Header from '$lib/Page_Header.svelte';
	import Repos_Table from '$lib/Repos_Table.svelte';
	import type {Fetched_Repo} from '$lib/repo.js';

	interface Props {
		repo: Fetched_Repo;
		repos: Fetched_Repo[];
	}

	const {repo, repos}: Props = $props();
</script>

<svelte:head>
	<title>table {repo.package_json.glyph} {repo.package_json.name}</title>
</svelte:head>

<main class="box">
	<div class="p_lg">
		<Page_Header pkg={repo} />
	</div>
	<section>
		<div class="panel p_md">
			<Repos_Table {repos} />
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
