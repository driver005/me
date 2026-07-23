<script lang="ts">
  import { m } from '$lib/paraglide/messages';
  import { social_links, socialLabels, languages } from '$lib/data';
  import { getLocale, setLocale } from '$lib/paraglide/runtime.js';
  import { SiGithub, SiInstagram, SiX } from '@icons-pack/svelte-simple-icons';
  import { Briefcase, Rss, Mail } from 'lucide-svelte';
  import { page } from '$app/stores';
  import { slide } from 'svelte/transition';
  import MagneticButton from './magnetic-button.svelte';
  import { useScrollShow } from '$lib/util/scroll-show.svelte';
  import { useBerlinTime } from '$lib/util/berlin-time.svelte';

  let { scrollHide = false }: { scrollHide?: boolean } = $props();

  const routeLinks = [
    { href: '/', label: m['app_nav.home']() },
    { href: '/me', label: m['app_nav.me']() },
    { href: '/home', label: m['app_nav.room']() },
    { href: '/spiral', label: m['app_nav.spiral']() },
    { href: '/music', label: m['app_nav.music']() },
    { href: '/imprint', label: m['app_nav.imprint']() },
    { href: '/privacy', label: m['app_nav.privacy']() },
  ];

  const socialItems = [
    { icon: SiGithub, href: social_links.github, label: socialLabels.github },
    { icon: SiX, href: social_links.twitter, label: socialLabels.x },
    { icon: SiInstagram, href: social_links.instagram, label: socialLabels.instagram },
    { icon: Briefcase, href: social_links.linkedin, label: socialLabels.linkedin },
    { icon: Rss, href: social_links.blog, label: socialLabels.blog },
    { icon: Mail, href: `mailto:${m.email()}`, label: socialLabels.email },
  ];

  let open = $state(false);
  let currentPath = $state('/');
  let darkMode = $state(false);

  const scrollThreshold = $derived(scrollHide ? 0.8 : 0);
  // svelte-ignore state_referenced_locally
  let show = useScrollShow(scrollThreshold);
  const berlinTime = useBerlinTime();
  let time = $derived(`BER ${berlinTime.value}`);

  function linkClass(href: string) {
    const active = currentPath === href;
    const base = 'font-mono text-xs uppercase tracking-[0.2em] group relative overflow-hidden inline-flex flex-col';
    const color = active ? 'text-[#FF3B00]' : darkMode ? 'text-[#F3F2EE]' : 'text-[#0A0A0A]';
    return `${base} ${color}`;
  }

  function socialClass() {
    return darkMode ? 'text-[#F3F2EE]/70 hover:text-[#FF3B00] transition-colors' : 'text-[#555] hover:text-[#FF3B00] transition-colors';
  }

  function mobileLinkClass(href: string) {
    const active = currentPath === href;
    const base = 'font-mono text-sm uppercase tracking-[0.2em] hover:text-[#FF3B00]';
    const color = active ? 'text-[#FF3B00]' : darkMode ? 'text-[#F3F2EE]' : 'text-[#0A0A0A]';
    return `${base} ${color}`;
  }

  $effect(() => {
    const unsub = page.subscribe(p => {
      currentPath = p.url.pathname;
    });
    return unsub;
  });

  $effect(() => {
    if (currentPath !== '/') {
      darkMode = false;
      return;
    }
    const darkSelectors = ['#top', '#spiral', '#process', '#contact', '[data-testid="site-footer"]'];
    const lightSelectors = ['#about', '#works', '#services'];

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.intersectionRatio > 0 && entry.intersectionRatio < 1) {
            const isDark = darkSelectors.some(s => entry.target.matches(s)) ||
                           entry.target.closest('[data-testid="site-footer"]') !== null;
            const isLight = lightSelectors.some(s => entry.target.matches(s));
            if (isDark) darkMode = true;
            else if (isLight) darkMode = false;
          }
        }
      },
      { threshold: [0, 0.1, 0.5, 1], rootMargin: '-1px 0px -99% 0px' }
    );

    const observe = () => {
      darkSelectors.forEach(s => {
        document.querySelectorAll(s).forEach(el => observer.observe(el));
      });
      lightSelectors.forEach(s => {
        document.querySelectorAll(s).forEach(el => observer.observe(el));
      });
    };

    observe();
    const timeout = setTimeout(observe, 500);
    return () => {
      clearTimeout(timeout);
      observer.disconnect();
    };
  });
</script>

{#if show}
<header
  class="fixed top-0 left-0 right-0 z-50 backdrop-blur-sm border-b transition-colors duration-300 {darkMode ? 'bg-[#0A0A0A]/90 border-[#F3F2EE]/20' : 'bg-[#F3F2EE]/90 border-black'}"
  style="animation: slideDown 0.5s var(--ease-out-expo);"
>
  <div class="flex items-center justify-between px-4 sm:px-8 h-14">
    <a href="/me" class="font-mono text-sm font-bold tracking-tighter flex items-center gap-2">
      <span class="inline-block h-2 w-2 bg-[#FF3B00] rounded-full"></span>
      {m['footer.copyright']()}
    </a>

    <nav class="hidden md:flex items-center gap-6">
      {#each routeLinks as l}
        <a
          href={l.href}
          class={linkClass(l.href)}
          style="height:1.1em;line-height:1.1em"
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
      <div class="flex items-center gap-3 pr-4 border-r {darkMode ? 'border-[#F3F2EE]/20' : 'border-black'}">
        {#each socialItems as s}
          <a
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            class={socialClass()}
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
      <span class="font-mono text-xs uppercase tracking-[0.2em] {darkMode ? 'text-[#F3F2EE]/70' : 'text-[#555]'}">{time}</span>
      <div class="flex items-center gap-1 font-mono text-xs uppercase tracking-[0.2em]">
        {#each languages as lang, i}
          {#if i > 0}<span class="{darkMode ? 'text-[#F3F2EE]/20' : 'text-[#0A0A0A]/20'}">|</span>{/if}
          <button
            onclick={() => setLocale(lang.id as 'en' | 'de')}
            class="transition-colors duration-300 {getLocale() === lang.id ? 'text-[#FF3B00]' : darkMode ? 'text-[#F3F2EE]/50 hover:text-[#F3F2EE]' : 'text-[#0A0A0A]/50 hover:text-[#0A0A0A]'}"
          >
            {lang.id}
          </button>
        {/each}
      </div>
      <MagneticButton strength={0.4}>
        <a
          href="mailto:{m.email()}"
          class="font-mono text-xs uppercase tracking-[0.2em] px-3 py-1.5 transition-colors inline-block {darkMode ? 'bg-[#F3F2EE] text-[#0A0A0A] hover:bg-[#FF3B00]' : 'bg-[#0A0A0A] text-[#F3F2EE] hover:bg-[#FF3B00]'}"
        >
          {m['nav.cta']()}
        </a>
      </MagneticButton>
    </div>

    <button
      class="md:hidden font-mono text-xs uppercase tracking-[0.2em] px-3 py-1.5 border transition-transform active:scale-95 {darkMode ? 'border-[#F3F2EE]/40 text-[#F3F2EE]' : 'border-black text-[#0A0A0A]'}"
      onclick={() => (open = !open)}
    >
      {open ? m['nav.close']() : m['nav.menu']()}
    </button>
  </div>

  {#if open}
    <nav
      transition:slide={{ duration: 300 }}
      class="md:hidden border-t bg-[#F3F2EE] {darkMode ? 'border-[#F3F2EE]/20 bg-[#0A0A0A]' : 'border-black'}"
    >
      <div class="flex flex-col p-4 gap-3">
        {#each routeLinks as l}
          <a
            href={l.href}
            onclick={() => (open = false)}
            class={mobileLinkClass(l.href)}
          >
            → {l.label}
          </a>
        {/each}
        {#if currentPath !== '/'}
        <div class="flex gap-4 pt-3 border-t {darkMode ? 'border-[#F3F2EE]/20' : 'border-black/20'}">
          {#each socialItems as s}
            <a
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              class={socialClass()}
              aria-label={s.label}
            >
              <s.icon size={18} />
            </a>
          {/each}
        </div>
        {/if}
        <div class="flex items-center gap-2 pt-3 border-t font-mono text-sm uppercase tracking-[0.2em] {darkMode ? 'border-[#F3F2EE]/20' : 'border-black/20'}">
          {#each languages as lang, i}
            {#if i > 0}<span class="{darkMode ? 'text-[#F3F2EE]/20' : 'text-[#0A0A0A]/20'}">|</span>{/if}
            <button
              onclick={() => { setLocale(lang.id as 'en' | 'de'); open = false; }}
              class="transition-colors duration-300 {getLocale() === lang.id ? 'text-[#FF3B00]' : darkMode ? 'text-[#F3F2EE]/50 hover:text-[#F3F2EE]' : 'text-[#0A0A0A]/50 hover:text-[#0A0A0A]'}"
            >
              {lang.label}
            </button>
          {/each}
        </div>
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
