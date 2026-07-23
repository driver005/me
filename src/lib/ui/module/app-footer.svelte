<script lang="ts">
  import { m } from '$lib/paraglide/messages';
  import { social_links, socialLabels } from '$lib/data';
  import { SiGithub, SiInstagram, SiX } from '@icons-pack/svelte-simple-icons';
  import { Briefcase, Rss, Mail } from 'lucide-svelte';
  import { useBerlinTime } from '$lib/util/berlin-time.svelte';

  const berlinTime = useBerlinTime();

  const socials = [
    { icon: SiGithub, href: social_links.github, label: socialLabels.github },
    { icon: SiX, href: social_links.twitter, label: socialLabels.x },
    { icon: SiInstagram, href: social_links.instagram, label: socialLabels.instagram },
    { icon: Briefcase, href: social_links.linkedin, label: socialLabels.linkedin },
    { icon: Rss, href: social_links.blog, label: socialLabels.blog },
    { icon: Mail, href: `mailto:${m.email()}`, label: socialLabels.email },
  ];

  const year = new Date().getFullYear();
</script>

<footer class="bg-[#0A0A0A] text-[#F3F2EE]">
  <div class="px-4 sm:px-8 pt-16 pb-6">
    <div class="font-display uppercase text-[22vw] sm:text-[18vw] leading-[0.8] tracking-tighter select-none overflow-hidden">
      <span
        style="-webkit-text-stroke: 1.5px #F3F2EE; color: transparent; display: block;"
      >
        {m['name.first']()}Fern<span class="text-[#FF3B00]" style="-webkit-text-stroke: 0;">á</span>ndez
      </span>
    </div>

    <div class="mt-12 grid grid-cols-12 border-t border-[#F3F2EE]/20 pt-6 gap-4">
      <div class="col-span-6 sm:col-span-3">
        <span class="font-mono text-[10px] uppercase tracking-[0.25em] text-[#F3F2EE]/60">
          &copy; {year} {m['footer.copyright']()}
        </span>
        <div class="font-mono text-sm mt-2 text-[#F3F2EE]/70">
          {m['footer.rights']()}
        </div>
      </div>
      <div class="col-span-6 sm:col-span-3">
        <span class="font-mono text-[10px] uppercase tracking-[0.25em] text-[#F3F2EE]/60">
          {m['footer.berlin_time']()}
        </span>
        <div class="font-mono text-sm mt-2 text-[#F3F2EE]/70">
          {berlinTime.value} {m['footer.clock_suffix']()}
        </div>
      </div>
      <div class="col-span-6 sm:col-span-3">
        <span class="font-mono text-[10px] uppercase tracking-[0.25em] text-[#F3F2EE]/60">
          {m['footer.built_with']()}
        </span>
        <div class="font-mono text-sm mt-2 text-[#F3F2EE]/50">
          {@html m['footer.tech_stack']()}
        </div>
      </div>
      <div class="col-span-6 sm:col-span-3 sm:text-right">
        <span class="font-mono text-[10px] uppercase tracking-[0.25em] text-[#F3F2EE]/60">
          {m['footer.top']()}
        </span>
        <div class="mt-2">
				<a
					href="/"
					class="font-mono text-sm hover:text-[#FF3B00] text-[#F3F2EE]/70 no-underline transition-colors duration-500 ease-[var(--ease-out-expo)]"
				>
            {m['footer.back_to_start']()}
          </a>
        </div>
      </div>
    </div>

    <div class="mt-8 pt-4 border-t border-[#F3F2EE]/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        {#each socials as s}
				<a
					href={s.href}
					target="_blank"
					rel="noopener noreferrer"
					class="text-[#F3F2EE]/40 hover:text-[#FF3B00] transition-colors duration-500 ease-[var(--ease-out-expo)]"
					aria-label={s.label}
				>
            <s.icon size={18} />
          </a>
        {/each}
      </div>
      <div class="flex gap-4">
			<a
				href="/imprint"
				class="font-mono text-[9px] uppercase tracking-[0.3em] text-[#F3F2EE]/25 hover:text-[#FF3B00] transition-colors duration-500 ease-[var(--ease-out-expo)] no-underline"
			>
				{m['app_nav.imprint']()}
			</a>
			<a
				href="/privacy"
				class="font-mono text-[9px] uppercase tracking-[0.3em] text-[#F3F2EE]/25 hover:text-[#FF3B00] transition-colors duration-500 ease-[var(--ease-out-expo)] no-underline"
			>
          {m['app_nav.privacy']()}
        </a>
      </div>
    </div>

    <div class="mt-4 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
      <span class="font-mono text-[9px] uppercase tracking-[0.3em] text-[#F3F2EE]/25">
        {m['footer.credit']()}
      </span>
      <span class="font-mono text-[9px] uppercase tracking-[0.3em] text-[#F3F2EE]/25">
        {m['footer.end']()}
      </span>
    </div>
  </div>
</footer>
