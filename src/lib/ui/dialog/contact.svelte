<script lang="ts">
	import { UserSearchIcon } from 'lucide-svelte';
	import * as Dialog from '$lib/ui/cn/dialog';
	import { m } from '$lib/paraglide/messages';
	import { Button } from '$lib/ui/cn/button';
	import { dock } from '$lib/data';

	let open = $state(false);
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger>
		<Button
			variant="outline"
			onclick={() => (open = true)}
			class="h-12 rounded-xl border-4 border-black bg-orange-400 brutal-shadow transition-transform transition-shadow duration-500 ease-[var(--ease-out-expo)] hover:bg-orange-400 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none dark:bg-orange-400 dark:hover:bg-orange-400"
		>
			<UserSearchIcon class="h-6 w-6 text-black" />
		</Button>
	</Dialog.Trigger>
	<Dialog.Content
		class="rounded-xl border-4 border-black bg-background p-6 brutal-shadow sm:max-w-106.25"
	>
		<Dialog.Header>
			<Dialog.Title class="text-2xl font-black tracking-tighter uppercase">
				{m['contact.title']()}
			</Dialog.Title>
			<Dialog.Description class="font-bold text-black/60 dark:text-white/60">
				{m['contact.description']()}
			</Dialog.Description>
		</Dialog.Header>
		<div class="grid grid-cols-2 gap-4 py-4">
			{#each dock.contact as link, i}
				<a
					href={link.href}
					target="_blank"
					rel="noopener noreferrer"
					onclick={() => (open = false)}
					class="hover:shadow-none flex items-center gap-3 rounded-xl border-4 border-black p-3 font-black brutal-shadow transition-transform transition-shadow duration-500 ease-[var(--ease-out-expo)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none {link.color}"
					style:opacity="0"
					style:animation="dialogItemIn 0.3s {i * 50}ms var(--ease-out-expo) forwards"
				>
					<link.icon class="h-5 w-5 shrink-0 text-black" />
					<span class="truncate text-black uppercase">{link.label}</span>
				</a>
			{/each}
		</div>
	</Dialog.Content>
</Dialog.Root>

<style>
	@keyframes dialogItemIn {
		from {
			opacity: 0;
			transform: translateY(8px) scale(0.96);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}
</style>
