<script lang="ts">
	import Alert from '@ryanatkn/fuz/Alert.svelte';
	import Breadcrumb from '@ryanatkn/fuz/Breadcrumb.svelte';

	import Page_Footer from '$lib/Page_Footer.svelte';
	import Page_Header from '$lib/Page_Header.svelte';
	import Repos_Tree from '$lib/Repos_Tree.svelte';
	import type {Fetched_Repo} from '$lib/fetch_repos.js';

	interface Props {
		repo: Fetched_Repo;
		repos: Fetched_Repo[];
		slug: string;
	}

	const {repo, repos, slug}: Props = $props();

	// TODO ideally there would be one `Repos_Tree` mounted by the layout with transitions

	const route_repo = $derived(repos.find((p) => p.repo_name === slug));
</script>

<svelte:head>
	<title>{slug} - tree {repo.package_json.glyph} {repo.package_json.name}</title>
</svelte:head>

<main class="box w_100">
	<div class="p_lg">
		<Page_Header pkg={repo} />
	</div>
	<section class="tree">
		{#if !route_repo}
			<div class="mb_lg">
				<Alert status="error"><p>cannot find <code>{slug}</code></p></Alert>
			</div>
		{/if}
		<Repos_Tree {repos} selected_repo={route_repo}>
			{#snippet nav()}
				<div class="repos_tree_nav">
					<Breadcrumb>{repo.package_json.glyph}</Breadcrumb>
				</div>
			{/snippet}
		</Repos_Tree>
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
	.tree {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 100%;
	}
	.repos_tree_nav {
		display: flex;
		margin-top: var(--space_xl);
	}
	/* TODO hacky */
	.repos_tree_nav :global(.breadcrumb) {
		justify-content: flex-start;
	}
</style>
