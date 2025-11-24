<script lang="ts">
	import Tree_Page from '$lib/Tree_Page.svelte';
	import {repos_context} from '$lib/repo.svelte.js';

	const {repo, repos} = repos_context.get();

	// TODO ideally there would be one `Repos_Tree` mounted by the layout
</script>

<Tree_Page {repo} {repos} />
