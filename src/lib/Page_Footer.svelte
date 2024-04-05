<script lang="ts">
	import type {Url} from '@ryanatkn/gro/paths.js';
	import type {Package_Meta} from '@ryanatkn/gro/package_meta.js';
	import type {Snippet} from 'svelte';
	import Breadcrumb from '@ryanatkn/fuz/Breadcrumb.svelte';
	import Library_Footer from '@ryanatkn/fuz/Library_Footer.svelte';
 
	interface Props {
		pkg: Package_Meta | {url: string; package_json: null};
		root_url?: Url | null;
		children?: Snippet;
	}

	const {pkg, root_url = null, children}: Props = $props();

	// TODO BLOCK this nests a second footer!
</script>

<footer>
	{#if pkg.package_json}
		<Library_Footer {pkg} {root_url} />
	{/if}
	{#if children}{@render children()}{/if}
	<div class="breadcrumb_wrapper">
		<Breadcrumb>{pkg.package_json?.icon}</Breadcrumb>
	</div>
</footer>

<style>
	footer {
		margin: var(--space_xl3) 0;
	}
	.breadcrumb_wrapper {
		font-size: var(--size_lg);
		margin-top: var(--space_xl3);
	}
</style>
