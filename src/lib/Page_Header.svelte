<script lang="ts">
	import type {Package_Meta} from '@ryanatkn/gro/package_meta.js';
	import Breadcrumb from '@ryanatkn/fuz/Breadcrumb.svelte';

	interface Props {
		pkg: Package_Meta | {url: string; package_json: null};
	}

	const {pkg}: Props = $props();
</script>

<div>
	<Breadcrumb>{pkg.package_json?.icon}</Breadcrumb>
</div>

<style>
	div {
		font-size: var(--size_xl);
	}
</style>
