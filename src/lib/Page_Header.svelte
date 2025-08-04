<script lang="ts">
	import type {Pkg} from '@ryanatkn/belt/pkg.js';
	import Breadcrumb from '@ryanatkn/fuz/Breadcrumb.svelte';
	import type {Snippet} from 'svelte';
	import type {SvelteHTMLElements} from 'svelte/elements';

	interface Props {
		pkg: Pkg | {url: string; package_json: null};
		nav_attrs?: SvelteHTMLElements['nav'];
		attrs?: SvelteHTMLElements['header'];
		nav?: Snippet;
		children?: Snippet;
	}

	const {pkg, nav_attrs, attrs, nav, children}: Props = $props();
</script>

<header {...attrs}>
	{@render children?.()}
	{#if nav}
		{@render nav()}
	{:else}
		<nav {...nav_attrs}><Breadcrumb>{pkg.package_json?.glyph}</Breadcrumb></nav>
	{/if}
</header>

<style>
	header {
		--font_size: var(--font_size_xl);
	}
	nav {
		display: flex;
		justify-content: center;
	}
</style>
