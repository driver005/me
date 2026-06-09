<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    items,
    class: className = '',
    dark = false,
  }: {
    items: { label: string | (() => string); span: string; hide?: string; cellClass?: string }[];
    class?: string;
    dark?: boolean;
  } = $props();

  const border = dark ? 'border-[#F3F2EE]/20' : 'border-black';
  const textColor = dark ? 'text-[#F3F2EE]/60' : 'text-[#555]';
</script>

<div class="grid grid-cols-12 border-b {border} {className}">
  {#each items as item, i}
    <div class="{item.span} {item.hide || ''} {item.cellClass || ''} px-4 sm:px-8 py-4 border-r {border} {i === items.length - 1 ? 'border-r-0' : ''}">
      <span class="font-mono text-xs uppercase tracking-[0.25em] {textColor}">{typeof item.label === 'function' ? item.label() : item.label}</span>
    </div>
  {/each}
</div>
