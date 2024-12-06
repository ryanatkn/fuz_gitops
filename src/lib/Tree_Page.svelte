<script lang="ts">
	import Breadcrumb from '@ryanatkn/fuz/Breadcrumb.svelte';

	import Page_Footer from '$lib/Page_Footer.svelte';
	import Page_Header from '$lib/Page_Header.svelte';
	import Repos_Tree from '$lib/Repos_Tree.svelte';
	import type {Repo} from '$lib/repo.js';

	interface Props {
		repo: Repo;
		repos: Array<Repo>;
	}

	const {repo, repos}: Props = $props();

	// TODO ideally there would be one `Repos_Tree` mounted by the layout with transitions
</script>

<svelte:head>
	<title>tree {repo.package_json.glyph} {repo.name}</title>
</svelte:head>

<main class="box w_100">
	<div class="p_lg">
		<Page_Header pkg={repo} />
	</div>
	<section class="tree">
		<Repos_Tree {repos}>
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
		justify-content: center;
	}
	section:first-child {
		margin-top: var(--space_xl4);
	}
	.tree {
		display: flex;
		flex-direction: row;
		align-items: flex-start;
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
