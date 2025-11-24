<script lang="ts">
	import Page_Footer from './Page_Footer.svelte';
	import Page_Header from './Page_Header.svelte';
	import Repos_Table from './Repos_Table.svelte';
	import type {Repo} from './repo.svelte.js';

	interface Props {
		repo: Repo;
		repos: Array<Repo>;
	}

	const {repo, repos}: Props = $props();
</script>

<svelte:head>
	<title>table {repo.pkg.package_json.glyph} {repo.pkg.package_json.name}</title>
</svelte:head>

<main class="box">
	<div class="p_lg">
		<Page_Header pkg={repo.pkg} />
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
