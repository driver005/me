<script lang="ts">
	import * as Dialog from '$lib/ui/cn/dialog';
	import * as Card from '$lib/ui/cn/card';
	import { AspectRatio } from '$lib/ui/cn/aspect-ratio';
	import { GraduationCap, Briefcase, MapPin } from 'lucide-svelte';

	const milestones = [
		{
			date: '2018 — 2022',
			title: 'University of Technology',
			location: 'San Francisco, CA',
			desc: 'B.S. in Computer Science • Cum Laude. Specialized in interface logic.',
			icon: GraduationCap,
			img: 'https://images.unsplash.com/photo-1523050853064-80d8390602a0?auto=format&fit=crop&w=600&q=80'
		},
		{
			date: '2022 — 2024',
			title: 'Junior Dev @ InnovateCorp',
			location: 'Remote',
			desc: 'Architected internal dashboards and design systems using SvelteKit.',
			icon: Briefcase,
			img: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80'
		}
	];
</script>

<Dialog.Root open>
	<Dialog.Content
		class="scrollbar-hide max-h-[90vh] w-[95vw] overflow-y-auto p-4 [ms-overflow-style:none] [scrollbar-width:none] sm:max-w-2xl sm:p-6 [&::-webkit-scrollbar]:hidden"
	>
		<Dialog.Header class="text-left">
			<Dialog.Title class="text-2xl font-bold tracking-tighter sm:text-3xl">My Journey</Dialog.Title
			>
			<Dialog.Description class="text-sm">
				A detailed timeline of my professional and academic path.
			</Dialog.Description>
		</Dialog.Header>

		<div class="relative mt-8 ml-3 space-y-10 border-l-2 border-muted pb-6 pl-6 sm:ml-4 sm:pl-8">
			{#each milestones as item}
				<div class="relative">
					<div
						class="absolute top-0 -left-9.75 z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 border-primary bg-background shadow-sm sm:-left-11.25 sm:h-8 sm:w-8"
					>
						<svelte:component this={item.icon} size={12} class="text-primary sm:w-3.5" />
					</div>

					<div class="space-y-3">
						<div
							class="flex flex-col gap-1 text-[10px] font-bold tracking-widest text-primary uppercase sm:flex-row sm:items-center sm:gap-4"
						>
							<span>{item.date}</span>
							<span class="hidden h-1 w-1 rounded-full bg-muted-foreground/30 sm:inline-block"
							></span>
							<span class="flex items-center gap-1 font-medium text-muted-foreground normal-case">
								<MapPin size={10} />
								{item.location}
							</span>
						</div>

						<Card.Root class="overflow-hidden border-none bg-secondary/30 shadow-none">
							<div class="flex flex-col">
								<div class="w-full">
									<AspectRatio ratio={16 / 9}>
										<img
											src={item.img}
											alt={item.title}
											class="h-full w-full object-cover grayscale transition-all duration-500 hover:grayscale-0"
										/>
									</AspectRatio>
								</div>

								<div class="p-4 sm:p-5">
									<Card.Title class="text-lg leading-tight sm:text-xl">{item.title}</Card.Title>
									<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
										{item.desc}
									</p>
								</div>
							</div>
						</Card.Root>
					</div>
				</div>
			{/each}
		</div>
	</Dialog.Content>
</Dialog.Root>
