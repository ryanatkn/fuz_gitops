<script lang="ts">
	import {page} from '$app/stores';
	import type {Src_Module} from '@ryanatkn/gro/src_json.js';

	import type {Repo} from '$lib/repo.js';

	// TODO add highlighting of the items that are onscreen

	// LibraryMenu floats alongside the docs, showing scrolled item as selected
	interface Props {
		repos_modules: Array<{
			repo: Repo;
			modules: Array<Src_Module>;
		}>;
	}

	const {repos_modules}: Props = $props();

	// TODO add favicon (from library? gro?)
</script>

<nav class="modules_nav">
	<h6>packages</h6>
	<ul class="unstyled">
		{#each repos_modules as pkg_modules (pkg_modules)}
			<li role="none">
				<a href="#{pkg_modules.repo.name}" class:selected={pkg_modules.repo.name === $page.url.hash}
					>{pkg_modules.repo.name}</a
				>
			</li>
		{/each}
	</ul>
</nav>

<style>
	.modules_nav {
		width: 100%;
	}
	h6 {
		padding-bottom: var(--space_sm);
	}
	h6:not(:first-child) {
		margin-top: var(--space_xl);
	}
</style>
