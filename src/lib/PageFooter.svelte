<script lang="ts">
	import DocsFooter from '@ryanatkn/fuz/DocsFooter.svelte';
	import Breadcrumb from '@ryanatkn/fuz/Breadcrumb.svelte';
	import {library_context} from '@ryanatkn/fuz/library.svelte.js';

	const library = library_context.get();
</script>

<section class="box mb_xl7">
	<DocsFooter {library}>
		<nav class="mb_xl5">
			<Breadcrumb>{library.package_json.glyph}</Breadcrumb>
		</nav>
	</DocsFooter>
</section>
