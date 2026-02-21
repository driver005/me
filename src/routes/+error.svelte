<script>
	import { page } from '$app/state';
	import { m } from '$lib/paraglide/messages';
</script>

<h1>{page.status}: {m['error.title']()}</h1>
<p>{page.error?.message || m['error.description']()}</p>
<a href="/">{m['error.link']()}</a>
