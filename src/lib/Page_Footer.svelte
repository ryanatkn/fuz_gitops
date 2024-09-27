<script lang="ts">
	import Library_Footer from '@ryanatkn/fuz/Library_Footer.svelte';
	import Breadcrumb from '@ryanatkn/fuz/Breadcrumb.svelte';

	import {repos_context} from '$lib/repo.js';

	const {repo} = repos_context.get();
</script>

<section class="box mb_xl7">
	<Library_Footer pkg={repo}>
		<nav class="mb_xl5">
			<Breadcrumb>{repo.package_json.glyph}</Breadcrumb>
		</nav>
	</Library_Footer>
</section>
