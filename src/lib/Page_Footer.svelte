<script lang="ts">
	import Library_Footer from '@ryanatkn/fuz/Library_Footer.svelte';
	import Breadcrumb from '@ryanatkn/fuz/Breadcrumb.svelte';

	import {get_deployments} from '$lib/deployments.js';

	const {deployment} = get_deployments();
</script>

<section class="box mb_xl7">
	<Library_Footer pkg={deployment}>
		<nav class="mb_xl5">
			<Breadcrumb>{deployment.package_json.glyph}</Breadcrumb>
		</nav>
	</Library_Footer>
</section>
