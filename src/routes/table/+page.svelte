<script lang="ts">
	import Table_Page from '$lib/Table_Page.svelte';
	import {repos_context} from '$lib/repo.js';

	const {repo, repos} = repos_context.get();
</script>

<Table_Page {repo} {repos} />
