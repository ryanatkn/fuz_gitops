<script lang="ts">
	import {page} from '$app/stores';

	import Tree_Item_Page from '$lib/Tree_Item_Page.svelte';
	import {repos_context} from '$lib/repo.js';

	const {repo, repos} = repos_context.get();
</script>

<Tree_Item_Page {repo} {repos} slug={$page.params.slug} />
