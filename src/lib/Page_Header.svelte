<script lang="ts">
	import type {Package_Meta} from '@ryanatkn/gro/package_meta.js';
	import Breadcrumb from '@ryanatkn/fuz/Breadcrumb.svelte';
	import type {Snippet} from 'svelte';
	import type {SvelteHTMLElements} from 'svelte/elements';

	interface Props {
		pkg: Package_Meta | {url: string; package_json: null};
		nav_attrs?: SvelteHTMLElements['nav'];
		attrs?: SvelteHTMLElements['header'];
		nav?: Snippet;
		children?: Snippet;
	}

	const {pkg, nav_attrs, attrs, nav, children}: Props = $props();
</script>

<header {...attrs}>
	{#if children}{@render children()}{/if}
	{#if nav}
		{@render nav()}
	{:else}
		<nav {...nav_attrs}><Breadcrumb>{pkg.package_json?.icon}</Breadcrumb></nav>
	{/if}
</header>

<style>
	header {
		font-size: var(--size_xl);
	}
	nav {
		display: flex;
		justify-content: center;
	}
</style>
