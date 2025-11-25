<script lang="ts">
	import DocsFooter from '@ryanatkn/fuz/DocsFooter.svelte';
	import Breadcrumb from '@ryanatkn/fuz/Breadcrumb.svelte';
	import {pkg_context} from '@ryanatkn/fuz/pkg.svelte.js';

	const pkg = pkg_context.get();
</script>

<section class="box mb_xl7">
	<DocsFooter {pkg}>
		<nav class="mb_xl5">
			<Breadcrumb>{pkg.package_json.glyph}</Breadcrumb>
		</nav>
	</DocsFooter>
</section>
