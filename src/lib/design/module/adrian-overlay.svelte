<script lang="ts">
	import { m } from '$lib/paraglide/messages';

	const year = new Date().getFullYear();
</script>

<footer class="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
	<div class="pointer-events-auto px-4 sm:px-8 py-4">
		<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
			<a href="/" class="no-underline">
				<div class="font-display uppercase text-4xl sm:text-5xl tracking-tighter leading-none select-none">
				<span style="-webkit-text-stroke: 1px #F3F2EE; color: transparent;">
					{m['name.first']()}Fern<span class="text-[#FF3B00]" style="-webkit-text-stroke: 0;">á</span>ndez
				</span>
				</div>
			</a>
			<div class="flex items-center gap-4">
				<span class="font-mono text-[9px] uppercase tracking-[0.3em] text-[#F3F2EE]/25">
					&copy; {year} {m['footer.rights']()}
				</span>
				<a
					href="/imprint"
					class="font-mono text-[9px] uppercase tracking-[0.3em] text-[#F3F2EE]/25 hover:text-[#FF3B00] transition-colors duration-500 ease-[var(--ease-out-expo)] no-underline"
				>
					{m['app_nav.imprint']()}
				</a>
				<a
					href="/privacy"
					class="font-mono text-[9px] uppercase tracking-[0.3em] text-[#F3F2EE]/25 hover:text-[#FF3B00] transition-colors duration-500 ease-[var(--ease-out-expo)] no-underline"
				>
					{m['app_nav.privacy']()}
				</a>
			</div>
		</div>
	</div>
</footer>
