<script lang="ts">
	import PageFooter from './PageFooter.svelte';
	import PageHeader from './PageHeader.svelte';
	import ReposTable from './ReposTable.svelte';
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
		<PageHeader pkg={repo.pkg} />
	</div>
	<section>
		<div class="panel p_md">
			<ReposTable {repos} />
		</div>
	</section>
	<section class="box mb_xl7">
		<PageFooter />
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
