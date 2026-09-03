<script lang="ts">
  import type { Snippet } from 'svelte';
  import { useIntersectionObserver } from '$lib/util/intersection.svelte';

  let { delay = 0, as = 'span', class: className = '', children }: { delay?: number; as?: 'span' | 'div'; class?: string; children: Snippet } = $props();

  const obs = useIntersectionObserver({ threshold: 0.2 });
</script>

{#if as === 'div'}
  <div bind:this={obs.element} class="block overflow-hidden {className}">
    <div class="block transition-transform duration-500 ease-[var(--ease-out-expo)]"
      style:transition-delay="{delay}ms"
      style:transform={obs.isIntersecting ? 'translateY(0)' : 'translateY(110%)'}>
      {@render children()}
    </div>
  </div>
{:else}
  <span bind:this={obs.element} class="block overflow-hidden {className}">
    <span class="block transition-transform duration-500 ease-[var(--ease-out-expo)]"
      style:transition-delay="{delay}ms"
      style:transform={obs.isIntersecting ? 'translateY(0)' : 'translateY(110%)'}>
      {@render children()}
    </span>
  </span>
{/if}
