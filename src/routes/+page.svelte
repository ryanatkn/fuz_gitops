<script lang="ts">
	import Library_Footer from '@ryanatkn/fuz/Library_Footer.svelte';
	import Card from '@ryanatkn/fuz/Card.svelte';
	import {base} from '$app/paths';

	import Main_Header from '$routes/Main_Header.svelte';
	import {get_repos} from '$lib/repos.js';

	const {repo} = get_repos();
</script>

<svelte:head>
	<title>{repo.package_json.name}</title>
</svelte:head>

<main class="box">
	<section class="pt_xl">
		<Main_Header />
	</section>
	<section>
		<menu class="unstyled">
			<li>
				<Card href="{base}/tree" icon="">tree</Card>
			</li>
			<li>
				<Card href="{base}/table" icon="">table</Card>
			</li>
			<li>
				<Card href="{base}/modules" icon="">modules</Card>
			</li>
			<li>
				<Card href="{base}/pull_requests" icon="">pull requests</Card>
			</li>
		</menu>
	</section>
	<section class="mb_xl7">
		<Library_Footer pkg={repo}>
			{#snippet logo_header()}<a href="{base}/about" class="mb_xs">about</a>{/snippet}
			{#snippet logo_footer()}<a href="https://www.fuz.dev/" class="mt_xs">fuz.dev</a>{/snippet}
		</Library_Footer>
	</section>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin: 0 auto;
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
