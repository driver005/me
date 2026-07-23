<script lang="ts">
	import { browser } from '$app/environment';
	import { onScroll } from '$lib/util/scroll-manager.svelte';

	let scrollYProgress = $state(0);

	$effect(() => {
		if (!browser) return;
		const unsub = onScroll((scrollY) => {
			const max = document.documentElement.scrollHeight - window.innerHeight;
			scrollYProgress = max > 0 ? scrollY / max : 0;
		});
		return unsub;
	});
</script>

<div
	class="fixed top-0 left-0 right-0 h-[3px] bg-[#FF3B00] z-[80] origin-left"
	style="transform: scaleX({scrollYProgress}); will-change: transform;"
	data-testid="scroll-progress"
></div>
