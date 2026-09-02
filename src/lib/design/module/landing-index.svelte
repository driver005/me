<script lang="ts">
	import { works } from '$lib/data';
	import { m } from '$lib/paraglide/messages';

	const pages = [
		{ href: '/gallery', label: m['nav.gallery']() },
		{ href: '/skills', label: m['skills.title']() },
		{ href: '/works', label: m['nav.work']() },
		{ href: '/services', label: m['nav.services']() },
		{ href: '/about', label: m['nav.about']() },
		{ href: '/faq', label: 'FAQ' },
		{ href: '/activity', label: m['activity.meta']() },
		{ href: '/contact', label: m['nav.contact']() }
	];
</script>

<section class="border-t border-black">
	<div class="grid grid-cols-1 lg:grid-cols-12">
		<!-- Media column: stacked project previews -->
		<div class="order-2 border-t border-black lg:order-1 lg:col-span-5 lg:border-r lg:border-t-0">
			{#each works as w}
				<figure class="border-b border-black">
					<img
						src={w.img}
						alt={w.title}
						loading="lazy"
						decoding="async"
						class="aspect-[548/356] w-full object-cover"
					/>
				</figure>
			{/each}
		</div>

		<!-- Index column: big title list → subpages -->
		<div class="order-1 lg:order-2 lg:col-span-7">
			<p
				class="border-b border-black px-4 py-3 font-mono text-xs tracking-[0.25em] text-[#555] uppercase sm:px-8"
			>
				{m['hero.meta_index']()}
			</p>
			<ul>
				{#each pages as p, i}
					<li class="border-b border-black">
						<a
							href={p.href}
							data-cursor="hover"
							class="group flex items-baseline justify-between gap-4 px-4 py-4 no-underline transition-colors duration-300 hover:bg-[#0A0A0A] hover:text-[#F3F2EE] sm:px-8 sm:py-5"
						>
							<span class="flex items-baseline gap-4 sm:gap-6">
								<span class="font-mono text-xs opacity-40"
									>({String(i + 1).padStart(2, '0')})</span
								>
								<span
									class="font-display text-3xl leading-none tracking-tighter uppercase sm:text-4xl lg:text-5xl"
									>{p.label}</span
								>
							</span>
							<span
								class="font-mono text-lg opacity-40 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1"
								>↗</span
							>
						</a>
					</li>
				{/each}
			</ul>
		</div>
	</div>
</section>
