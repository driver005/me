<script lang="ts">
	import { browser } from '$app/environment';
	import { useBerlinTime } from '$lib/util/berlin-time.svelte';
	import { m } from '$lib/paraglide/messages';

	const GITHUB_USER = 'driver005';

	const clock = useBerlinTime();

	let repos = $state<number | null>(null);
	let followers = $state<number | null>(null);
	let sinceYear = $state<number | null>(null);

	$effect(() => {
		if (!browser) return;
		fetch(`https://api.github.com/users/${GITHUB_USER}`)
			.then((res) => (res.ok ? res.json() : null))
			.then((user) => {
				if (!user) return;
				repos = user.public_repos ?? null;
				followers = user.followers ?? null;
				sinceYear = user.created_at ? new Date(user.created_at).getFullYear() : null;
			})
			.catch(() => {});
	});
</script>

<div
	data-testid="status-strip-section"
	class="relative grid grid-cols-2 sm:grid-cols-4 border-b border-black bg-[#0A0A0A] text-[#F3F2EE]"
>
	<div class="border-r border-b sm:border-b-0 border-[#F3F2EE]/15 px-4 sm:px-8 py-5">
		<span class="font-mono text-[10px] uppercase tracking-[0.25em] text-[#F3F2EE]/50">{m['status_strip.local_time']()}</span>
		<div class="font-display text-2xl sm:text-3xl mt-1 tabular-nums">{clock.value || '--:--:--'}</div>
	</div>
	<div class="border-b sm:border-b-0 sm:border-r border-[#F3F2EE]/15 px-4 sm:px-8 py-5">
		<span class="font-mono text-[10px] uppercase tracking-[0.25em] text-[#F3F2EE]/50">{m['status_strip.repos']()}</span>
		<div class="font-display text-2xl sm:text-3xl mt-1 tabular-nums">{repos ?? '—'}</div>
	</div>
	<div class="border-r border-[#F3F2EE]/15 px-4 sm:px-8 py-5">
		<span class="font-mono text-[10px] uppercase tracking-[0.25em] text-[#F3F2EE]/50">{m['status_strip.followers']()}</span>
		<div class="font-display text-2xl sm:text-3xl mt-1 tabular-nums">{followers ?? '—'}</div>
	</div>
	<div class="px-4 sm:px-8 py-5">
		<span class="font-mono text-[10px] uppercase tracking-[0.25em] text-[#F3F2EE]/50">{m['status_strip.since']()}</span>
		<div class="font-display text-2xl sm:text-3xl mt-1 tabular-nums text-[#FF3B00]">{sinceYear ?? '—'}</div>
	</div>
</div>
