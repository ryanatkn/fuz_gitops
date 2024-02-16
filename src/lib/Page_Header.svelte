<script lang="ts">
	import Breadcrumb from '@ryanatkn/fuz/Breadcrumb.svelte';
	import type {Package_Meta} from '@ryanatkn/fuz/package_meta.js';

	export let pkg: Package_Meta;
</script>

<div>
	<Breadcrumb>{pkg.package_json.icon}</Breadcrumb>
</div>

<style>
	div {
		font-size: var(--size_1);
	}
</style>
