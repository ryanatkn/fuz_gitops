<script lang="ts">
	import '@ryanatkn/moss/style.css';
	import '@ryanatkn/moss/theme.css';
	import '$routes/moss.css';
	import '$routes/style.css';

	import Themed from '@ryanatkn/fuz/Themed.svelte';
	import Dialog from '@ryanatkn/fuz/Dialog.svelte';
	import Contextmenu_Root from '@ryanatkn/fuz/Contextmenu_Root.svelte';
	import {Contextmenu_State, contextmenu_action} from '@ryanatkn/fuz/contextmenu_state.svelte.js';
	import type {Snippet} from 'svelte';

	import Settings from '$routes/Settings.svelte';
	import {repos} from '$routes/repos.js';
	import {parse_repos, repos_context} from '$lib/repo.js';

	interface Props {
		children: Snippet;
	}

	const {children}: Props = $props();

	const contextmenu = new Contextmenu_State();

	repos_context.set(parse_repos(repos, 'https://gitops.fuz.dev/'));

	let show_settings = $state(false);
</script>

<svelte:head>
	<title>@ryanatkn/fuz_gitops</title>
</svelte:head>

<svelte:body
	use:contextmenu_action={[
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
	]}
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
