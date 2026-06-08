<script lang="ts">
  import SmoothScroll from '$lib/ui/module/smooth-scroll.svelte';
  import Cursor from '$lib/ui/module/cursor.svelte';
  import ScrollProgress from '$lib/ui/module/scroll-progress.svelte';
  import Nav from '$lib/ui/module/nav.svelte';
  import Hero from '$lib/ui/module/hero.svelte';
  import About from '$lib/ui/module/about.svelte';
  import Gallery from '$lib/ui/module/gallery.svelte';
  import Works from '$lib/ui/module/works.svelte';
  import Spiral from '$lib/ui/module/spiral.svelte';
  import Services from '$lib/ui/module/services.svelte';
  import HorizontalScroll from '$lib/ui/module/horizontal-scroll.svelte';
  import Contact from '$lib/ui/module/contact.svelte';
  import Footer from '$lib/ui/module/footer.svelte';
  import Divider from '$lib/ui/module/divider.svelte';

  const CREAM = '#F3F2EE';
  const DARK = '#0A0A0A';
</script>

<SmoothScroll>
  <div class="App grain min-h-screen bg-[#F3F2EE] text-[#0A0A0A]">
    <Cursor />
    <ScrollProgress />
    <Nav />
    <main>
      <Hero />
      <!-- <Divider from={DARK} to={CREAM} /> -->
      <About />
      <!-- <Divider from={CREAM} to={DARK} /> -->
      <Gallery />
      <!-- <Divider from={DARK} to={CREAM} /> -->
      <Works />
      <!-- <Divider from={CREAM} to={DARK} /> -->
      <Spiral />
      <!-- <Divider from={DARK} to={CREAM} /> -->
      <Services />
      <HorizontalScroll />
      <Contact />
    </main>
    <Footer />
  </div>
</SmoothScroll>
