<script lang="ts">
	import Table_Page from '$lib/Table_Page.svelte';
	import {get_deployments} from '$lib/deployments.js';

	const {deployment, deployments} = get_deployments();
</script>

<Table_Page {deployment} {deployments} />
