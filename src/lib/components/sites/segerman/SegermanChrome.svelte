<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import SegermanLoader from './SegermanLoader.svelte';
	import './segerman.css';

	let { children }: { children: Snippet } = $props();

	const EMAIL = 'raphael@segerman.dev';

	let isDark = $state(false);
	let loaded = $state(false);
	let revealed = $state(false);
	let navCopied = $state(false);
	let footerCopied = $state(false);

	onMount(() => {
		const stored = localStorage.getItem('segerman-theme');
		isDark = stored === 'dark';
	});

	$effect(() => {
		if (!loaded) return;
		const t = setTimeout(() => (revealed = true), 80);
		return () => clearTimeout(t);
	});

	function toggleTheme() {
		isDark = !isDark;
		localStorage.setItem('segerman-theme', isDark ? 'dark' : 'light');
	}

	async function copyEmail(which: 'nav' | 'footer') {
		try {
			await navigator.clipboard.writeText(EMAIL);
		} catch {
			// clipboard unavailable — still show the tooltip, link below still works
		}
		if (which === 'nav') {
			navCopied = true;
			setTimeout(() => (navCopied = false), 1600);
		} else {
			footerCopied = true;
			setTimeout(() => (footerCopied = false), 1600);
		}
	}
</script>

<div class="segerman-clone" class:is-dark={isDark} class:is-revealed={revealed}>
	{#if !loaded}
		<SegermanLoader bind:done={loaded} />
	{/if}
	<div class="page">
		<a class="logo link" data-reveal href="/segerman">
			<span class="line">Raphael Segerman</span>
		</a>

		<nav class="nav" data-reveal style="--reveal-delay: 60ms">
			<a class="nav-link link" href="/segerman/info">Info</a>
			<span class="nav-comma">,</span>
			<button
				class="nav-link link"
				onclick={() => copyEmail('nav')}
				aria-label="Copy email address"
			>
				Contact
				<span class="copied-tip" class:is-visible={navCopied}>Email copied!</span>
			</button>
		</nav>

		<button class="toggle" onclick={toggleTheme} aria-label="Toggle color theme" data-reveal style="--reveal-delay: 100ms">
			<svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path
					d="M6 0C6.36 0 6.72 0.03 7.06 0.09C5.76 0.42 4.8 1.6 4.8 3C4.8 4.66 6.14 6 7.8 6C9.46 6 10.8 4.66 10.8 3C10.8 2.75 10.77 2.52 10.71 2.29C11.52 3.31 12 4.6 12 6C12 9.31 9.31 12 6 12C2.69 12 0 9.31 0 6C0 2.69 2.69 0 6 0Z"
					fill="currentColor"
				/>
			</svg>
		</button>

		{@render children()}

		<div class="footer-metas" data-reveal style="--reveal-delay: 160ms">
			<dl class="meta meta-email">
				<dt class="label">Contact</dt>
				<dd class="text">
					<button class="link" onclick={() => copyEmail('footer')}>{EMAIL}</button>
					<span class="copied-tip" class:is-visible={footerCopied}>Email copied!</span>
				</dd>
			</dl>
			<dl class="meta meta-available">
				<dt class="label">Available</dt>
				<dd class="text">October 2026</dd>
			</dl>
		</div>

		<span class="copyright" data-reveal style="--reveal-delay: 160ms">© {new Date().getFullYear()}</span>
	</div>
</div>
