<script lang="ts">
	import Modules_Page from '$lib/Modules_Page.svelte';
	import {repos_context} from '$lib/repo.js';

	const {repo, repos} = repos_context.get();
</script>

<Modules_Page {repo} {repos} />
