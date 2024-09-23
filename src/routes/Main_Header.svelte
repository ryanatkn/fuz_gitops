<script lang="ts">
	import Svg from '@ryanatkn/fuz/Svg.svelte';
	import {fuz_logo} from '@ryanatkn/fuz/logos.js';
</script>

<header class="p_md">
	<div class="box pane p_lg bg">
		<h1 class="p_sm mb_0">fuz_gitops</h1>
		<!-- TODO Fuz_Gitops_Logo -->
		<Svg
			data={fuz_logo}
			fill="var(--color_a_5)"
			size="var(--icon_size_xl2)"
			label="a friendly blue spider facing you"
		/>
		a tool for managing many repos 🪄
	</div>
</header>
