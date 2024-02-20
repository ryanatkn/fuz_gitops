<script lang="ts">
	import {page} from '$app/stores';

	import Tree_Item_Page from '$lib/Tree_Item_Page.svelte';
	import {get_deployments} from '$lib/deployments';

	const {deployment, deployments} = get_deployments();

	$: slug = $page.params.slug;
</script>

<Tree_Item_Page {deployment} {deployments} {slug} />
