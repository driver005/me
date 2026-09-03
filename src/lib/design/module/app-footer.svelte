<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { useBerlinTime } from '$lib/util/berlin-time.svelte';
	import { MetaLabel, NameLockup, SocialLinks } from '$lib/design/shared';

	const berlinTime = useBerlinTime();

	const year = new Date().getFullYear();
</script>

<footer class="bg-[#0A0A0A] text-[#F3F2EE]">
	<div class="px-4 pt-16 pb-6 sm:px-8">
		<NameLockup class="text-[22vw] sm:text-[18vw]">
			{m['name.first']()}Fern<span class="text-[#FF3B00]">á</span>ndez
		</NameLockup>

		<div class="mt-12 grid grid-cols-12 gap-4 border-t border-[#F3F2EE]/20 pt-6">
			<div class="col-span-6 sm:col-span-3">
				<MetaLabel class="text-[#F3F2EE]/60">
					&copy; {year}
					{m['footer.copyright']()}
				</MetaLabel>
				<div class="mt-2 font-mono text-sm text-[#F3F2EE]/70">
					{m['footer.rights']()}
				</div>
			</div>
			<div class="col-span-6 sm:col-span-3">
				<MetaLabel class="text-[#F3F2EE]/60">
					{m['footer.berlin_time']()}
				</MetaLabel>
				<div class="mt-2 font-mono text-sm text-[#F3F2EE]/70">
					{berlinTime.value}
					{m['footer.clock_suffix']()}
				</div>
			</div>
			<div class="col-span-6 sm:col-span-3">
				<MetaLabel class="text-[#F3F2EE]/60">
					{m['footer.built_with']()}
				</MetaLabel>
				<div class="mt-2 font-mono text-sm text-[#F3F2EE]/50">
					{@html m['footer.tech_stack']()}
				</div>
			</div>
			<div class="col-span-6 sm:col-span-3 sm:text-right">
				<MetaLabel class="text-[#F3F2EE]/60">
					{m['footer.top']()}
				</MetaLabel>
				<div class="mt-2">
					<a
						href="/"
						class="font-mono text-sm text-[#F3F2EE]/70 no-underline transition-colors duration-500 ease-[var(--ease-out-expo)] hover:text-[#FF3B00]"
					>
						{m['footer.back_to_start']()}
					</a>
				</div>
			</div>
		</div>

		<div
			class="mt-8 flex flex-col items-start justify-between gap-4 border-t border-[#F3F2EE]/10 pt-4 sm:flex-row sm:items-center"
		>
			<SocialLinks />
			<div class="flex gap-4">
				<a
					href="/imprint"
					class="font-mono text-[9px] tracking-[0.3em] text-[#F3F2EE]/25 uppercase no-underline transition-colors duration-500 ease-[var(--ease-out-expo)] hover:text-[#FF3B00]"
				>
					{m['app_nav.imprint']()}
				</a>
				<a
					href="/privacy"
					class="font-mono text-[9px] tracking-[0.3em] text-[#F3F2EE]/25 uppercase no-underline transition-colors duration-500 ease-[var(--ease-out-expo)] hover:text-[#FF3B00]"
				>
					{m['app_nav.privacy']()}
				</a>
			</div>
		</div>

		<div
			class="mt-4 flex flex-col items-start justify-between gap-2 pt-4 sm:flex-row sm:items-center"
		>
			<span class="font-mono text-[9px] tracking-[0.3em] text-[#F3F2EE]/25 uppercase">
				{m['footer.credit']()}
			</span>
			<span class="font-mono text-[9px] tracking-[0.3em] text-[#F3F2EE]/25 uppercase">
				{m['footer.end']()}
			</span>
		</div>
	</div>
</footer>
