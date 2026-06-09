<script lang="ts">
	import { browser } from '$app/environment';

	let scrollYProgress = $state(0);

	$effect(() => {
		if (!browser) return;
		const onScroll = () => {
			const scrolled = window.scrollY;
			const max = document.documentElement.scrollHeight - window.innerHeight;
			scrollYProgress = max > 0 ? scrolled / max : 0;
		};
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	});
</script>

<div
	class="fixed top-0 left-0 right-0 h-[3px] bg-[#FF3B00] z-[80] origin-left"
	style="transform: scaleX({scrollYProgress});"
	data-testid="scroll-progress"
></div>
