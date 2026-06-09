<script lang="ts">
	import * as Card from '$lib/ui/cn/card';
	import { m } from '$lib/paraglide/messages';
	import { music } from '$lib/data';
	import { getLocale, localizeHref } from '$lib/paraglide/runtime.js';
	import { getContext } from 'svelte';
	import { Eye, EyeOff, TriangleAlert } from 'lucide-svelte';
	import { PASSWORD } from '$lib/const';

	let { manual_override = $bindable() }: { manual_override: boolean } = $props();
	const friendly = getContext<{ value: boolean }>('friendly');

	let password = $state('');
	let showPassword = $state(false);
	let error = $state(false);

	function handleSubmit(e: any) {
		e.preventDefault();
		if (password === PASSWORD) {
			friendly.value = false;
			password = '';
			error = false;
		} else {
			error = true;
			password = '';
		}
	}
</script>

{#if !friendly.value}
	<a
		href={localizeHref('/music', { locale: getLocale() })}
		class="group block no-underline {!manual_override && 'md:hidden'}"
	>
		<Card.Root
			class="relative overflow-hidden rounded-xl border-4 border-black bg-background brutal-shadow transition-all group-hover:translate-x-0.5 group-hover:translate-y-0.5 group-hover:shadow-none"
		>
			<div
				class="absolute top-0 left-6 flex h-6 w-24 items-center justify-center rounded-b-md bg-black"
			>
				<span
					class="flex items-center gap-1.5 text-[10px] font-black tracking-tighter text-white uppercase"
				>
					<span class="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500"></span>
					{m['music_mobile.top_lable']()}
				</span>
			</div>
			<Card.Header class="pt-10 pb-4">
				<div class="flex items-start justify-between">
					<div>
						<Card.Title
							class="text-4xl leading-none font-black tracking-tighter text-black uppercase italic dark:text-white"
						>
							{m['music_mobile.title']()}
						</Card.Title>
						<Card.Description
							class="mt-2 font-bold text-black uppercase italic opacity-70 dark:text-white"
						>
							{m['music_mobile.description']()}
						</Card.Description>
					</div>
				</div>
			</Card.Header>
			<Card.Content>
				<div
					class="flex flex-wrap items-center justify-around rounded-lg border-2 border-black bg-white/40 p-4 dark:bg-yellow-400 dark:text-black"
				>
					<div class="text-center">
						<p class="text-[10px] font-black uppercase opacity-60">
							{m['music_mobile.music']()}
						</p>
						<p class="text-2xl font-black">{music.length}</p>
					</div>
					<div class="text-center">
						<p class="text-[10px] font-black uppercase opacity-60">
							{m['music_mobile.update']()}
						</p>
						<p class="text-2xl font-black">
							{m['music_mobile.update_time']()}
						</p>
					</div>
				</div>
			</Card.Content>
			<Card.Footer class="flex items-center justify-between bg-black px-6 py-3 text-yellow-400">
				<span class="text-xs font-black tracking-[0.2em] uppercase">
					{m['music_mobile.vault']()}
				</span>
				<span class="text-2xl transition-transform group-hover:translate-x-2">→</span>
			</Card.Footer>
			<div class="absolute right-4 bottom-16 flex h-10 items-end gap-1 opacity-20">
				{#each [40, 70, 45, 90, 65, 80, 30, 50] as height}
					<div class="w-1.5 bg-black" style="height: {height}%"></div>
				{/each}
			</div>
		</Card.Root>
	</a>
{:else}
	<div class={!manual_override ? 'md:hidden' : ''}>
		<Card.Root
			class="relative overflow-hidden rounded-xl border-4 border-black bg-background brutal-shadow"
		>
			<div
				class="absolute top-0 left-6 flex h-6 w-24 items-center justify-center rounded-b-md bg-black"
			>
				<span
					class="flex items-center gap-1.5 text-[10px] font-black tracking-tighter text-white uppercase"
				>
					<span class="h-1.5 w-1.5 animate-pulse rounded-full bg-yellow-400"></span>
					{m['friendlymode.locked']()}
				</span>
			</div>
			<Card.Header class="pt-10 pb-4">
				<Card.Title
					class="text-4xl leading-none font-black tracking-tighter text-black uppercase dark:text-white"
				>
					🔒 {m['music_mobile.title']()}
				</Card.Title>
				<Card.Description
					class="mt-2 font-bold text-black uppercase italic opacity-70 dark:text-white"
				>
					{#if friendly.value}
						{m['friendlymode.help']()}
						<span class="underline decoration-red-500 decoration-4">{m['friendlymode.name']()}</span
						>.
					{:else}
						{m['friendlymode.help']()}
						<span class="underline decoration-green-500 decoration-4"
							>{m['friendlymode.name']()}</span
						>.
					{/if}
				</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-3">
				<div class="relative">
					<input
						type={showPassword ? 'text' : 'password'}
						bind:value={password}
						placeholder={m['friendlymode.field']()}
						onkeydown={(e) => e.key === 'Enter' && handleSubmit(e)}
						oninput={() => (error = false)}
						class="h-14 w-full rounded-xl border-4 border-black bg-muted/40 px-4 pr-14 font-bold text-foreground placeholder:font-normal placeholder:text-muted-foreground focus:ring-4 focus:ring-black focus:outline-none
							{error ? 'border-red-500 bg-red-50 focus:ring-red-500 dark:bg-red-800' : ''}"
					/>
					<button
						type="button"
						onclick={() => (showPassword = !showPassword)}
						class="absolute top-1/2 right-3 -translate-y-1/2 rounded-lg p-1 hover:bg-muted"
					>
						{#if showPassword}
							<EyeOff size={20} class="text-muted-foreground" />
						{:else}
							<Eye size={20} class="text-muted-foreground" />
						{/if}
					</button>
				</div>
				{#if error}
					<p class="flex items-center gap-2 font-bold text-red-500">
						<TriangleAlert size={16} strokeWidth={3} />
						{m['friendlymode.wrong']()}
					</p>
				{/if}
			</Card.Content>
		</Card.Root>
	</div>
{/if}
