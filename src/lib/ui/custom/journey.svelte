<script lang="ts">
	import { journey } from '$lib/data';
	import { Features } from '$lib/ui/module';

	let journeyData = journey.map((item, i) => ({
		id: i + 1,
		title: item.name,
		content: `<li>${item.text}</li><li>${item.time}</li>`,
		image: item.image
	}));
</script>

<Features data={journeyData} />
