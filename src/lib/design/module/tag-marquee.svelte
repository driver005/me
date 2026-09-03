<script lang="ts">
	import { skills } from '$lib/data';
	import { MarqueeStrip, Section } from '$lib/design/shared';

	const names = skills.map((s) => s.name);
	const SIZE = 'text-4xl sm:text-6xl lg:text-7xl';
</script>

<Section dark testid="tag-marquee-section" class="overflow-hidden py-10 sm:py-16">
	<MarqueeStrip
		items={names.map((n) => ({ text: n }))}
		dark
		accent="#FF3B00"
		accentEvery={4}
		duration={38}
		sizeClass={SIZE}
		separatorSizeClass={SIZE}
		border={false}
		spacing={false}
	/>
	<MarqueeStrip
		items={[...names].reverse().map((n) => ({ text: n }))}
		dark
		outline
		accent="#FF3B00"
		accentEvery={5}
		duration={34}
		reverse
		sizeClass={SIZE}
		separatorSizeClass={SIZE}
		border={false}
		spacing={false}
		class="mt-4 sm:mt-6"
	/>
</Section>
