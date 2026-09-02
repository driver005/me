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
    title={m['seo.privacy.title']()}
    description={m['seo.privacy.description']()}
    keywords={m['seo.keywords']()}
    canonical={`${m.url()}/privacy`}
    openGraph={{
      title: m['seo.privacy.title'](),
      description: m['seo.privacy.description'](),
      url: `${m.url()}/privacy`,
      type: 'website',
      images: [{ url: `${m.url()}/images/preview_home.jpg`, width: 800, height: 600, alt: m['seo.og_image_alt']() }],
      site_name: m['seo.author']()
    }}
    twitter={{
      card: 'summary_large_image',
      site: m['seo.twitter_handle'](),
      title: m['seo.privacy.title'](),
      description: m['seo.privacy.description'](),
      image: `${m.url()}/images/preview_home.jpg`
    }}
  />
</svelte:head>

<PageShell>
  <div class="max-w-3xl mx-auto px-4 sm:px-8 py-16 sm:py-24">
    <h1 class="font-display text-5xl sm:text-7xl tracking-tighter leading-[0.9] text-[#0A0A0A]">
      {m['privacy.title']()}
    </h1>
    <p class="font-mono text-xs uppercase tracking-[0.2em] text-[#555] mt-4">
      {m['privacy.description']()}
    </p>

    <div bind:this={contentRef} class="mt-12 space-y-10">
      <section>
        <p class="font-mono text-sm text-[#555] leading-relaxed">{m['privacy.intro']()}</p>
      </section>

      <section>
        <h2 class="font-mono text-xs uppercase tracking-[0.25em] text-[#555] mb-3">
          {m['privacy.data_collection_title']()}
        </h2>
        <p class="font-mono text-sm text-[#555] leading-relaxed">{m['privacy.data_collection_text']()}</p>
      </section>

      <section>
        <h2 class="font-mono text-xs uppercase tracking-[0.25em] text-[#555] mb-3">
          {m['privacy.data_storage_title']()}
        </h2>
        <p class="font-mono text-sm text-[#555] leading-relaxed">{m['privacy.data_storage_text']()}</p>
      </section>

      <section>
        <h2 class="font-mono text-xs uppercase tracking-[0.25em] text-[#555] mb-3">
          {m['privacy.rights_title']()}
        </h2>
        <p class="font-mono text-sm text-[#555] leading-relaxed">{m['privacy.rights_text']()}</p>
      </section>

      <section>
        <h2 class="font-mono text-xs uppercase tracking-[0.25em] text-[#555] mb-3">
          {m['privacy.contact_title']()}
        </h2>
        <p class="font-mono text-sm text-[#555] leading-relaxed">
          {m['privacy.contact_text']()}
        </p>
        <a href="mailto:{m.email()}" class="font-mono text-sm hover:text-[#FF3B00] transition-colors no-underline mt-2 inline-block">
          {m.email()}
        </a>
      </section>
    </div>
  </div>
</PageShell>
