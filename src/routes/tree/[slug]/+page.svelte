<script lang="ts">
	import {page} from '$app/stores';

	import Tree_Item_Page from '$lib/Tree_Item_Page.svelte';
	import {get_repos} from '$lib/repo.js';

	const {repo, repos} = get_repos();
</script>

<Tree_Item_Page {repo} {repos} slug={$page.params.slug} />
