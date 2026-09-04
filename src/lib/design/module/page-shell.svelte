<script lang="ts">
  import type { Snippet } from 'svelte';
  import AppNav from './app-nav.svelte';
  import AppFooter from './app-footer.svelte';

  let { children }: { children: Snippet } = $props();
</script>

<div class="grain min-h-screen bg-[#F3F2EE]/85 text-[#0A0A0A] backdrop-blur-sm">
  <AppNav />
  <main class="pt-14 min-h-screen">
    {@render children()}
  </main>
  <AppFooter />
</div>
