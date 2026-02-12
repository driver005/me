<script lang="ts">
	export let url: string;
	export let alt: string;
	export let href: string;
</script>

<div class="absolute top-0 left-0 overflow-hidden rounded-xl">
	<a {href} class="block h-full w-full cursor-pointer overflow-hidden">
		<img
			src={url}
			{alt}
			class="h-full w-full object-cover grayscale-20 transition-all duration-500 group-hover:grayscale-0 hover:scale-105"
		/>
	</a>
</div>
