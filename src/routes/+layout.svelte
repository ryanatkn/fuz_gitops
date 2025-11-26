<script lang="ts">
	import '@ryanatkn/moss/style.css';
	import '@ryanatkn/moss/theme.css';
	import '$routes/moss.css';
	import '$routes/style.css';

	import Themed from '@ryanatkn/fuz/Themed.svelte';
	import Dialog from '@ryanatkn/fuz/Dialog.svelte';
	import ContextmenuRoot from '@ryanatkn/fuz/ContextmenuRoot.svelte';
	import {
		ContextmenuState,
		contextmenu_attachment,
	} from '@ryanatkn/fuz/contextmenu_state.svelte.js';
	import {Library, library_context} from '@ryanatkn/fuz/library.svelte.js';
	import type {Snippet} from 'svelte';

	import Settings from '$routes/Settings.svelte';
	import {repos_json} from '$routes/repos.js';
	import {Repo, type RepoJson, repos_parse, repos_context} from '$lib/repo.svelte.js';
	import {library_json} from '$routes/library.js';

	interface Props {
		children: Snippet;
	}

	const {children}: Props = $props();

	const contextmenu = new ContextmenuState();

	const repos = repos_parse(
		repos_json.map((r: RepoJson) => new Repo(r)),
		'https://gitops.fuz.dev/',
	);
	repos_context.set(repos);
	library_context.set(new Library(library_json));

	let show_settings = $state(false);
</script>

<svelte:head>
	<title>@ryanatkn/fuz_gitops</title>
</svelte:head>

<svelte:body
	{@attach contextmenu_attachment([
		{
			snippet: 'text',
			props: {
				content: 'Settings',
				icon: '?',
				run: () => {
					show_settings = true;
				},
			},
		},
		{
			snippet: 'text',
			props: {
				content: 'Reload',
				icon: '⟳',
				run: () => {
					location.reload();
				},
			},
		},
	])}
/>

<Themed>
	<ContextmenuRoot {contextmenu}>
		{@render children()}
	</ContextmenuRoot>
	{#if show_settings}
		<Dialog onclose={() => (show_settings = false)}>
			<div class="pane p_md width_upto_md mx_auto">
				<Settings />
			</div>
		</Dialog>
	{/if}
</Themed>
