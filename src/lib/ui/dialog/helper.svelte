<script lang="ts">
	import * as Dialog from '$lib/ui/cn/dialog';
	import { Button } from '$lib/ui/cn/button';
	import { CircleQuestionMark, MousePointer2, Keyboard } from 'lucide-svelte';
	import { m } from '$lib/paraglide/messages';
	import { shortcuts } from '$lib/data';

	let open = $state(false);

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) {
			e.preventDefault();
			open = !open;
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<Dialog.Root bind:open>
	<Dialog.Trigger>
		<Button
			variant="outline"
			onclick={() => (open = true)}
			class="h-12 rounded-xl border-4 border-black bg-violet-500 brutal-shadow transition-all hover:bg-violet-500 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none dark:bg-violet-500 dark:hover:bg-violet-500"
		>
			<CircleQuestionMark class="h-6 w-6 text-black dark:text-white" />
		</Button>
	</Dialog.Trigger>

	<Dialog.Content
		class="rounded-xl border-4 border-black bg-background p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:max-w-100"
	>
		<Dialog.Header>
			<Dialog.Title
				class="text-2xl font-black tracking-tighter text-black uppercase italic dark:text-white"
			>
				{m['help.title']()}
			</Dialog.Title>
			<Dialog.Description
				class="font-bold text-black underline decoration-2 opacity-100 dark:text-white"
			>
				{m['help.catchline']()}
			</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-6">
			<section>
				<div
					class="mb-3 flex w-fit items-center gap-2 rounded-xl border-2 border-black bg-orange-400 p-1 px-2 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
				>
					<MousePointer2 size={16} strokeWidth={3} />
					<h4 class="text-xs font-black uppercase">{m['help.header_nav']()}</h4>
				</div>

				<ul class="space-y-3">
					<li class="flex items-start gap-3">
						<span
							class="mt-1 h-3 w-3 shrink-0 border-2 border-black bg-violet-300 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
						></span>
						<p class="text-sm leading-tight font-bold">{m['help.nav.wheel']()}</p>
					</li>
					<li class="flex items-start gap-3">
						<span
							class="mt-1 h-3 w-3 shrink-0 border-2 border-black bg-purple-300 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
						></span>
						<p class="text-sm leading-tight font-bold">{m['help.nav.mouse']()}</p>
					</li>
					<li class="flex items-start gap-3">
						<span
							class="mt-1 h-3 w-3 shrink-0 border-2 border-black bg-yellow-300 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
						></span>
						<p class="text-sm leading-tight font-bold">{m['help.nav.home']()}</p>
					</li>

					<li class="flex items-start gap-3">
						<span
							class="mt-1 h-3 w-3 shrink-0 border-2 border-black bg-lime-400 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
						></span>
						<p class="text-sm leading-tight font-bold">{m['help.nav.music']()}</p>
					</li>

					<li class="flex items-start gap-3">
						<span
							class="mt-1 h-3 w-3 shrink-0 border-2 border-black bg-cyan-400 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
						></span>
						<p class="text-sm leading-tight font-bold">{m['help.nav.skills']()}</p>
					</li>

					<li class="flex items-start gap-3">
						<span
							class="mt-1 h-3 w-3 shrink-0 border-2 border-black bg-purple-400 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
						></span>
						<p class="text-sm leading-tight font-bold">{m['help.nav.close']()}</p>
					</li>
				</ul>
			</section>
			<section>
				<div
					class="mb-3 flex w-fit items-center gap-2 rounded-xl border-2 border-black bg-indigo-400 p-1 px-2 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
				>
					<Keyboard size={16} strokeWidth={3} />
					<h4 class="text-xs font-black uppercase">{m['help.header_key']()}</h4>
				</div>

				<div class="grid gap-2">
					{#each shortcuts as { label, keys }}
						<div
							class="flex items-center justify-between border-b-2 border-black pb-1 last:border-0"
						>
							<span class="text-sm font-bold">{label}</span>
							<div class="flex gap-1">
								{#each keys as key}
									<kbd
										class="flex h-6 min-w-6 items-center justify-center rounded-xl border-2 border-black bg-background px-1.5 font-mono text-[10px] font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
									>
										{key}
									</kbd>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			</section>
		</div>
	</Dialog.Content>
</Dialog.Root>
