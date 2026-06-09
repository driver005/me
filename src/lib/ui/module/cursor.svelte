<script lang="ts">
	import { onMount } from 'svelte';
	import { Motion, useMotionValue, useSpring } from 'svelte-motion';

	let x = useMotionValue(-100);
	let y = useMotionValue(-100);
	let springX = useSpring(x, { damping: 25, stiffness: 350, mass: 0.4 });
	let springY = useSpring(y, { damping: 25, stiffness: 350, mass: 0.4 });
	let hover = $state(false);
	let hidden = $state(true);

	onMount(() => {
		const move = (e: MouseEvent) => {
			x.set(e.clientX);
			y.set(e.clientY);
			hidden = false;
		};
		const over = (e: MouseEvent) => {
			const t = e.target as HTMLElement;
			if (t.closest('a, button, [data-cursor="hover"], input, textarea, [role="button"]')) {
				hover = true;
			} else {
				hover = false;
			}
		};
		const leave = () => { hidden = true; };

		window.addEventListener('mousemove', move);
		window.addEventListener('mouseover', over);
		window.addEventListener('mouseleave', leave);
		return () => {
			window.removeEventListener('mousemove', move);
			window.removeEventListener('mouseover', over);
			window.removeEventListener('mouseleave', leave);
		};
	});
</script>

<Motion style={{ translateX: springX, translateY: springY }} let:motion>
	<div use:motion data-testid="custom-cursor" aria-hidden="true" class="pointer-events-none fixed top-0 left-0 z-[100] hidden md:block">
		<Motion
			animate={{
				scale: hover ? 3.5 : 1,
				opacity: hidden ? 0 : 1,
				backgroundColor: hover ? '#FF3B00' : '#0A0A0A'
			}}
			transition={{ type: 'spring', stiffness: 400, damping: 28 }}
			let:motion
		>
			<div use:motion class="-translate-x-1/2 -translate-y-1/2 h-3 w-3 rounded-full mix-blend-difference"></div>
		</Motion>
	</div>
</Motion>
