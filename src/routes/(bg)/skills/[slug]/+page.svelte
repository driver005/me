<!-- src/routes/(bg)/skills/[slug]/+page.svelte -->
<script lang="ts">
	import { page } from '$app/state';
	import { skills } from '$lib/data';
	import { m } from '$lib/paraglide/messages';
	import { Star } from 'lucide-svelte';

	const skill = $derived(skills.find((s) => s.slug === page.params.slug));

	const messages = m as unknown as Record<string, () => string>;
	const description = $derived(skill ? messages[`skill_detail.${skill.slug}.description`]() : '');
	const pro = $derived(skill ? messages[`skill_detail.${skill.slug}.pro`]() : '');
	const contra = $derived(skill ? messages[`skill_detail.${skill.slug}.contra`]() : '');
</script>

<svelte:head>
	<title>{skill ? `${skill.name} ${m['common.title_suffix']()}` : m['common.skill_not_found_title']()}</title>
</svelte:head>

{#if skill}
	<div class="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex flex-col gap-3 p-8 text-white sm:max-w-xl">
		<a href="/skills" class="pointer-events-auto w-fit text-sm text-white/60 underline hover:text-white">{m['common.back_link']()}</a>
		<h1 class="flex items-center gap-3 text-5xl leading-none font-black tracking-tight sm:text-7xl">
			{#if skill.favourite}
				<Star class="h-8 w-8 shrink-0 fill-current sm:h-10 sm:w-10" style="color: {skill.primaryColor}" />
			{/if}
			{skill.name}
		</h1>
		<p class="leading-relaxed text-white/90">{description}</p>
		<div class="mt-2 grid gap-3 sm:grid-cols-2">
			<div class="rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-3">
				<p class="text-xs font-bold tracking-widest text-emerald-300 uppercase">{m['skills.pro_label']()}</p>
				<p class="mt-1 text-sm text-white/85">{pro}</p>
			</div>
			<div class="rounded-lg border border-red-400/30 bg-red-400/10 p-3">
				<p class="text-xs font-bold tracking-widest text-red-300 uppercase">{m['skills.contra_label']()}</p>
				<p class="mt-1 text-sm text-white/85">{contra}</p>
			</div>
		</div>
	</div>
{:else}
	<div class="pointer-events-none fixed inset-x-0 bottom-0 z-20 p-8 text-white">
		<a href="/skills" class="pointer-events-auto underline">{m['common.skill_not_found_back']()}</a>
	</div>
{/if}
