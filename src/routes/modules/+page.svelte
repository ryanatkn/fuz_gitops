<script lang="ts">
	import Modules_Page from '$lib/Modules_Page.svelte';
	import {get_repos} from '$lib/repo.js';

	const {repo, repos} = get_repos();
</script>

<Modules_Page {repo} {repos} />
