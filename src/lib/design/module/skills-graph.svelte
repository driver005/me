<script lang="ts">
	import { skill_tree } from '$lib/data';
	import { onMount } from 'svelte';

	let visible = $state(false);
	let containerRef = $state<HTMLElement | null>(null);

	onMount(() => {
		if (!containerRef) return;
		const obs = new IntersectionObserver(
			([e]) => { if (e.isIntersecting) { visible = true; obs.disconnect(); } },
			{ threshold: 0.1 }
		);
		obs.observe(containerRef);
		return () => obs.disconnect();
	});
</script>

<section id="skills-graph" class="relative bg-[#0A0A0A] text-[#F3F2EE] py-20 sm:py-32" bind:this={containerRef}>
	<div class="px-4 sm:px-8 max-w-7xl mx-auto">
		<h2 class="font-display uppercase text-[10vw] sm:text-[8vw] leading-[0.85] tracking-tighter mb-16 sm:mb-24">
			{skill_tree.name}
		</h2>

		<div class="grid grid-cols-1 md:grid-cols-3 gap-12 sm:gap-16">
			{#each skill_tree.categories as cat, ci}
				<div
					class="space-y-6"
					style:opacity={visible ? 1 : 0}
					style:transform={visible ? 'translateY(0)' : 'translateY(40px)'}
					style:transition={visible ? `opacity 0.6s ${ci * 0.15}s var(--ease-out-expo), transform 0.6s ${ci * 0.15}s var(--ease-out-expo)` : 'none'}
				>
					<div class="flex items-center gap-3 mb-8">
						<cat.icon size={20} class={cat.color} />
						<h3 class="font-mono text-xs uppercase tracking-[0.25em] {cat.color}">{cat.name}</h3>
					</div>

					{#each cat.skills as skill, si}
						<div
							class="border border-[#F3F2EE]/10 p-4 hover:border-[#FF3B00]/40 transition-colors duration-300"
							style:opacity={visible ? 1 : 0}
							style:transform={visible ? 'translateX(0)' : 'translateX(-20px)'}
							style:transition={visible ? `opacity 0.4s ${(ci * 0.15) + (si * 0.06)}s var(--ease-out-expo), transform 0.4s ${(ci * 0.15) + (si * 0.06)}s var(--ease-out-expo)` : 'none'}
						>
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-3">
									<skill.icon size={16} class={skill.colorClass.split(' ')[0]} />
									<span class="font-mono text-sm">{skill.name}</span>
								</div>
								<span class="font-mono text-[10px] uppercase tracking-wider opacity-50">{skill.status}</span>
							</div>
						</div>
					{/each}
				</div>
			{/each}
		</div>
	</div>
</section>
