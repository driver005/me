<Tabs.Content value="journey" class="m-0 focus-visible:outline-none">
	<Card.Root class="rounded-[2.5rem] border-none bg-card/40 p-8 shadow-sm backdrop-blur-sm">
		<div class="mb-8 flex items-center gap-3">
			<History size={20} class="text-violet-500" />
			<h3 class="text-xl font-black tracking-tight uppercase">Career Evolution</h3>
			<div class="h-px flex-1 bg-gradient-to-r from-muted to-transparent"></div>
		</div>
		<div
			class="relative ml-4 space-y-12 border-l-2 border-dashed border-muted-foreground/20 py-4 pl-10"
		>
			{#each portfolioData.milestones as item}
				<div class="group relative">
					<div class="absolute top-0 -left-[53px] flex h-6 w-6 items-center justify-center">
						<div class="absolute h-5 w-5 rounded-full {item.color} animate-ping opacity-30"></div>
						<div
							class="relative h-3 w-3 rounded-full {item.color} shadow-lg ring-4 ring-background transition-transform group-hover:scale-125"
						></div>
					</div>
					<div class="flex flex-col gap-6 md:flex-row md:items-center">
						<img
							src={item.img}
							alt=""
							class="h-20 w-20 rounded-2xl object-cover shadow-2xl transition-all group-hover:scale-110 group-hover:rotate-3"
						/>
						<div class="space-y-1">
							<span class="text-[10px] font-black tracking-[0.2em] text-violet-500 uppercase"
								>{item.date}</span
							>
							<h4 class="text-2xl font-black tracking-tight uppercase">{item.title}</h4>
							<p class="max-w-md text-sm font-medium text-muted-foreground">
								{item.desc}
							</p>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</Card.Root>
</Tabs.Content>
