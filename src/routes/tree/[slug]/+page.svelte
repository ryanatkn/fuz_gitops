<script lang="ts">
	import Tree_Item_Page from '$lib/Tree_Item_Page.svelte';
	import {repos_context} from '$lib/repo.js';

	const {params} = $props();

	const {repo, repos} = repos_context.get();
</script>

<Tree_Item_Page {repo} {repos} slug={params.slug} />
