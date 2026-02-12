<script lang="ts">
	import * as Card from '$lib/ui/cn/card';
	import { User, Briefcase, Zap } from 'lucide-svelte';
	import type { PROFILE } from '$lib/types/ui';

	let { profile }: { profile: PROFILE } = $props();
</script>

<div class="relative z-10 flex h-full w-full flex-col rounded-[14px] bg-white p-6 dark:bg-zinc-950">
	<Card.Header class="mb-6 flex flex-row items-start justify-between p-0">
		<div class="space-y-1">
			<Card.Title
				class="flex items-center gap-3 text-xl font-black tracking-tighter text-black uppercase italic"
			>
				<div
					class="rounded-xl border-2 border-black bg-yellow-400 p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
				>
					<User size={24} strokeWidth={3} />
				</div>
				Story
			</Card.Title>
		</div>
	</Card.Header>

	<Card.Content class="flex flex-1 flex-col justify-between space-y-8 p-0">
		<p class="text-md leading-tight font-bold text-black">
			{profile.story}
		</p>

		<div class="grid gap-4">
			<div
				class="flex flex-col items-center justify-between gap-3 rounded-xl border-2 border-black bg-cyan-400 px-4 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:bg-cyan-300 sm:flex-row"
			>
				<div class="flex items-center gap-3">
					<Briefcase size={20} strokeWidth={3} class="text-black" />
					<span class="text-xs font-black tracking-[0.2em] text-black uppercase">Status</span>
				</div>
				<span class="text-xs font-black text-black underline decoration-2 underline-offset-4">
					{profile.status}
				</span>
			</div>

			<div
				class="flex flex-col items-center justify-between rounded-xl border-2 border-black bg-lime-400 px-4 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:bg-lime-300 sm:flex-row"
			>
				<div class="flex items-center gap-3">
					<Zap size={20} strokeWidth={3} class="text-black" />
					<span class="text-xs font-black tracking-[0.2em] text-black uppercase">Focus</span>
				</div>
				<span class="text-xs font-black text-black underline decoration-2 underline-offset-4">
					{profile.focus}
				</span>
			</div>
		</div>
	</Card.Content>
</div>
