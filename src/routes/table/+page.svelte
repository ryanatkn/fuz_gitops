<script lang="ts">
	import Table_Page from '$lib/Table_Page.svelte';
	import {get_repos} from '$lib/repos.js';

	const {repo, repos} = get_repos();
</script>

<Table_Page {repo} {repos} />
