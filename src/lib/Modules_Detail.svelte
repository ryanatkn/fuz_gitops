<script lang="ts">
	import type {Src_Module} from '@ryanatkn/gro/src_json.js';
	import {ensure_end} from '@ryanatkn/belt/string.js';
	import {base} from '$app/paths';
	import type {Snippet} from 'svelte';

	import Modules_Nav from '$lib/Modules_Nav.svelte';
	import type {Repo} from '$lib/repo.js';

	interface Props {
		repos: Repo[]; // TODO normalized version with cached primitives?
		nav_footer?: Snippet;
	}

	const {repos, nav_footer}: Props = $props();

	// TODO add sorting options

	// TODO show other data (bytes and lines of code per module?)

	// TODO hacky, needs helpers or rethinking
	const repos_modules: Array<{
		repo: Repo;
		modules: Src_Module[];
	}> = $derived(
		repos.reduce<Array<{repo: Repo; modules: Src_Module[]}>>((v, repo) => {
			const {package_json, src_json} = repo;
			if (
				!src_json.modules ||
				!(
					!!package_json.devDependencies?.['@sveltejs/package'] ||
					!!package_json.dependencies?.['@sveltejs/package']
				)
			) {
				return v;
			}
			v.push({repo, modules: Object.values(src_json.modules)});
			return v;
		}, []),
	);

	// TODO add favicon (from library? gro?)
</script>

<div class="modules_detail">
	<div class="nav_wrapper">
		<section>
			<Modules_Nav {repos_modules} />
		</section>
		{@render nav_footer?.()}
	</div>
	<ul class="width_md box unstyled">
		{#each repos_modules as repo_modules (repo_modules)}
			{@const {repo, modules} = repo_modules}
			<li class="repo_module">
				<header class="w_100 relative">
					<a href="#{repo.name}" id={repo.name} class="subtitle">🔗</a>
					<a href="{base}/tree/{repo.repo_name}">{repo.name}</a>
				</header>
				<ul class="modules panel unstyled">
					{#each modules as repo_module (repo_module)}
						{@const {path, declarations} = repo_module}
						<li
							class="module"
							class:ts={path.endsWith('.ts')}
							class:svelte={path.endsWith('.svelte')}
							class:css={path.endsWith('.css')}
							class:json={path.endsWith('.json')}
						>
							<div class="module_file">
								{#if repo.repo_url}
									<div class="chip row">
										<a href="{ensure_end(repo.repo_url, '/')}blob/main/src/lib/{path}">{path}</a>
									</div>
								{:else}
									<span class="chip">{path}</span>
								{/if}
							</div>
							<ul class="declarations unstyled">
								{#each declarations as { name, kind }}
									<li class="declaration chip {kind}_declaration">
										{name}
									</li>
								{/each}
							</ul>
						</li>
					{/each}
				</ul>
			</li>
		{/each}
	</ul>
</div>

<!-- TODO better rendering, also show author, etc -->

<style>
	.modules_detail {
		position: relative;
		padding: var(--space_lg);
		display: flex;
		flex-direction: row;
		align-items: flex-start;
		width: 100%;
		gap: var(--space_xl);
	}
	.subtitle {
		position: absolute;
		right: 0;
		top: 0;
		text-align: right;
	}
	.repo_module {
		width: 100%;
		display: flex;
		flex-direction: column;
		margin-bottom: var(--space_xl5);
	}
	.repo_module > header {
		display: flex;
		padding: var(--space_xs) var(--space_md);
		font-size: var(--size_lg);
		position: sticky;
		top: 0;
		background-color: var(--bg);
	}
	.modules {
		padding: var(--space_sm);
	}
	.module {
		margin-bottom: var(--space_lg);
		--link_color: var(--text_color_3);
	}
	.module_file {
		margin-bottom: var(--space_xs);
	}
	.ts {
		--link_color: var(--color_a_5);
	}
	.svelte {
		--link_color: var(--color_e_5);
	}
	.css {
		--link_color: var(--color_b_5);
	}
	.json {
		--link_color: var(--color_f_5);
	}
	/* TODO extract */
	.declarations {
		display: flex;
		flex: 1;
		flex-direction: row;
		flex-wrap: wrap;
		align-items: flex-start;
		gap: var(--space_xs);
		padding-left: var(--space_xs);
	}
	.declaration {
		font-family: var(--font_mono);
		font-size: var(--size_sm);
	}
	.variable_declaration {
		color: var(--color_d_5);
	}
	.function_declaration {
		color: var(--color_c_5);
	}
	.type_declaration {
		color: var(--color_g_5);
	}
	.class_declaration {
		color: var(--color_f_5);
	}
	/* TODO extract  */
	.nav_wrapper {
		position: sticky;
		top: var(--space_xl);
		display: flex;
		flex-direction: column;
	}
</style>
