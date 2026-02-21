<script lang="ts">
	import { skills } from '$lib/data';
	import { Marquee } from '$lib/ui/module';
	import SkillCard from './skill-card.svelte';
	import { Button } from '$lib/ui/cn/button';
	import { goto } from '$app/navigation';
	import { ArrowRight } from 'lucide-svelte';

	import { m } from '$lib/paraglide/messages.js';

	let { manual_override = $bindable() }: { manual_override: boolean } = $props();
</script>

<Marquee pauseOnHover class="[--duration:60s]">
	{#each skills as skill}
		<SkillCard
			img={skill.img}
			name={skill.name}
			color={skill.color}
			border={skill.border}
			body={skill.message}
		/>
	{/each}
</Marquee>
<Marquee reverse pauseOnHover class="[--duration:60s]">
	{#each skills as skill}
		<SkillCard
			img={skill.img}
			name={skill.name}
			color={skill.color}
			border={skill.border}
			body={skill.message}
		/>
	{/each}
</Marquee>

<div
	class="{manual_override ? 'mt-6' : 'mt-12'} flex justify-center {manual_override
		? 'pb-2'
		: 'pb-12'} {!manual_override && 'md:hidden'}"
>
	<Button
		onclick={() => goto('/skills')}
		size="lg"
		class="relative flex h-16 items-center gap-3 rounded-xl border-4 border-black bg-lime-400 px-10 text-2xl font-black text-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-75 hover:bg-lime-400 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
	>
		{m['skills.button']()}
		<ArrowRight size={28} strokeWidth={4} class="transition-transform group-hover:translate-x-1" />
	</Button>
</div>
