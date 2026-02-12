<script>
	// Import Lucide Icons for both Navbar and Contact
	import { Home, PencilLine, TvMinimalPlay, Github, Linkedin, Twitter, Mail } from 'lucide-svelte';

	import * as Tooltip from '$lib/ui/cn/tooltip';
	import Separator from '$lib/ui/cn/separator/separator.svelte';
	import Dock from '$lib/ui/module/dock.svelte';
	import DockIcon from '$lib/ui/module/dock-icon.svelte';
	import { useBreakpoint } from '$lib/util/screen.svelte';

	let navs = {
		navbar: [
			{ label: 'Home', icon: Home, href: '#', color: 'bg-violet-400' },
			{ label: 'Blog', icon: PencilLine, href: '#', color: 'bg-yellow-400' },
			{ label: 'Developer', icon: TvMinimalPlay, href: '#', color: 'bg-violet-400' }
		],
		contact: [
			{ label: 'Github', icon: Github, href: '#', color: 'bg-yellow-400' },
			{ label: 'LinkedIn', icon: Linkedin, href: '#', color: 'bg-violet-400' },
			{ label: 'X', icon: Twitter, href: '#', color: 'bg-yellow-400' },
			{ label: 'Email', icon: Mail, href: '#', color: 'bg-violet-400' }
		]
	};

	const isDesktop = useBreakpoint('768px');
</script>

<Tooltip.Provider delayDuration={200}>
	<Dock
		direction="middle"
		class="relative z-1000 hidden flex-col border-2 border-black p-2 sm:flex md:p-4"
		let:mouseX
		let:distance
		let:magnification
	>
		{#each navs.navbar as item}
			<DockIcon class="my-2" {mouseX} {magnification} {distance}>
				<Tooltip.Root>
					<Tooltip.Trigger
						class={`flex cursor-pointer items-center justify-center rounded-xl border-2 border-black ${item.color} p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-700 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none`}
					>
						<svelte:component this={item.icon} size={22} strokeWidth={2} />
					</Tooltip.Trigger>

					<Tooltip.Content
						arrowClasses={item.color}
						sideOffset={8}
						side="left"
						class={`${item.color} relative z-1000 px-3 py-1 font-bold text-black`}
					>
						<p>{item.label}</p>
					</Tooltip.Content>
				</Tooltip.Root>
			</DockIcon>
		{/each}

		<Separator orientation="horizontal" class="mx-2 rounded-xl bg-black p-0.5" />

		{#each navs.contact as item}
			<DockIcon class="my-2" {mouseX} {magnification} {distance}>
				<Tooltip.Root>
					<Tooltip.Trigger
						class={`flex cursor-pointer items-center justify-center rounded-xl border-2 border-black ${item.color} p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-700 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none`}
					>
						<svelte:component this={item.icon} size={22} strokeWidth={2} />
					</Tooltip.Trigger>

					<Tooltip.Content
						arrowClasses={item.color}
						sideOffset={8}
						side="left"
						class={`${item.color} relative z-1000 px-3 py-1 font-bold text-black`}
					>
						<p>{item.label}</p>
					</Tooltip.Content>
				</Tooltip.Root>
			</DockIcon>
		{/each}
	</Dock>
</Tooltip.Provider>
