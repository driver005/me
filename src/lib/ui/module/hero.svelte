<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { useScrollStretchY } from '$lib/util/scroll-stretch.svelte';

	const HERO_VIDEO =
		'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_170732_8a9ccda6-5cff-4628-b164-059c500a2b41.mp4';

	const stretch = useScrollStretchY({ amount: 0.08 });

	let mx = $state(0);
	let my = $state(0);

	function handleMove(e: MouseEvent) {
		mx = (e.clientX / window.innerWidth - 0.5) * 30;
		my = (e.clientY / window.innerHeight - 0.5) * 20;
	}

	const marqueeItems = [
		{ text: m['hero.marquee_1'](), italic: false, sep: false },
		{ text: '✷', sep: true, italic: false },
		{ text: m['hero.marquee_2'](), italic: false, sep: false },
		{ text: '✷', sep: true, italic: false },
		{ text: m['hero.marquee_3'](), italic: true, sep: false },
		{ text: '✷', sep: true, italic: false },
		{ text: m['hero.marquee_4'](), italic: false, sep: false },
		{ text: '✷', sep: true, italic: false },
		{ text: m['hero.marquee_5'](), italic: true, sep: false },
		{ text: '✷', sep: true, italic: false },
		{ text: m['hero.marquee_6'](), italic: false, sep: false },
		{ text: '✷', sep: true, italic: false },
	];
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<section
	id="top"
	data-testid="hero-section"
	onmousemove={handleMove}
	class="relative min-h-screen border-b border-black overflow-hidden bg-black text-[#E1E0CC]"
>
	<!-- Background video -->
	<video
		src={HERO_VIDEO}
		autoplay
		loop
		muted
		playsinline
		class="absolute inset-0 w-full h-full object-cover z-0"
		style:transform="translate({mx}px, {my}px) scale(1.06)"
		style:transition="transform 0.6s cubic-bezier(0.22,1,0.36,1)"
	></video>

	<!-- Noise overlay — parallax-shifted with video -->
	<div
		class="absolute -inset-12 z-10 noise-overlay opacity-[0.7] mix-blend-overlay pointer-events-none"
		style:transform="translate({mx}px, {my}px)"
		style:transition="transform 0.6s cubic-bezier(0.22,1,0.36,1)"
	></div>

	<!-- Cinematic gradient overlay -->
	<div class="absolute inset-0 z-10 bg-gradient-to-b from-black/30 via-transparent to-black/60 pointer-events-none"></div>

	<!-- Meta strip -->
	<div class="relative z-20 grid grid-cols-12 border-b border-[#E1E0CC]/15">
		<div class="col-span-6 sm:col-span-3 px-4 sm:px-8 py-3 border-r border-[#E1E0CC]/15">
			<span class="font-mono text-[10px] sm:text-xs uppercase tracking-[0.25em] text-[#E1E0CC]/70">
				{m['hero.meta_portfolio']()}
			</span>
		</div>
		<div class="hidden sm:block col-span-3 px-4 sm:px-8 py-3 border-r border-[#E1E0CC]/15">
			<span class="font-mono text-[10px] sm:text-xs uppercase tracking-[0.25em] text-[#E1E0CC]/70">
				{m['hero.meta_index']()}
			</span>
		</div>
		<div class="hidden sm:block col-span-3 px-4 sm:px-8 py-3 border-r border-[#E1E0CC]/15">
			<span class="font-mono text-[10px] sm:text-xs uppercase tracking-[0.25em] text-[#E1E0CC]/70">
				{m['hero.meta_studio']()}
			</span>
		</div>
		<div class="col-span-6 sm:col-span-3 px-4 sm:px-8 py-3 text-right">
			<span class="font-mono text-[10px] sm:text-xs uppercase tracking-[0.25em] text-[#FF3B00]">
				{m['hero.meta_available']()}
			</span>
		</div>
	</div>

	<!-- Hero title block -->
	<div class="relative z-20 px-4 sm:px-8 pt-10 sm:pt-16">
		<div class="flex items-start justify-between gap-6">
			<div data-testid="hero-eyebrow" class="pt-2">
				<span class="font-mono text-xs uppercase tracking-[0.25em] text-[#E1E0CC]/70">
					{m['hero.eyebrow_a']()}<br />
					{m['hero.eyebrow_b']()}<br />
					{m['hero.eyebrow_c']()}
				</span>
				<div class="mt-3 flex items-center gap-2">
					<span class="h-1.5 w-1.5 rounded-full bg-[#22c55e] animate-pulse flex-shrink-0"></span>
					<span class="font-mono text-[10px] uppercase tracking-[0.25em] text-[#22c55e]">
						{m['hero.status']()}
					</span>
				</div>
			</div>
			<span class="font-mono text-xs uppercase tracking-[0.25em] text-[#E1E0CC]/70 pt-2 text-right hidden sm:block">
				{@html m['hero.scroll']()}
			</span>
		</div>

		<h1
			data-testid="hero-title"
			class="font-display text-[18vw] sm:text-[15vw] uppercase leading-[0.82] tracking-[-0.05em] mt-6"
			style:color="#E1E0CC"
		>
			<!-- Line 1: Adrian — outer div clips the slide-up, inner span applies scaleY -->
			<div class="overflow-hidden">
				<div class="slide-up">
					<span class="block" style:transform="scaleY({stretch.value})" style:transform-origin="50% 50%">
						Adrian
					</span>
				</div>
			</div>
			<!-- Line 2: Fernández -->
			<div class="overflow-hidden">
				<div class="slide-up-delay">
					<span
						class="block"
						style:transform="scaleY({stretch.value})"
						style:transform-origin="50% 50%"
						style:-webkit-text-stroke="2px #E1E0CC"
						style:color="transparent"
					>
						Fern<span class="text-[#FF3B00]" style:-webkit-text-stroke="0">á</span>ndez
					</span>
				</div>
			</div>
		</h1>

		<!-- Bio paragraph -->
		<div class="mt-10 sm:mt-14 grid grid-cols-12 gap-4">
			<p
				data-testid="hero-bio"
				class="col-span-12 md:col-span-6 md:col-start-7 font-mono text-base sm:text-lg leading-relaxed"
				style:color="#E1E0CC"
			>
				{@html m['hero.bio']()}
			</p>
		</div>
	</div>

	<!-- Marquee -->
	<div class="relative z-20 mt-16 sm:mt-24 border-t border-b border-[#E1E0CC]/20 py-4 sm:py-6 bg-black/40 backdrop-blur-sm overflow-hidden">
		<div class="marquee-track flex items-center gap-10 sm:gap-16 whitespace-nowrap" style="--gap: 2.5rem;">
			{#each [...marqueeItems, ...marqueeItems] as item}
				<span
					class={[
						'mx-6 sm:mx-10',
						item.sep
							? 'text-[#FF3B00]'
							: item.italic
								? 'font-serif-italic text-6xl sm:text-8xl lowercase tracking-tight text-[#E1E0CC]'
								: 'font-display text-5xl sm:text-7xl uppercase tracking-tighter text-[#E1E0CC]'
					].join(' ')}
				>
					{item.text}
				</span>
			{/each}
		</div>
	</div>
</section>

<style>
	.slide-up {
		animation: slideUp 0.9s cubic-bezier(0.22, 1, 0.36, 1) both;
		display: block;
	}

	.slide-up-delay {
		animation: slideUp 0.9s 0.1s cubic-bezier(0.22, 1, 0.36, 1) both;
		display: block;
	}

	@keyframes slideUp {
		from {
			transform: translateY(110%);
		}
		to {
			transform: translateY(0);
		}
	}

	.marquee-track {
		animation: marquee 25s linear infinite;
	}

	@keyframes marquee {
		from {
			transform: translateX(0);
		}
		to {
			transform: translateX(-50%);
		}
	}
</style>
