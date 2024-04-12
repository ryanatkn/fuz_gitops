<script lang="ts">
	import Page_Footer from '$lib/Page_Footer.svelte';
	import Page_Header from '$lib/Page_Header.svelte';
	import Pull_Requests_Detail from '$lib/Pull_Requests_Detail.svelte';
	import type {Filter_Pull_Request} from '$lib/github_helpers.js';
	import type {Fetched_Deployment, Unfetched_Deployment} from '$lib/fetch_deployments.js';

	interface Props {
		deployment: Fetched_Deployment;
		deployments: Fetched_Deployment[];
		unfetched_deployments: Unfetched_Deployment[];
		filter_pull_request?: Filter_Pull_Request | undefined;
	}

	const {deployment, deployments, unfetched_deployments, filter_pull_request}: Props = $props();
</script>

<svelte:head>
	<title>pull requests {deployment.package_json.icon} {deployment.package_json.name}</title>
</svelte:head>

<main class="box w_100">
	<div class="p_lg">
		<Page_Header pkg={deployment} />
	</div>
	<section>
		<Pull_Requests_Detail {deployments} {unfetched_deployments} {filter_pull_request} />
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
