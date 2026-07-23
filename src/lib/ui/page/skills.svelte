<script lang="ts">
	import { CodeXml, Star, Zap } from 'lucide-svelte';
	import { skill_tree } from '$lib/data';
	import { m } from '$lib/paraglide/messages';
	import { useIntersectionObserver } from '$lib/util/intersection.svelte';

	const headerObs = useIntersectionObserver({ threshold: 0.1 });
	const rootObs = useIntersectionObserver({ threshold: 0.05 });
</script>

<div class="flex shrink-0 items-center justify-between border-b bg-background p-5 md:px-10">
	<div class="space-y-1">
		<div class="flex items-center gap-2 text-xl font-bold tracking-tight text-primary">
			<CodeXml size={20} />
			{m['skills.title']()}
		</div>
	</div>

	<div
		class="hidden items-center gap-4 rounded-full border-2 border-border/50 bg-secondary/50 px-4 py-2 lg:flex"
	>
		<div class="flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase">
			<Star size={12} />
			{m['skills.core']()}
		</div>
		<div class="flex items-center gap-1.5 text-[10px] font-bold text-blue-500 uppercase">
			<Zap size={12} />
			{m['skills.other']()}
		</div>
	</div>
</div>

<div class="grow overflow-x-hidden overflow-y-auto bg-background p-6 lg:p-10">
	<div class="mx-auto flex w-full flex-col items-center">
		<div
			bind:this={rootObs.element}
			class="flex w-full flex-col items-center"
		>
			<div
				class="z-20 rounded-2xl bg-primary px-8 py-3.5 text-base font-bold tracking-widest text-primary-foreground uppercase shadow-xl"
				style:opacity={rootObs.isIntersecting ? '1' : '0'}
				style:transform={rootObs.isIntersecting ? 'translateY(0) scale(1)' : 'translateY(-16px) scale(0.95)'}
				style:transition="opacity var(--duration-reveal) var(--ease-out-expo), transform var(--duration-reveal) var(--ease-out-expo)"
			>
				{skill_tree.name}
			</div>

			<div class="hidden h-10 w-0.5 bg-primary/20 lg:block"></div>
		</div>

		<div
			class="relative mt-6 flex w-full flex-col items-start justify-center gap-12 lg:mt-0 lg:max-w-6xl lg:flex-row lg:gap-4 xl:gap-16"
		>
			<div
				class="absolute top-0 hidden h-0.5
                      rounded-full bg-primary/10
                      transition-[width] duration-300
                      lg:right-[16%] lg:left-[16%] lg:block xl:right-[14.75%] xl:left-[14.75%]"
			></div>

			{#each skill_tree.categories as category, ci}
				{@const catObs = useIntersectionObserver({ threshold: 0.1 })}
				<div
					bind:this={catObs.element}
					class="flex w-full shrink flex-col items-center lg:flex-1"
					style:opacity={catObs.isIntersecting ? '1' : '0'}
					style:transform={catObs.isIntersecting ? 'translateY(0)' : 'translateY(24px)'}
					style:transition="opacity var(--duration-reveal) var(--ease-out-expo) {ci * 80}ms, transform var(--duration-reveal) var(--ease-out-expo) {ci * 80}ms"
				>
					<div class="hidden h-10 w-0.5 bg-primary/10 lg:block"></div>

				<div
					class="z-10 mb-6 flex w-full items-center gap-4 rounded-2xl border-4 border-black bg-background p-4 brutal-shadow transition-transform transition-shadow transition-colors duration-500 ease-[var(--ease-out-expo)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none lg:mb-8 lg:flex-col lg:gap-0 lg:p-6"
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
						{#each category.skills as skill, si}
						<div
							class={`group flex flex-col rounded-xl border-4 p-4 transition-transform transition-shadow transition-colors ${skill.colorClass}  shadow-[4px_4px_0px_0px_currentColor] duration-500 ease-[var(--ease-out-expo)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none `}
							style:opacity={catObs.isIntersecting ? '1' : '0'}
							style:transform={catObs.isIntersecting ? 'translateY(0)' : 'translateY(12px)'}
							style:transition="opacity var(--duration-reveal) var(--ease-out-expo) {(ci * 80) + (si * 40)}ms, transform var(--duration-reveal) var(--ease-out-expo) {(ci * 80) + (si * 40)}ms"
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
