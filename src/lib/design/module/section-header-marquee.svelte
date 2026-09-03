<script lang="ts">
	import { MarqueeStrip } from '$lib/design/shared';

	let {
		text,
		dark = false,
		accent = '#FF3B00',
		reverse = false,
		separator = '×'
	}: {
		text: string;
		dark?: boolean;
		accent?: string;
		reverse?: boolean;
		separator?: string;
	} = $props();
</script>

<MarqueeStrip {text} {dark} {accent} {reverse} {separator} />
