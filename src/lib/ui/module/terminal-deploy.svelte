<script lang="ts">
	import { browser } from '$app/environment';
	import gsap from 'gsap';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';
	import { m } from '$lib/paraglide/messages';

	const LINES = [
		{ text: '$ git commit -m "ship it"', color: '#F3F2EE' },
		{ text: '$ npm run build', color: '#F3F2EE' },
		{ text: '✓ built in 47s', color: '#22c55e' },
		{ text: '$ vercel --prod', color: '#F3F2EE' },
		{ text: '✓ live at a42n.com', color: '#FF3B00' }
	];

	const prefersReduced =
		typeof window !== 'undefined'
			? window.matchMedia('(prefers-reduced-motion: reduce)').matches
			: false;

	let sectionRef: HTMLElement | null = $state(null);
	let lineRefs: (HTMLElement | null)[] = [];

	$effect(() => {
		if (!browser || !sectionRef || prefersReduced) return;

		const ctx = gsap.context(() => {
			const tl = gsap.timeline({
				scrollTrigger: {
					trigger: sectionRef,
					start: 'top top',
					end: '+=250%',
					scrub: 1,
					pin: true
				}
			});

			lineRefs.forEach((el, i) => {
				if (!el) return;
				tl.fromTo(
					el,
					{ clipPath: 'inset(0 100% 0 0)' },
					{ clipPath: 'inset(0 0% 0 0)', duration: 1, ease: 'none' },
					i
				);
			});
		}, sectionRef);

		return () => ctx.revert();
	});
</script>

{#if prefersReduced}
	<section
		data-testid="terminal-deploy-section"
		class="relative flex items-center justify-center border-b border-black bg-[#0A0A0A] px-4 py-24"
	>
		<div class="w-full max-w-xl border border-[#F3F2EE]/20 bg-[#050505]">
			<div class="flex items-center gap-1.5 border-b border-[#F3F2EE]/15 px-4 py-2.5">
				<span class="h-2.5 w-2.5 rounded-full bg-[#F3F2EE]/20"></span>
				<span class="h-2.5 w-2.5 rounded-full bg-[#F3F2EE]/20"></span>
				<span class="h-2.5 w-2.5 rounded-full bg-[#F3F2EE]/20"></span>
			</div>
			<div class="p-5 font-mono text-sm leading-loose sm:p-7 sm:text-base">
				{#each LINES as line}
					<div style:color={line.color}>{line.text}</div>
				{/each}
			</div>
		</div>
	</section>
{:else}
	<section
		bind:this={sectionRef}
		data-testid="terminal-deploy-section"
		class="relative flex h-screen items-center justify-center overflow-hidden border-b border-black bg-[#0A0A0A]"
	>
		<span
			class="absolute top-6 left-1/2 z-10 -translate-x-1/2 font-mono text-[10px] tracking-[0.3em] text-[#F3F2EE]/40 uppercase sm:top-10"
		>
			{m['terminal.deploy']()}
		</span>

		<div class="w-[88vw] max-w-xl border border-[#F3F2EE]/20 bg-[#050505]">
			<div class="flex items-center gap-1.5 border-b border-[#F3F2EE]/15 px-4 py-2.5">
				<span class="h-2.5 w-2.5 rounded-full bg-[#F3F2EE]/20"></span>
				<span class="h-2.5 w-2.5 rounded-full bg-[#F3F2EE]/20"></span>
				<span class="h-2.5 w-2.5 rounded-full bg-[#F3F2EE]/20"></span>
			</div>
			<div class="p-5 font-mono text-sm leading-loose sm:p-7 sm:text-base">
				{#each LINES as line, i}
					<div
						bind:this={lineRefs[i]}
						class="whitespace-nowrap"
						style:color={line.color}
						style="clip-path: inset(0 100% 0 0);"
					>
						{line.text}
					</div>
				{/each}
			</div>
		</div>
	</section>
{/if}
