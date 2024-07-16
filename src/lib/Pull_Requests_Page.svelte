<script context="module" lang="ts">
	// TODO is this the new required pattern?
	export interface Props {
		repo: Fetched_Repo;
		repos: Fetched_Repo[];
		unfetched_repos: Unfetched_Repo[];
		filter_pull_request?: Filter_Pull_Request | undefined;
	}
</script>

<script lang="ts">
	import Page_Footer from '$lib/Page_Footer.svelte';
	import Page_Header from '$lib/Page_Header.svelte';
	import Pull_Requests_Detail from '$lib/Pull_Requests_Detail.svelte';
	import type {Filter_Pull_Request} from '$lib/github_helpers.js';
	import type {Fetched_Repo, Unfetched_Repo} from '$lib/fetch_repos.js';

	const {repo, repos, unfetched_repos, filter_pull_request}: Props = $props();
</script>

<svelte:head>
	<title>pull requests {repo.package_json.glyph} {repo.package_json.name}</title>
</svelte:head>

<main class="box w_100">
	<div class="p_lg">
		<Page_Header pkg={repo} />
	</div>
	<section>
		<Pull_Requests_Detail {repos} {unfetched_repos} {filter_pull_request} />
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
