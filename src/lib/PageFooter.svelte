<script lang="ts">
	import DocsFooter from '@ryanatkn/fuz/DocsFooter.svelte';
	import Breadcrumb from '@ryanatkn/fuz/Breadcrumb.svelte';

	import {repos_context} from './repo.svelte.js';

	const {repo} = repos_context.get();
</script>

<section class="box mb_xl7">
	<DocsFooter pkg={repo.pkg}>
		<nav class="mb_xl5">
			<Breadcrumb>{repo.pkg.package_json.glyph}</Breadcrumb>
		</nav>
	</DocsFooter>
</section>
