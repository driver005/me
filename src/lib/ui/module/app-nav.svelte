<script lang="ts">
  import { m } from '$lib/paraglide/messages';
  import { social_links } from '$lib/data';
  import { SiGithub, SiInstagram, SiX } from '@icons-pack/svelte-simple-icons';
  import { Briefcase, Rss, Mail } from 'lucide-svelte';
  import { page } from '$app/stores';
  import MagneticButton from './magnetic-button.svelte';
  import { useScrollShow } from '$lib/util/scroll-show.svelte';
  import { useBerlinTime } from '$lib/util/berlin-time.svelte';

  let { scrollHide = false }: { scrollHide?: boolean } = $props();

  const routeLinks = [
    { href: '/', label: m['app_nav.home']() },
    { href: '/home', label: m['app_nav.room']() },
    { href: '/music', label: m['app_nav.music']() },
    { href: '/imprint', label: m['app_nav.imprint']() },
    { href: '/privacy', label: m['app_nav.privacy']() },
  ];

  const socialItems = [
    { icon: SiGithub, href: social_links.github, label: 'GitHub' },
    { icon: SiX, href: social_links.twitter, label: 'X' },
    { icon: SiInstagram, href: social_links.instagram, label: 'Instagram' },
    { icon: Briefcase, href: social_links.linkedin, label: 'LinkedIn' },
    { icon: Rss, href: social_links.blog, label: 'Blog' },
    { icon: Mail, href: `mailto:${m.email()}`, label: 'Email' },
  ];

  let open = $state(false);
  let currentPath = $state('/');

  let show = useScrollShow(scrollHide ? 0.8 : 0);
  const berlinTime = useBerlinTime();
  let time = $derived(`BER ${berlinTime}`);

  $effect(() => {
    const unsub = page.subscribe(p => {
      currentPath = p.url.pathname;
    });
    return unsub;
  });

</script>

{#if show}
<header
  class="fixed top-0 left-0 right-0 z-50 bg-[#F3F2EE]/90 backdrop-blur-sm border-b border-black"
  style="animation: slideDown 0.5s cubic-bezier(0.22,1,0.36,1) forwards;"
>
  <div class="flex items-center justify-between px-4 sm:px-8 h-14">
    <a href="/" class="font-mono text-sm font-bold tracking-tighter flex items-center gap-2">
      <span class="inline-block h-2 w-2 bg-[#FF3B00] rounded-full"></span>
      ADRIAN FERNÁNDEZ
    </a>

    <nav class="hidden md:flex items-center gap-6">
      {#each routeLinks as l}
        <a
          href={l.href}
          class="font-mono text-xs uppercase tracking-[0.2em] group relative overflow-hidden inline-flex flex-col"
          style="height:1.1em;line-height:1.1em"
          class:!text-[#FF3B00]={currentPath === l.href}
        >
          <span class="block transition-transform duration-300 ease-out group-hover:-translate-y-full">
            {l.label}
          </span>
          <span class="block absolute inset-x-0 top-full transition-transform duration-300 ease-out group-hover:-translate-y-full text-[#FF3B00]">
            {l.label}
          </span>
        </a>
      {/each}
    </nav>

    <div class="hidden md:flex items-center gap-4">
      {#if currentPath !== '/'}
      <div class="flex items-center gap-3 border-r border-black/20 pr-4">
        {#each socialItems as s}
          <a
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            class="text-[#555] hover:text-[#FF3B00] transition-colors"
            aria-label={s.label}
          >
            <s.icon size={16} />
          </a>
        {/each}
      </div>
      {/if}
      <span class="hidden lg:flex items-center gap-1.5">
        <span class="h-1.5 w-1.5 rounded-full bg-[#22c55e] animate-pulse"></span>
        <span class="font-mono text-[10px] uppercase tracking-[0.2em] text-[#22c55e]">{m['nav.open']()}</span>
      </span>
      <span class="font-mono text-xs uppercase tracking-[0.2em] text-[#555]">{time}</span>
      <MagneticButton strength={0.4}>
        <a
          href="mailto:contact@a42n.com"
          class="font-mono text-xs uppercase tracking-[0.2em] px-3 py-1.5 bg-[#0A0A0A] text-[#F3F2EE] hover:bg-[#FF3B00] transition-colors inline-block"
        >
          {m['nav.cta']()}
        </a>
      </MagneticButton>
    </div>

    <button
      class="md:hidden font-mono text-xs uppercase tracking-[0.2em] px-3 py-1.5 border border-black"
      onclick={() => (open = !open)}
    >
      {open ? 'Close' : 'Menu'}
    </button>
  </div>

  {#if open}
    <nav class="md:hidden border-t border-black bg-[#F3F2EE]">
      <div class="flex flex-col p-4 gap-3">
        {#each routeLinks as l}
          <a
            href={l.href}
            onclick={() => (open = false)}
            class="font-mono text-sm uppercase tracking-[0.2em] hover:text-[#FF3B00]"
            class:text-[#FF3B00]={currentPath === l.href}
          >
            → {l.label}
          </a>
        {/each}
        {#if currentPath !== '/'}
        <div class="flex gap-4 pt-3 border-t border-black/20">
          {#each socialItems as s}
            <a
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              class="text-[#555] hover:text-[#FF3B00] transition-colors"
              aria-label={s.label}
            >
              <s.icon size={18} />
            </a>
          {/each}
        </div>
        {/if}
      </div>
    </nav>
  {/if}
</header>
{/if}

<style>
  @keyframes slideDown {
    from { transform: translateY(-100%); }
    to   { transform: translateY(0); }
  }
</style>
