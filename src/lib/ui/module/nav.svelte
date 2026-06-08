<script lang="ts">
  import MagneticButton from './magnetic-button.svelte';

  const links = [
    { href: '#work', label: 'Work' },
    { href: '#about', label: 'About' },
    { href: '#services', label: 'Services' },
    { href: '#gallery', label: 'Gallery' },
    { href: '#contact', label: 'Contact' },
  ];

  let open = $state(false);
  let show = $state(false);
  let time = $state('');

  $effect(() => {
    let lastY = window.scrollY;
    const threshold = window.innerHeight * 0.8;

    const onScroll = () => {
      const y = window.scrollY;
      if (y < threshold) {
        show = false;
      } else {
        if (y < lastY - 2) show = true;
        else if (y > lastY + 2) show = false;
      }
      lastY = y;
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  });

  $effect(() => {
    const tick = () => {
      const d = new Date();
      const opts: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Europe/Berlin',
      };
      time = `BER ${d.toLocaleTimeString('en-GB', opts)}`;
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  });
</script>

{#if show}
  <header
    data-testid="site-nav"
    class="fixed top-0 left-0 right-0 z-50 bg-[#F3F2EE]/90 backdrop-blur-sm border-b border-black"
    style="animation: slideDown 0.5s cubic-bezier(0.22,1,0.36,1) forwards;"
  >
    <div class="flex items-center justify-between px-4 sm:px-8 h-14">
      <a href="#top" class="font-mono text-sm font-bold tracking-tighter flex items-center gap-2">
        <span class="inline-block h-2 w-2 bg-[#FF3B00] rounded-full"></span>
        ALEX CARTER©
      </a>

      <nav class="hidden md:flex items-center gap-8">
        {#each links as l}
          <a
            href={l.href}
            class="font-mono text-xs uppercase tracking-[0.2em] group relative overflow-hidden inline-flex flex-col"
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
        <span class="hidden lg:flex items-center gap-1.5">
          <span class="h-1.5 w-1.5 rounded-full bg-[#22c55e] animate-pulse"></span>
          <span class="font-mono text-[10px] uppercase tracking-[0.2em] text-[#22c55e]">Open</span>
        </span>
        <span data-testid="nav-time" class="font-mono text-xs uppercase tracking-[0.2em] text-[#555]">{time}</span>
        <MagneticButton strength={0.4}>
          <a
            href="mailto:hello@alexcarter.studio"
            data-testid="nav-cta"
            class="font-mono text-xs uppercase tracking-[0.2em] px-3 py-1.5 bg-[#0A0A0A] text-[#F3F2EE] hover:bg-[#FF3B00] transition-colors inline-block"
          >
            Let's Talk →
          </a>
        </MagneticButton>
      </div>

      <button
        data-testid="nav-mobile-toggle"
        class="md:hidden font-mono text-xs uppercase tracking-[0.2em] px-3 py-1.5 border border-black"
        onclick={() => (open = !open)}
      >
        {open ? 'Close' : 'Menu'}
      </button>
    </div>

    {#if open}
      <nav class="md:hidden border-t border-black bg-[#F3F2EE]">
        <div class="flex flex-col p-4 gap-3">
          {#each links as l}
            <a
              href={l.href}
              onclick={() => (open = false)}
              data-testid="nav-mobile-link-{l.label.toLowerCase()}"
              class="font-mono text-sm uppercase tracking-[0.2em] hover:text-[#FF3B00]"
            >
              → {l.label}
            </a>
          {/each}
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
