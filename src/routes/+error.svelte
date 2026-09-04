<script lang="ts">
	import { page } from '$app/state';
	import { m } from '$lib/paraglide/messages';
</script>

<div class="grain min-h-screen flex flex-col items-center justify-center gap-8 bg-[#F3F2EE] text-[#0A0A0A] px-4 text-center">
	<img src={m['assets.mascot_dizzy']()} alt="" class="w-36 sm:w-44" />

	<div>
		<span class="font-mono text-xs uppercase tracking-[0.3em] text-[#555]">{page.status}</span>
		<h1 class="font-display uppercase text-6xl sm:text-8xl leading-[0.9] tracking-tighter mt-2">
			{m['error.title']()}
		</h1>
	</div>

	<p class="font-mono text-sm sm:text-base text-[#555] max-w-md">
		{page.error?.message || m['error.description']()}
	</p>

	<a
		href="/"
		class="font-mono text-xs uppercase tracking-[0.25em] px-6 py-3 bg-[#0A0A0A] text-[#F3F2EE] hover:bg-[#FF3B00] transition-colors duration-500 ease-[var(--ease-out-expo)]"
	>
		{m['error.link']()}
	</a>
</div>
