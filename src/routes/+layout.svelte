<script lang="ts">
	import '@ryanatkn/moss/style.css';
	import '@ryanatkn/moss/theme.css';
	import '$routes/style.css';

	import Themed from '@ryanatkn/fuz/Themed.svelte';
	import Dialog from '@ryanatkn/fuz/Dialog.svelte';
	import Contextmenu_Root from '@ryanatkn/fuz/Contextmenu_Root.svelte';
	import {Contextmenu_Store, contextmenu_action} from '@ryanatkn/fuz/contextmenu_helpers.svelte.js';
	import type {Snippet} from 'svelte';

	import Settings from '$routes/Settings.svelte';
	import deployments from '$lib/deployments.json';
	import {parse_deployments, set_deployments} from '$lib/deployments.js';

	interface Props {
		children: Snippet;
	}

	const {children}: Props = $props();

	const contextmenu = new Contextmenu_Store();

	// TODO fix JSON types
	set_deployments(parse_deployments(deployments as any, 'https://gitops.fuz.dev/'));

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
			<div class="pane">
				<Settings />
			</div>
		</Dialog>
	{/if}
</Themed>
