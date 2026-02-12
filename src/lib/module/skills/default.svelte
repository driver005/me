<script lang="ts">
	import * as Dialog from '$lib/ui/cn/dialog';
	import { Button } from '$lib/ui/cn/button';
	import { Network, Code2, Layout, Database, Terminal, Star, Zap, Search } from 'lucide-svelte';

	const skillTree = {
		name: 'Fullstack Ecosystem',
		categories: [
			{
				name: 'Frontend',
				icon: Layout,
				color: 'text-blue-500',
				skills: [
					{
						name: 'SvelteKit',
						status: 'Core',
						icon: Star,
						colorClass: 'text-blue-500 bg-blue-500/5 border-blue-500'
					},
					{
						name: 'TypeScript',
						status: 'Core',
						icon: Star,
						colorClass: 'text-blue-500 bg-blue-500/5 border-blue-500'
					},
					{
						name: 'Tailwind',
						status: 'Proficient',
						icon: Zap,
						colorClass: 'text-blue-500 bg-blue-500/5 border-blue-500'
					}
				]
			},
			{
				name: 'Backend',
				icon: Database,
				color: 'text-green-500',
				skills: [
					{
						name: 'Node.js',
						status: 'Core',
						icon: Star,
						colorClass: 'text-green-500 bg-green-500/5 border-green-500'
					},
					{
						name: 'PostgreSQL',
						status: 'Proficient',
						icon: Zap,
						colorClass: 'text-green-500 bg-green-500/5 border-green-500'
					},
					{
						name: 'Drizzle',
						status: 'Explorer',
						icon: Search,
						colorClass: 'text-green-500 bg-green-500/5 border-green-500'
					}
				]
			},
			{
				name: 'DevOps',
				icon: Terminal,
				color: 'text-orange-500',
				skills: [
					{
						name: 'Docker',
						status: 'Explorer',
						icon: Search,
						colorClass: 'text-orange-500 bg-orange-500/5 border-orange-500'
					},
					{
						name: 'CI/CD',
						status: 'Proficient',
						icon: Zap,
						colorClass: 'text-orange-500 bg-orange-500/5 border-orange-500'
					}
				]
			}
		]
	};
</script>

<Dialog.Root open>
	<Dialog.Trigger>
		<Button variant="outline" class="gap-2 px-6">
			<Network size={16} /> Open Skill Tree
		</Button>
	</Dialog.Trigger>

	<Dialog.Content
		class="flex h-[85vh] w-[95vw] flex-col overflow-hidden border-primary/20 p-0 shadow-2xl lg:max-w-7xl"
	>
		<div class="flex shrink-0 items-center justify-between border-b bg-background p-5 md:px-10">
			<div class="space-y-1">
				<Dialog.Title class="flex items-center gap-2 text-xl font-bold tracking-tight text-primary">
					<Code2 size={20} />
					Skill Architecture
				</Dialog.Title>
			</div>

			<div
				class="hidden items-center gap-4 rounded-full border border-border/50 bg-secondary/50 px-4 py-2 lg:flex"
			>
				<div class="flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase">
					<Star size={12} /> Core
				</div>
				<div class="flex items-center gap-1.5 text-[10px] font-bold text-blue-500 uppercase">
					<Zap size={12} /> Proficient
				</div>
			</div>
		</div>

		<div
			class="grow overflow-x-hidden overflow-y-auto bg-slate-50/50 p-6 [ms-overflow-style:none] [scrollbar-width:none] lg:p-10 dark:bg-zinc-950 [&::-webkit-scrollbar]:hidden"
		>
			<div class="mx-auto flex w-full flex-col items-center">
				<div class="flex w-full flex-col items-center">
					<div
						class="z-20 rounded-2xl bg-primary px-8 py-3.5 text-base font-bold tracking-widest text-primary-foreground uppercase shadow-xl"
					>
						{skillTree.name}
					</div>

					<div class="hidden h-10 w-0.5 bg-primary/20 lg:block"></div>
				</div>

				<div
					class="relative mt-6 flex w-full flex-col items-start justify-center gap-12 lg:mt-0 lg:max-w-6xl lg:flex-row lg:gap-4 xl:gap-16"
				>
					<div
						class="absolute top-0 hidden h-0.5
                      rounded-full bg-primary/10
                      transition-all duration-300
                      lg:right-[16%] lg:left-[16%] lg:block xl:right-[14.75%] xl:left-[14.75%]"
					></div>

					{#each skillTree.categories as category}
						<div class="flex w-full shrink flex-col items-center lg:flex-1">
							<div class="hidden h-10 w-0.5 bg-primary/10 lg:block"></div>

							<div
								class="z-10 mb-6 flex w-full items-center gap-4 rounded-2xl border-2 border-black bg-background p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-700 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none lg:mb-8 lg:flex-col lg:gap-0 lg:p-6"
							>
								<div
									class={`flex h-10 w-10 items-center justify-center rounded-xl bg-secondary lg:h-12 lg:w-12 ${category.color} shrink-0`}
								>
									<svelte:component this={category.icon} size={24} />
								</div>
								<h3
									class="text-center text-[10px] font-bold tracking-widest uppercase lg:mt-3 lg:text-xs"
								>
									{category.name}
								</h3>
							</div>

							<div class="grid w-full grid-cols-1 gap-3 px-2 sm:grid-cols-2 lg:grid-cols-1 lg:px-0">
								{#each category.skills as skill}
									<div
										class={`group flex flex-col rounded-xl border-2 p-4 transition-all ${skill.colorClass}  shadow-[4px_4px_0px_0px_currentColor] transition-all duration-700 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none `}
									>
										<div class="flex items-center justify-between">
											<span class="text-xs font-bold tracking-tight text-foreground lg:text-sm"
												>{skill.name}</span
											>
											<svelte:component this={skill.icon} size={14} class="opacity-70" />
										</div>
										<span class="mt-1 text-[9px] font-black tracking-tighter uppercase opacity-50"
											>{skill.status}</span
										>
									</div>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
