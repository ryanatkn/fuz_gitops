<script lang="ts">
	import Library_Footer from '@ryanatkn/fuz/Library_Footer.svelte';
	import Card from '@ryanatkn/fuz/Card.svelte';
	import {base} from '$app/paths';

	import Main_Header from '$routes/Main_Header.svelte';
	import {get_deployments} from '$lib/deployments.js';

	const {deployment} = get_deployments();
</script>

<svelte:head>
	<title>{deployment.package_json.name}</title>
</svelte:head>

<main class="box">
	<section>
		<Main_Header />
	</section>
	<section>
		<menu>
			<li>
				<Card href="{base}/table">
					table
					<svelte:fragment slot="icon">{''}</svelte:fragment>
				</Card>
			</li>
			<li>
				<Card href="{base}/modules">
					modules
					<svelte:fragment slot="icon">{''}</svelte:fragment>
				</Card>
			</li>
			<li>
				<Card href="{base}/pull_requests">
					pull requests
					<svelte:fragment slot="icon">{''}</svelte:fragment>
				</Card>
			</li>
			<li>
				<Card href="{base}/tree">
					tree
					<svelte:fragment slot="icon">{''}</svelte:fragment>
				</Card>
			</li>
		</menu>
	</section>
	<section class="box">
		<a class="chip" href="{base}/about">about</a>
	</section>
	<section>
		<Library_Footer pkg={deployment} root_url="https://www.fuz.dev/" />
	</section>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin: 0 auto;
	}
	section {
		margin-bottom: var(--space_xl4);
	}
	section:first-child {
		margin-top: var(--space_xl4);
	}
	menu {
		gap: var(--space_lg);
		width: 100%;
		display: flex;
		flex-wrap: wrap;
		flex-direction: column;
		align-items: center;
		font-size: var(--size_xl3);
	}
	li {
		margin-bottom: var(--space_xl);
	}
</style>
