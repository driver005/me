<script lang="ts">
  let { text = '', class: className = '', style = '' }: {
    text: string;
    class?: string;
    style?: string;
  } = $props();

  const CHARS = '!<>-_\\/[]{}—=+*^?#________';

  let display = $state(text);
  let frame = 0;
  let queue: Array<{ from: string; to: string; start: number; end: number; char: string }> = [];
  let rafId: number | null = null;

  $effect(() => {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    display = text;
  });

  $effect(() => {
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  });

  function randChar() {
    return CHARS[Math.floor(Math.random() * CHARS.length)];
  }

  function update() {
    let output = '';
    let complete = 0;
    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      if (frame >= item.end) {
        complete++;
        output += item.to;
      } else if (frame >= item.start) {
        if (!item.char || Math.random() < 0.28) {
          item.char = randChar();
        }
        output += `<span class="opacity-70">${item.char}</span>`;
      } else {
        output += item.from;
      }
    }
    display = output;
    if (complete === queue.length) {
      rafId = null;
      return;
    }
    frame++;
    rafId = requestAnimationFrame(update);
  }

  function scramble(target: string) {
    const old = display.replace(/<[^>]+>/g, '');
    const length = Math.max(old.length, target.length);
    queue = Array.from({ length }, (_, i) => ({
      from: old[i] ?? '',
      to: target[i] ?? '',
      start: Math.floor(Math.random() * 18),
      end: Math.floor(Math.random() * 18) + Math.floor(Math.random() * 18) + 6,
      char: '',
    }));
    if (rafId) cancelAnimationFrame(rafId);
    frame = 0;
    update();
  }

  function onEnter() { scramble(text); }
  function onLeave() { scramble(text); }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<span
  class={className}
  {style}
  onmouseenter={onEnter}
  onmouseleave={onLeave}
>
  {@html display}
</span>
