<script lang="ts">
	import {base} from '$app/paths';
	import type {Snippet} from 'svelte';

	import type {Repo} from '$lib/repo.js';

	interface Props {
		repos: Array<Repo>;
		/**
		 * The selected package, if any.
		 */
		selected_repo?: Repo;
		children: Snippet;
	}

	const {repos, selected_repo, children}: Props = $props();
</script>

<nav>
	<menu class="names panel p_md">
		{#each repos as repo}
			{@const selected = repo === selected_repo}
			<li style:display="contents">
				{#if repo.package_json}<a
						class="menu_item"
						class:selected
						href="{base}/tree/{repo.repo_name}"
						><div class="ellipsis">
							{repo.repo_name}{#if repo.package_json.glyph}{' '}{repo.package_json.glyph}{/if}
						</div></a
					>{/if}
			</li>
		{/each}
	</menu>
	{@render children()}
</nav>

<style>
	nav {
		display: flex;
		flex-direction: column;
		position: sticky;
		top: var(--space_md);
		width: var(--nav_width, 240px);
		padding: var(--space_lg);
		padding-right: 0;
	}
	.names {
		padding: var(--space_md);
	}
	/* TODO should be a CSS class or variable, probably add :focus behavior */
	.names a:hover {
		background-color: var(--bg_5);
	}
	.names a:is(:active, .selected) {
		background-color: var(--bg_7);
	}
</style>
