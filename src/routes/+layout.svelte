<script lang="ts">
	import '@ryanatkn/moss/style.css';
	import '@ryanatkn/moss/theme.css';
	import '$routes/moss.css';
	import '$routes/style.css';

	import Themed from '@ryanatkn/fuz/Themed.svelte';
	import Dialog from '@ryanatkn/fuz/Dialog.svelte';
	import Contextmenu_Root from '@ryanatkn/fuz/Contextmenu_Root.svelte';
	import {
		Contextmenu_State,
		contextmenu_attachment,
	} from '@ryanatkn/fuz/contextmenu_state.svelte.js';
	import {pkg_context} from '@ryanatkn/fuz/pkg.svelte.js';
	import type {Snippet} from 'svelte';

	import Settings from '$routes/Settings.svelte';
	import {repos_json} from '$routes/repos.js';
	import {Repo, type Repo_Json, repos_parse, repos_context} from '$lib/repo.svelte.js';

	interface Props {
		children: Snippet;
	}

	const {children}: Props = $props();

	const contextmenu = new Contextmenu_State();

	const repos = repos_parse(
		repos_json.map((r: Repo_Json) => new Repo(r)),
		'https://gitops.fuz.dev/',
	);
	repos_context.set(repos);
	pkg_context.set(repos.repo.pkg);

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
	<Contextmenu_Root {contextmenu}>
		{@render children()}
	</Contextmenu_Root>
	{#if show_settings}
		<Dialog onclose={() => (show_settings = false)}>
			<div class="pane p_md width_upto_md mx_auto">
				<Settings />
			</div>
		</Dialog>
	{/if}
</Themed>
