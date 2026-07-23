<script lang="ts">
	import RoomTransition from '$lib/ui/page/room-transition.svelte';
	import SmoothScroll from '$lib/ui/module/smooth-scroll.svelte';
	import Cursor from '$lib/ui/module/cursor.svelte';
	import ScrollProgress from '$lib/ui/module/scroll-progress.svelte';
	import AppNav from '$lib/ui/module/app-nav.svelte';
	import Hero from '$lib/ui/module/hero.svelte';
	import StatusStrip from '$lib/ui/module/status-strip.svelte';
	import About from '$lib/ui/module/about.svelte';
	import InfiniteCanvas from '$lib/ui/module/infinite-canvas.svelte';
	import ScrollExperience from '$lib/ui/module/scroll-experience.svelte';
	import Works from '$lib/ui/module/works.svelte';
	import RecentActivity from '$lib/ui/module/recent-activity.svelte';
	import Services from '$lib/ui/module/services.svelte';
	import HiddenLayer from '$lib/ui/module/hidden-layer.svelte';
	import TerminalDeploy from '$lib/ui/module/terminal-deploy.svelte';
	import KineticStatement from '$lib/ui/module/kinetic-statement.svelte';
	import TagMarquee from '$lib/ui/module/tag-marquee.svelte';
	import Faq from '$lib/ui/module/faq.svelte';
	import Contact from '$lib/ui/module/contact.svelte';
	import Footer from '$lib/ui/module/footer.svelte';
	import Divider from '$lib/ui/module/divider.svelte';
	import SkillsGraph from '$lib/ui/module/skills-graph.svelte';
	import PenguinSlide from '$lib/ui/module/penguin-slide.svelte';
	import PenguinCurtain from '$lib/ui/module/penguin-curtain.svelte';
	import { fade } from 'svelte/transition';
	import { browser } from '$app/environment';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';
	import Gallery from '$lib/ui/module/gallery.svelte';

	const CREAM = '#F3F2EE';
	const DARK = '#0A0A0A';

	// Lazy-mounted sections shift layout below them after mount, which can
	// leave GSAP ScrollTrigger's cached pin positions stale — refresh after each.
	function refreshScrollTrigger() {
		if (!browser) return;
		setTimeout(() => ScrollTrigger.refresh(), 450);
	}

	let tdRef = $state<HTMLElement | null>(null);
	let tdVisible = $state(false);
	let closingRef = $state<HTMLElement | null>(null);
	let closingVisible = $state(false);

	$effect(() => {
		if (tdRef) {
			const obs = new IntersectionObserver(
				([e]) => {
					if (e.isIntersecting) {
						tdVisible = true;
						refreshScrollTrigger();
						obs.disconnect();
					}
				},
				{ rootMargin: '200px 0px' }
			);
			obs.observe(tdRef);
			return () => obs.disconnect();
		}
	});

	$effect(() => {
		if (closingRef) {
			const obs = new IntersectionObserver(
				([e]) => {
					if (e.isIntersecting) {
						closingVisible = true;
						refreshScrollTrigger();
						obs.disconnect();
					}
				},
				{ rootMargin: '200px 0px' }
			);
			obs.observe(closingRef);
			return () => obs.disconnect();
		}
	});
</script>

<SmoothScroll>
	<div class="App grain min-h-screen bg-[#F3F2EE] text-[#0A0A0A]">
		<Cursor />
		<ScrollProgress />
		<AppNav scrollHide={true} />
		<main data-testid="main">
			<Hero />
			<PenguinCurtain />
			<About />
			<RoomTransition />
			<Gallery />
			<TagMarquee />
			<SkillsGraph />
			<div in:fade={{ duration: 400 }}>
				<KineticStatement />
			</div>
			<PenguinSlide />
			<Works />
			<Services />
			<Faq />
			<RecentActivity />
			<div bind:this={tdRef}>
				{#if tdVisible}
					<div in:fade={{ duration: 400 }}>
						<HiddenLayer />
						<TerminalDeploy />
					</div>
				{/if}
			</div>
			<Contact />
		</main>
		<Footer />
	</div>
</SmoothScroll>
