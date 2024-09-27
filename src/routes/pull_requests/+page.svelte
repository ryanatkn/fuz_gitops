<script lang="ts">
	import Pull_Requests_Page from '$lib/Pull_Requests_Page.svelte';
	import {repos_context} from '$lib/repo.js';

	const {repo, repos} = repos_context.get();
</script>

<Pull_Requests_Page {repo} {repos} filter_pull_request={(pull) => pull.user.login === 'ryanatkn'} />
