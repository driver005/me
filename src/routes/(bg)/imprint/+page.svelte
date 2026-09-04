<script lang="ts">
  import { browser } from '$app/environment';
import { prefersReducedMotion } from '$lib/util/reduced-motion';
  import PageShell from '$lib/design/module/page-shell.svelte';
  import { m } from '$lib/paraglide/messages';
  import SvelteSeo from 'svelte-seo';
  import gsap from 'gsap';
  import { ScrollTrigger } from 'gsap/ScrollTrigger';

  let contentRef: HTMLElement | null = $state(null);

  $effect(() => {
    if (!browser || !contentRef) return;
    const prefersReduced = prefersReducedMotion();
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      gsap.from(contentRef!.querySelectorAll('section'), {
        opacity: 0,
        y: 30,
        duration: 0.6,
        ease: 'power2.out',
        stagger: 0.12,
        scrollTrigger: {
          trigger: contentRef,
          start: 'top 80%',
          toggleActions: 'play none none reverse'
        }
      });
    }, contentRef);

    return () => ctx.revert();
  });
</script>

<svelte:head>
  <SvelteSeo
    title={m['seo.imprint.title']()}
    description={m['seo.imprint.description']()}
    keywords={m['seo.keywords']()}
    canonical={`${m.url()}/imprint`}
    openGraph={{
      title: m['seo.imprint.title'](),
      description: m['seo.imprint.description'](),
      url: `${m.url()}/imprint`,
      type: 'website',
      images: [{ url: `${m.url()}${m['assets.seo_preview']()}`, width: 800, height: 600, alt: m['seo.og_image_alt']() }],
      site_name: m['seo.author']()
    }}
    twitter={{
      card: 'summary_large_image',
      site: m['seo.twitter_handle'](),
      title: m['seo.imprint.title'](),
      description: m['seo.imprint.description'](),
      image: `${m.url()}${m['assets.seo_preview']()}`
    }}
  />
</svelte:head>

<PageShell>
  <div class="max-w-3xl mx-auto px-4 sm:px-8 py-16 sm:py-24">
    <h1 class="font-display text-5xl sm:text-7xl tracking-tighter leading-[0.9] text-[#0A0A0A]">
      {m['imprint.title']()}
    </h1>
    <p class="font-mono text-xs uppercase tracking-[0.2em] text-[#555] mt-4">
      {m['imprint.description']()}
    </p>

    <div bind:this={contentRef} class="mt-12 space-y-10">
      <section>
        <h2 class="font-mono text-xs uppercase tracking-[0.25em] text-[#555] mb-3">
          {m['imprint.responsible']()}
        </h2>
        <div class="font-mono text-sm text-[#0A0A0A] space-y-1">
          <p>{m['imprint.address_line1']()}</p>
          <p>{m['imprint.address_line2']()}</p>
        </div>
      </section>

      <section>
        <h2 class="font-mono text-xs uppercase tracking-[0.25em] text-[#555] mb-3">
          {m['imprint.contact']()}
        </h2>
        <div class="font-mono text-sm text-[#0A0A0A] space-y-1">
          <p>
            <a href="mailto:{m['imprint.email']()}" class="hover:text-[#FF3B00] transition-colors no-underline">
              {m['imprint.email']()}
            </a>
          </p>
        </div>
      </section>

      <section>
        <h2 class="font-mono text-xs uppercase tracking-[0.25em] text-[#555] mb-3">
          {m['imprint.disclaimer_title']()}
        </h2>
        <div class="space-y-6">
          <div>
            <h3 class="font-mono text-sm font-bold text-[#0A0A0A] mb-1">{m['imprint.disclaimer_liability']()}</h3>
            <p class="font-mono text-sm text-[#555] leading-relaxed">{m['imprint.disclaimer_liability_text']()}</p>
          </div>
          <div>
            <h3 class="font-mono text-sm font-bold text-[#0A0A0A] mb-1">{m['imprint.disclaimer_links']()}</h3>
            <p class="font-mono text-sm text-[#555] leading-relaxed">{m['imprint.disclaimer_links_text']()}</p>
          </div>
          <div>
            <h3 class="font-mono text-sm font-bold text-[#0A0A0A] mb-1">{m['imprint.disclaimer_copyright']()}</h3>
            <p class="font-mono text-sm text-[#555] leading-relaxed">{m['imprint.disclaimer_copyright_text']()}</p>
          </div>
        </div>
      </section>
    </div>
  </div>
</PageShell>
