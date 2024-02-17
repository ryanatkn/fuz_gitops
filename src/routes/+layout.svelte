<script lang="ts">
	import '@ryanatkn/fuz/style.css';
	import '@ryanatkn/fuz/theme.css';
	import '$routes/style.css';

	import Themed from '@ryanatkn/fuz/Themed.svelte';
	import Dialog from '@ryanatkn/fuz/Dialog.svelte';
	import Contextmenu from '@ryanatkn/fuz/Contextmenu.svelte';
	import {create_contextmenu} from '@ryanatkn/fuz/contextmenu.js';

	import Settings from '$routes/Settings.svelte';
	import maybe_deployments from '$lib/deployments.json';
	import {parse_deployments, set_deployments} from '$lib/deployments.js';

	const contextmenu = create_contextmenu();

	set_deployments(parse_deployments(maybe_deployments, 'https://gitops.fuz.dev/'));

	let show_settings = false;
</script>

<svelte:head>
	<title>@ryanatkn/fuz_gitops</title>
</svelte:head>

<svelte:body
	use:contextmenu.action={[
		{
			content: 'Settings',
			icon: '?',
			run: () => {
				show_settings = true;
			},
		},
		{
			content: 'Reload',
			icon: '⟳',
			run: () => {
				location.reload();
			},
		},
	]}
/>

<Themed>
	<slot />
	<Contextmenu {contextmenu} />
	{#if show_settings}
		<Dialog on:close={() => (show_settings = false)}>
			<div class="pane">
				<Settings />
			</div>
		</Dialog>
	{/if}
</Themed>
