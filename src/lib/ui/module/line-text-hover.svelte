<script lang="ts">
	import { browser } from '$app/environment';
	import { TextAnimator } from '$lib/util/text-animator';

	let {
		text,
		class: className = '',
		as: tag = 'span'
	}: {
		text: string;
		class?: string;
		as?: 'span' | 'a' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
	} = $props();

	let el: HTMLElement | null = $state(null);
	let animator: TextAnimator | null = null;

	$effect(() => {
		if (!browser || !el) return;
		animator = new TextAnimator(el);
		return () => animator?.destroy();
	});

	function onEnter() {
		animator?.animate();
	}

	function onLeave() {
		animator?.animateBack();
	}
</script>

<svelte:element
	this={tag}
	bind:this={el}
	class="hover-effect hover-effect--bg-south {className}"
	onmouseenter={onEnter}
	onmouseleave={onLeave}
	role="presentation"
>
	{text}
</svelte:element>

<style>
	:global(.hover-effect) {
		position: relative;
		white-space: nowrap;
		font-kerning: none;
	}

	:global(.hover-effect .char) {
		position: relative;
	}

	:global(.hover-effect--bg-south) {
		--anim: 0;
	}

	:global(.hover-effect--bg-south::after) {
		content: '';
		position: absolute;
		left: -8px;
		right: -8px;
		top: -8px;
		bottom: -8px;
		background-color: var(--color-bg-effect, rgba(255, 59, 0, 0.12));
		border-radius: 2px;
		z-index: -1;
		transform-origin: 50% 100%;
		transform: scaleY(var(--anim));
	}
</style>
