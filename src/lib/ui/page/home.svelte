<script lang="ts">
	import * as Tabs from '$lib/ui/cn/tabs';
	import * as Card from '$lib/ui/cn/card';
	import { Button } from '$lib/ui/cn/button';
	import { Download, FileDown, CircleCheck } from 'lucide-svelte';
	import {
		HeroCard,
		Skill,
		Project,
		Circle,
		Story,
		Journey,
		ContactCard,
		MusicMobile
	} from '$lib/ui/custom';
	import { m } from '$lib/paraglide/messages';
	import { dock } from '$lib/data';
	import { calculate_age } from '$lib/util/age.svelte';
	import { Lang } from '$lib/ui/dialog';
	import ThemeSwitcher from '../helper/theme-switcher.svelte';
	import { getLocale } from '$lib/paraglide/runtime';

	let {
		active = $bindable(),
		manual_override = $bindable()
	}: { active: string; manual_override: boolean } = $props();

	const age = calculate_age('2005-12');
	const pitches = $derived(m['letter.pitch']().split('|'));

	function handleClick(name: string) {
		if (name === 'letter') {
			const file = getLocale() === 'en' ? 'motivation_letter.pdf' : 'motivations_schreiben.pdf';
			window.open(`/docs/${file}`, '_blank', 'noopener,noreferrer');
		} else if (name === 'resume') {
			const file = getLocale() === 'en' ? 'resume.pdf' : 'lebenslauf.pdf';
			window.open(`/docs/${file}`, '_blank', 'noopener,noreferrer');
		}
	}
</script>

<header class="mb-6 pr-8 md:pr-4">
	<HeroCard image={m.image()} name={m.headline()} tagline={m.tagline({ age: age })} />
</header>
<Tabs.Root bind:value={active} class="flex flex-1 flex-col items-center overflow-y-auto">
	<Tabs.List
		class="mx-4 mb-6 h-1/6 items-center gap-8 bg-transparent max-[350px]:h-1/3 min-[500px]:bg-background
		{!manual_override && 'md:hidden'}"
	>
		<div
			class="flex w-full flex-wrap items-center gap-2 rounded-xl py-1 min-[500px]:border-4 min-[500px]:border-black min-[500px]:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
		>
			{#each dock.navbar as item}
				<Tabs.Trigger
					value={item.value}
					style={active === item.value
						? `background-color: var(--${item.color.replaceAll('bg', 'color')})`
						: ''}
					class="mx-2 border-2 border-transparent px-3 py-1 font-bold uppercase transition-all data-[state=active]:border-black data-[state=active]:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] {item.color} bg-background"
				>
					{item.label}
				</Tabs.Trigger>
			{/each}
		</div>
		{#if manual_override}
			<div class="max-[600px]:hidden">
				<Lang />
			</div>
		{/if}
	</Tabs.List>

	<div class="w-full flex-1 px-4">
		<Tabs.Content value="home" class="m-0 space-y-6 pb-2">
			<div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
				<Card.Root
					class="group relative h-full overflow-hidden rounded-2xl border-none p-1 transition-all duration-500"
				>
					<div
						class="absolute -inset-full animate-[spin_3s_linear_infinite] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
						style="background: conic-gradient(from 0deg, #ff0000, #ff7700, #ffeb00, #00ff00, #00ffff, #0000ff, #8b00ff, #ff0000);"
					></div>
					<Story />
				</Card.Root>
				<Card.Root
					onclick={() => (active = 'skills')}
					class="cursor-pointer border-4 border-black bg-background py-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
				>
					<Circle />
				</Card.Root>

				<!-- Dowload buttons -->
				<Card.Root
					class="gap-0 overflow-hidden border-4 border-black bg-background py-0 pb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
				>
					<Card.Header class="border-b-2 border-black bg-yellow-300 pt-2">
						<Card.Title class="text-lg font-black uppercase italic dark:text-black"
							>{m['letter.title']()}</Card.Title
						>
					</Card.Header>
					<Card.Content>
						<ul class="my-5 space-y-2">
							{#each pitches as point}
								<li class="flex items-center gap-2 text-sm font-bold">
									<CircleCheck size={16} class="fill-emerald-400 text-black" />
									{point}
								</li>
							{/each}
						</ul>
						<Button
							onclick={() => handleClick('letter')}
							class="h-10 w-full gap-2 rounded-xl border-4 border-black bg-indigo-400 font-black text-black uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-indigo-300 active:translate-x-px active:translate-y-px active:shadow-none dark:hover:bg-indigo-500"
						>
							<Download size={16} />
							{m['letter.button']()}
						</Button>
					</Card.Content>
				</Card.Root>
				<Card.Root
					class="flex flex-col justify-center border-4 border-black bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
				>
					<div class="text-center">
						<div
							class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border-2 border-black bg-emerald-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
						>
							<FileDown class="text-black" size={24} />
						</div>

						<h4
							class="text-xl font-black tracking-tight text-black uppercase italic dark:text-white"
						>
							{m['resume.title']()}
						</h4>

						<p
							class="mx-auto mt-2 w-fit border border-black bg-black px-2 py-0.5 text-[10px] font-bold tracking-widest text-white uppercase dark:border-emerald-500 dark:bg-emerald-500 dark:text-black"
						>
							{m['resume.update']({ date: '15-2-2026' })}
						</p>
					</div>

					<Button
						onclick={() => handleClick('resume')}
						class="h-10 w-full gap-2 rounded-xl border-4 border-black bg-pink-400 font-black text-black uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-pink-300 active:translate-x-px active:translate-y-px active:shadow-none dark:hover:bg-pink-500"
					>
						<Download size={16} />
						{m['resume.button']()}
					</Button>
				</Card.Root>
				{#if manual_override}
					<div class="flex justify-center xl:col-span-2">
						<div class="w-full xl:max-w-[50%] xl:px-1.5">
							<MusicMobile bind:manual_override />
						</div>
					</div>
				{:else}
					<MusicMobile bind:manual_override />
				{/if}
			</div>
		</Tabs.Content>

		<Tabs.Content value="projects">
			<Card.Root class="grid w-full border-none bg-transparent shadow-none xl:grid-cols-2">
				<Project />
			</Card.Root>
		</Tabs.Content>

		<Tabs.Content value="skills" class="m-0 flex h-full flex-col justify-center gap-6 pb-4">
			<Skill bind:manual_override />
		</Tabs.Content>

		<Tabs.Content value="journey" class="m-0 overflow-visible focus-visible:outline-none">
			<Journey />
		</Tabs.Content>
	</div>
	<ContactCard bind:manual_override />
	<div
		class="mb-6 flex flex-wrap items-center justify-center gap-4 {manual_override
			? 'min-[600px]:hidden'
			: 'md:hidden'}"
	>
		<Lang />
		<ThemeSwitcher />
	</div>
</Tabs.Root>

<style>
	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>
