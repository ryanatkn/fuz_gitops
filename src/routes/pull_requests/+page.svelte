<script lang="ts">
	import Pull_Requests_Page from '$lib/Pull_Requests_Page.svelte';
	import {get_repos} from '$lib/repo.js';

	const {repo, repos} = get_repos();
</script>

<Pull_Requests_Page {repo} {repos} filter_pull_request={(pull) => pull.user.login === 'ryanatkn'} />
