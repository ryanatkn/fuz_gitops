<script lang="ts">
	import {page} from '$app/state';
	import type {ModuleJson} from '@ryanatkn/belt/src_json.js';

	import type {Repo} from './repo.svelte.js';

	// TODO add highlighting of the items that are onscreen

	interface Props {
		repos_modules: Array<{
			repo: Repo;
			modules: Array<ModuleJson>;
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
				<a
					href="#{pkg_modules.repo.name}"
					class:selected={pkg_modules.repo.name === page.url.hash}
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
