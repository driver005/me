<script lang="ts">
	let {
		items,
		class: className = '',
		dark = false
	}: {
		items: { label: string | (() => string); span: string; hide?: string; cellClass?: string }[];
		class?: string;
		dark?: boolean;
	} = $props();
</script>

<div class="grid grid-cols-12 border-b {dark ? 'border-[#F3F2EE]/20' : 'border-black'} {className}">
	{#each items as item, i}
		<div
			class="{item.span} {item.hide ?? ''} {item.cellClass ?? ''} border-r px-4 py-4 sm:px-8 {dark
				? 'border-[#F3F2EE]/20'
				: 'border-black'} {i === items.length - 1 ? 'border-r-0' : ''}"
			style="animation: sectionHeaderFade 0.4s cubic-bezier(0.16, 1, 0.3, 1) {i * 60}ms forwards;"
		>
			<span
				class="font-mono text-xs tracking-[0.25em] uppercase {dark
					? 'text-[#F3F2EE]/60'
					: 'text-[#555]'}">{typeof item.label === 'function' ? item.label() : item.label}</span
			>
		</div>
	{/each}
</div>

<style>
	@keyframes sectionHeaderFade {
		from {
			opacity: 0;
			transform: translateY(4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
