<script lang="ts">
	import { skills } from '$lib/data';
	import Marquee from './marquee.svelte';

	const names = skills.map((s) => s.name);
</script>

<section
	data-testid="tag-marquee-section"
	class="relative bg-[#0A0A0A] text-[#F3F2EE] border-b border-black py-10 sm:py-16 overflow-hidden"
>
	<Marquee class="[--duration:38s]">
		{#each names as name, i}
			<span class="flex items-center gap-6 sm:gap-10">
				<span
					class="font-display uppercase text-4xl sm:text-6xl lg:text-7xl tracking-tighter whitespace-nowrap"
					style:color={i % 4 === 0 ? '#FF3B00' : '#F3F2EE'}
				>{name}</span>
				<span class="text-4xl sm:text-6xl lg:text-7xl text-[#F3F2EE]/20">×</span>
			</span>
		{/each}
	</Marquee>
	<Marquee reverse class="[--duration:34s] mt-4 sm:mt-6">
		{#each [...names].reverse() as name, i}
			<span class="flex items-center gap-6 sm:gap-10">
				<span
					class="font-display uppercase text-4xl sm:text-6xl lg:text-7xl tracking-tighter whitespace-nowrap text-stroke"
					style:color={i % 5 === 0 ? '#FF3B00' : 'transparent'}
					style:-webkit-text-stroke={i % 5 === 0 ? 'none' : '1.5px #F3F2EE'}
				>{name}</span>
				<span class="text-4xl sm:text-6xl lg:text-7xl text-[#F3F2EE]/20">×</span>
			</span>
		{/each}
	</Marquee>
</section>
