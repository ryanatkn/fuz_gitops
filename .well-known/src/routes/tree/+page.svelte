<script lang="ts">
	import Tree_Page from '$lib/Tree_Page.svelte';
	import {get_deployments} from '$lib/deployments.js';

	const {deployment, deployments} = get_deployments();

	// TODO ideally there would be one `Deployments_Tree` mounted by the layout
</script>

<Tree_Page {deployment} {deployments} />
