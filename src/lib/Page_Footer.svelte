<script lang="ts">
	import Docs_Footer from '@ryanatkn/fuz/Docs_Footer.svelte';
	import Breadcrumb from '@ryanatkn/fuz/Breadcrumb.svelte';

	import {repos_context} from '$lib/repo.js';

	const {repo} = repos_context.get();
</script>

<section class="box mb_xl7">
	<Docs_Footer pkg={repo}>
		<nav class="mb_xl5">
			<Breadcrumb>{repo.package_json.glyph}</Breadcrumb>
		</nav>
	</Docs_Footer>
</section>
