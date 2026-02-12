<script lang="ts">
	import * as Dialog from '$lib/ui/cn/dialog';
	import * as Tabs from '$lib/ui/cn/tabs';
	import * as Card from '$lib/ui/cn/card';
	import { Badge } from '$lib/ui/cn/badge';
	import { Button } from '$lib/ui/cn/button';
	import { Avatar, HeroCard, Features, Marquee, BentoGrid, BentoCard } from '$lib/ui';
	import {
		User,
		Code,
		Briefcase,
		Mail,
		Download,
		FileDown,
		CircleCheck,
		ArrowRight
	} from 'lucide-svelte';
	import { History } from '@lucide/svelte';
	import { AspectRatio } from '$lib/ui/cn/aspect-ratio';
	import { Eye, PackageSearch, Settings } from 'lucide-svelte';
	import { SkillCard, Project, Circle, Story } from '$lib/ui/custom';
	import { Calendar, TextSearch, ReceiptText, CodeXml } from 'lucide-svelte';
	import ProjectCard from '$lib/ui/custom/project-card.svelte';

	const portfolioData = {
		profile: {
			name: 'Alex Developer',
			tagline: 'Building digital experiences with precision and artistry.',
			story:
				"I’m a creative developer who believes that great software is built at the intersection of logic and art. When I'm not coding, I'm usually exploring the outdoors.",
			status: 'Freelancing & Learning Rust',
			focus: 'Minimalism & Performance',
			updateDate: 'Feb 2026',
			image:
				'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80'
		},
		milestones: [
			{
				id: 1,
				title: '1. Choose a Component',
				content:
					"Select the component that best suits your needs from Eldora UI's versatile collection, designed to simplify and enhance your development process.",
				image: 'https://i.pinimg.com/736x/ca/aa/49/caaa49d386d84f2d037d0abcc919778f.jpg',
				icon: PackageSearch
			},
			{
				id: 2,
				title: '2. Add Utility Helpers',
				content:
					'Enhance functionality by incorporating utility helpers that align with the selected component, ensuring seamless integration and customization.',
				image: 'https://i.pinimg.com/736x/a5/dc/0a/a5dc0af50d185b7f9111949b17e17e1a.jpg',
				icon: Settings
			},
			{
				id: 3,
				title: '3. Copy and Paste the Code',
				content:
					"Simply copy and paste the provided code into your project, making the process quick and hassle-free. You're now ready to see the magic in action!",
				image: 'https://i.pinimg.com/736x/b1/b9/c2/b1b9c230143fb0d8540eabe5b74adf27.jpg',
				icon: Eye
			}
		],
		sellingPoints: ['Design-to-Code Specialist', 'High Performance Focus', 'Accessibility First'],
		skills: [
			{
				name: 'SvelteKit',
				message: 'Advanced',
				img: 'https://avatar.vercel.sh/jack',
				border: 'border-orange-500',
				color: 'text-orange-500'
			},
			{
				name: 'TypeScript',
				message: 'Advanced',
				img: 'https://avatar.vercel.sh/jack',
				border: 'border-blue-500',
				color: 'text-blue-500'
			},
			{
				name: 'Tailwind',
				message: 'Expert',
				img: 'https://avatar.vercel.sh/jack',
				border: 'border-sky-400',
				color: 'text-sky-400'
			},
			{
				name: 'Rust',
				message: 'Beginner',
				img: 'https://avatar.vercel.sh/jack',
				border: 'border-orange-700',
				color: 'text-orange-700'
			},
			{
				name: 'UI/UX',
				message: 'Advanced',
				img: 'https://avatar.vercel.sh/jack',
				border: 'border-pink-500',
				color: 'text-pink-500'
			},
			{
				name: 'Git',
				message: 'Expert',
				img: 'https://avatar.vercel.sh/jack',
				border: 'border-red-500',
				color: 'text-red-500'
			}
		],
		projects: [
			{
				title: 'Pop Smoke',
				description: 'US Rapper',
				tags: ['Artist'],
				href: 'https://wallpapers.com/images/high/pop-smoke-us-rapper-yq1a006drjaez4vy.webp',
				iframe_url: 'https://sfz-tuebingen.de/'
			},
			{
				title: 'Summertime Sadness',
				description: 'US Rapper',
				tags: ['Artist'],
				href: 'https://wallpapers.com/images/high/pop-smoke-us-rapper-yq1a006drjaez4vy.webp'
			},
			{
				title: 'Circles',
				description: 'US Rapper',
				tags: ['Artist'],
				href: 'https://wallpapers.com/images/high/pop-smoke-us-rapper-yq1a006drjaez4vy.webp'
			},
			{
				title: 'Starboy',
				description: 'US Rapper',
				tags: ['Artist'],
				href: 'https://wallpapers.com/images/high/pop-smoke-us-rapper-yq1a006drjaez4vy.webp'
			},
			{
				title: 'Save Your Tears',
				description: 'US Rapper',
				tags: ['Artist'],
				href: 'https://wallpapers.com/images/high/pop-smoke-us-rapper-yq1a006drjaez4vy.webp'
			},
			{
				title: 'Rockstar',
				description: 'US Rapper',
				tags: ['Artist'],
				href: 'https://wallpapers.com/images/high/pop-smoke-us-rapper-yq1a006drjaez4vy.webp'
			}
		]
	};

	let active_tab = $state('life');

	function handleOpenChange(open: boolean) {
		if (!open) history.back();
	}
</script>

<Dialog.Root open={true} onOpenChange={handleOpenChange}>
	<Dialog.Content
		class="flex max-h-[95vh] flex-col border-primary/20 bg-background/95 backdrop-blur-xl contain-none! lg:w-[60vw] lg:max-w-none"
	>
		<header class="mb-3">
			<HeroCard
				image={portfolioData.profile.image}
				name={portfolioData.profile.name}
				tagline={portfolioData.profile.tagline}
			/>
		</header>
		<Tabs.Root bind:value={active_tab} class="flex flex-1 flex-col overflow-hidden">
			<Tabs.List
				class="
		/* Positioning: Bottom on mobile, Left Sidebar after MD */
		/* Layout */ /* 
		Neubrutalist Core Styling */
		
		absolute -bottom-10 left-1/2
		z-50 flex min-w-max -translate-x-1/2 flex-row items-center gap-0 
		
		border-[3px] border-black bg-white p-0.5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]
		md:top-1/2 md:left-[-52px] md:translate-x-0 md:-translate-y-1/2 
		md:flex-col
	"
			>
				<Tabs.Trigger
					value="life"
					class="
			group /* Borders: Vertical for row, Horizontal for col */ /* States:
			Clean, solid colors */ relative flex items-center justify-start gap-3
			border-r-[3px] border-black px-5 py-3 font-black
			tracking-tight text-black uppercase transition-all hover:bg-rose-200 active:translate-x-[2px]
			active:translate-y-[2px] data-[state=active]:bg-rose-400 
			data-[state=active]:text-black md:w-full
			md:border-r-0 md:border-b-[3px]
		"
				>
					<User size={20} class="shrink-0 stroke-[2.5px]" />
					<span class="hidden text-xs md:block lg:hidden xl:block">Life</span>
				</Tabs.Trigger>

				<Tabs.Trigger
					value="journey"
					class="
			group relative flex items-center justify-start gap-3 border-r-[3px] border-black px-5 py-3 font-black tracking-tight
			text-black uppercase transition-all hover:bg-indigo-200 data-[state=active]:bg-indigo-400
			data-[state=active]:text-black md:w-full 
			md:border-r-0 md:border-b-[3px]
		"
				>
					<History size={20} class="shrink-0 stroke-[2.5px]" />
					<span class="hidden text-xs md:block lg:hidden xl:block">Path</span>
				</Tabs.Trigger>

				<Tabs.Trigger
					value="projects"
					class="
			group relative flex items-center justify-start gap-3 border-r-[3px] border-black px-5 py-3 font-black tracking-tight
			text-black uppercase transition-all hover:bg-amber-200 data-[state=active]:bg-amber-400
			data-[state=active]:text-black md:w-full 
			md:border-r-0 md:border-b-[3px]
		"
				>
					<CodeXml size={20} class="shrink-0 stroke-[2.5px]" />
					<span class="hidden text-xs md:block lg:hidden xl:block">Work</span>
				</Tabs.Trigger>

				<Tabs.Trigger
					value="skills"
					class="
			group relative flex items-center justify-start gap-3 px-5 py-3 font-black tracking-tight text-black uppercase
			transition-all
			hover:bg-emerald-200 data-[state=active]:bg-emerald-400 
			data-[state=active]:text-black md:w-full
		"
				>
					<Settings size={20} class="shrink-0 stroke-[2.5px]" />
					<span class="hidden text-xs md:block lg:hidden xl:block">Core</span>
				</Tabs.Trigger>
			</Tabs.List>
			<div class="flex-1 overflow-y-auto">
				<Tabs.Content value="life" class="m-0 space-y-6 px-4 pb-4">
					<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
						<Card.Root
							class="group relative h-full overflow-hidden rounded-2xl border-none p-0.5 transition-all duration-500"
						>
							<div
								class="absolute -inset-full animate-[spin_3s_linear_infinite] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
								style="background: conic-gradient(from 0deg, #ff0000, #ff7700, #ffeb00, #00ff00, #00ffff, #0000ff, #8b00ff, #ff0000);"
							></div>
							<Story profile={portfolioData.profile} />
						</Card.Root>
						<Card.Root
							onclick={() => (active_tab = 'skills')}
							class="cursor-pointer border-2 border-black py-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
						>
							<Circle />
						</Card.Root>

						<!-- Dowload buttons -->
						<Card.Root
							class="gap-0 overflow-hidden border-2 border-black bg-white py-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
						>
							<Card.Header class="border-b-2 border-black bg-yellow-300 pt-2">
								<Card.Title class="text-lg font-black uppercase italic">Why Me?</Card.Title>
							</Card.Header>
							<Card.Content>
								<ul class="my-5 space-y-2">
									{#each portfolioData.sellingPoints as point}
										<li class="flex items-center gap-2 text-sm font-bold">
											<CircleCheck size={16} class="fill-emerald-400 text-black" />
											{point}
										</li>
									{/each}
								</ul>
								<Button
									class="h-10 w-full gap-2 rounded-xl border-2 border-black bg-indigo-400 font-black text-black uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-indigo-300 active:translate-x-px active:translate-y-px active:shadow-none"
								>
									<Download size={16} /> PITCH LETTER
								</Button>
							</Card.Content>
						</Card.Root>
						<Card.Root
							class="flex flex-col justify-center border-2 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
						>
							<div class="text-center">
								<div
									class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border-2 border-black bg-emerald-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
								>
									<FileDown class="text-black" size={24} />
								</div>

								<h4 class="text-xl font-black tracking-tight text-black uppercase italic">
									Full Resume
								</h4>

								<p
									class="mx-auto mt-2 w-fit border border-black bg-black px-2 py-0.5 text-[10px] font-bold tracking-widest text-white uppercase"
								>
									Updated {portfolioData.profile.updateDate}
								</p>
							</div>

							<Button
								class="h-10 w-full gap-2 rounded-xl border-2 border-black bg-pink-400 font-black text-black uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-pink-300 active:translate-x-px active:translate-y-px active:shadow-none"
							>
								<Download size={16} /> Download PDF
							</Button>
						</Card.Root>
					</div>
				</Tabs.Content>

				<Tabs.Content value="projects">
					<Card.Root class="grid w-full px-6 xl:grid-cols-2">
						{#each portfolioData.projects as project, i}
							<ProjectCard {project} number={i} />
						{/each}
					</Card.Root>
				</Tabs.Content>

				<Tabs.Content value="skills" class="m-0 flex flex-col gap-6 pb-4">
					<Marquee pauseOnHover class="[--duration:20s]">
						{#each portfolioData.skills as skill}
							<SkillCard
								img={skill.img}
								name={skill.name}
								color={skill.color}
								border={skill.border}
								body={skill.message}
							/>
						{/each}
					</Marquee>
					<Marquee reverse pauseOnHover class="[--duration:20s]">
						{#each portfolioData.skills as skill}
							<SkillCard
								img={skill.img}
								name={skill.name}
								color={skill.color}
								border={skill.border}
								body={skill.message}
							/>
						{/each}
					</Marquee>
				</Tabs.Content>

				<Tabs.Content value="journey" class="m-0 focus-visible:outline-none">
					<div
						class="relative ml-4 space-y-12 border-l-2 border-dashed border-muted-foreground/20 py-4 pl-10"
					>
						<Features data={portfolioData.milestones} />
					</div>
				</Tabs.Content>
			</div>
		</Tabs.Root>
	</Dialog.Content>
</Dialog.Root>

<style>
	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>
