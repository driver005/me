<script lang="ts">
	import * as Dialog from '$lib/ui/cn/dialog';
	import { TriangleAlert, ShieldCheck, ShieldOff, RefreshCw, Eye, EyeOff } from 'lucide-svelte';
	import { Button } from '$lib/ui/cn/button';
	import { m } from '$lib/paraglide/messages';
	import { getContext } from 'svelte';
	import { PASSWORD } from '$lib/const';

	let open = $state(false);
	let password = $state('');
	let showPassword = $state(false);
	let error = $state(false);
	const friendly = getContext<{ value: boolean }>('friendly');

	$effect(() => {
		if (!open) {
			password = '';
			error = false;
			showPassword = false;
		}
	});

	function handleSubmit(e: any) {
		e.preventDefault();
		if (!friendly.value) {
			friendly.value = true;
			open = false;
		} else {
			if (password === PASSWORD) {
				friendly.value = false;
				open = false;
			} else {
				error = true;
				password = '';
			}
		}
	}
</script>

<Dialog.Root bind:open>
	<Button
		variant="outline"
		onclick={() => (open = true)}
		class="h-12 rounded-xl border-4 border-black px-6 font-black uppercase transition-all 
    {friendly.value
			? 'bg-yellow-400 shadow-[4px_4px_0px_0px_#000] hover:bg-yellow-400 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none dark:bg-yellow-400 dark:hover:bg-yellow-400'
			: 'cursor-default bg-zinc-400 text-zinc-800 italic line-through decoration-black decoration-2 shadow-none hover:bg-zinc-400 dark:bg-zinc-400 dark:hover:bg-zinc-400'}"
	>
		{#if friendly.value}
			<ShieldCheck />
		{:else}
			<ShieldOff />
		{/if}
	</Button>

	<Dialog.Content
		class="max-w-md overflow-hidden rounded-xl border-4 border-black bg-background p-0 shadow-[8px_8px_0px_0px_#000]"
	>
		<div
			class="{friendly.value
				? 'bg-red-500'
				: 'bg-green-500'} border-b-4 border-black p-6 text-black"
		>
			<div class="flex items-center gap-3">
				{#if friendly.value}
					<TriangleAlert size={32} strokeWidth={3} />
				{:else}
					<RefreshCw size={32} strokeWidth={3} />
				{/if}
				<Dialog.Title class="text-3xl font-black tracking-tighter uppercase italic">
					{friendly.value ? m['friendlymode.title_rougue']() : m['friendlymode.title_friendly']()}
				</Dialog.Title>
			</div>
		</div>

		<div class="bg-background p-6">
			<Dialog.Description class="text-lg leading-tight font-bold text-foreground">
				{#if friendly.value}
					{m['friendlymode.help']()}
					<span class="underline decoration-red-500 decoration-4">{m['friendlymode.name']()}</span>.
				{:else}
					{m['friendlymode.help']()}
					<span class="underline decoration-green-500 decoration-4">{m['friendlymode.name']()}</span
					>.
				{/if}
			</Dialog.Description>

			<div class="mt-8 space-y-3">
				{#if friendly.value}
					<div class="relative">
						<input
							type={showPassword ? 'text' : 'password'}
							bind:value={password}
							placeholder={m['friendlymode.field']()}
							onkeydown={(e) => e.key === 'Enter' && handleSubmit(e)}
							oninput={() => (error = false)}
							class="h-14 w-full rounded-xl border-4 border-black bg-muted/40 px-4 pr-14 font-bold text-foreground placeholder:font-normal placeholder:text-muted-foreground focus:ring-4 focus:ring-black focus:outline-none
								{error ? 'border-red-500 bg-red-50 focus:ring-red-500' : ''}"
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
				{/if}

				<Button
					onclick={handleSubmit}
					class="h-14 w-full rounded-xl border-4 border-black font-black tracking-widest uppercase shadow-[4px_4px_0px_0px_#000] transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none
						{friendly.value
						? 'bg-red-500 text-black hover:bg-red-500'
						: 'bg-green-500 text-black hover:bg-green-500'}"
				>
					{friendly.value ? m['friendlymode.enabled']() : m['friendlymode.disabled']()}
				</Button>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
