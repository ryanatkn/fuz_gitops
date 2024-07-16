<script lang="ts">
	import Tree_Page from '$lib/Tree_Page.svelte';
	import {get_repos} from '$lib/repo.js';

	const {repo, repos} = get_repos();

	// TODO ideally there would be one `Repos_Tree` mounted by the layout
</script>

<Tree_Page {repo} {repos} />
