<script lang="ts">
	import Modules_Page from '$lib/Modules_Page.svelte';
	import {get_deployments} from '$lib/deployments.js';

	const {deployment, deployments} = get_deployments();
</script>

<Modules_Page {deployment} {deployments} />
