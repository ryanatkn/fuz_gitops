<script lang="ts">
	import Pull_Requests_Page from '$lib/Pull_Requests_Page.svelte';
	import {get_deployments} from '$lib/deployments.js';

	const {deployment, deployments, unfetched_deployments} = get_deployments();
</script>

<Pull_Requests_Page
	{deployment}
	{deployments}
	{unfetched_deployments}
	filter_pull_request={(pull) => pull.user.login === 'ryanatkn'}
/>
