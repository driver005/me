<script lang="ts">
	import { T } from '@threlte/core';
	import { OrbitControls, View } from '@threlte/extras';
	import CanvasPortal from '$lib/three/canvas/portal.svelte';
	import Juice from '$lib/three/models/juice.svelte';
	import * as Dialog from '$lib/ui/cn/dialog';

	/**
	 * Shallow Routing Logic
	 * We check if the 'modal' state exists in the history state.
	 */
	function handleOpenChange(open: boolean) {
		if (!open) {
			history.back();
		}
	}

	let viewContainer = $state<HTMLDivElement>();
</script>

<Dialog.Root open={true} onOpenChange={handleOpenChange}>
	<Dialog.Content class="max-w-3xl">
		<Dialog.Header>
			<Dialog.Title>Aesthetic Speaker</Dialog.Title>
			<Dialog.Description>
				An aesthetic speaker designed and modeled in Blender. Features a sleek, minimalist design
				with a matte black finish and subtle LED accents.
			</Dialog.Description>
		</Dialog.Header>

		<div
			bind:this={viewContainer}
			class="relative h-[50vh] w-full overflow-hidden rounded-xl bg-muted"
		>
			<div id="canvas" class="pointer-events-none absolute inset-0">
				<CanvasPortal>
					<View dom={viewContainer}>
						<T.PerspectiveCamera makeDefault position={[5, 5, 8]} fov={40}>
							<OrbitControls
								target={[0, 2.5, 0]}
								autoRotate
								enableZoom={false}
								enableRotate={false}
								enablePan={false}
								enableDamping
							/>
						</T.PerspectiveCamera>

						<T.AmbientLight intensity={0.5} />
						<T.DirectionalLight position={[10, 10, 5]} intensity={1.5} />
						<T.PointLight position={[-5, 5, -5]} intensity={1} color="blue" />

						<Juice>
							{#snippet error({ error }: { error: any })}
								<div class="flex h-full items-center justify-center text-red-500">
									{error.message}
								</div>
							{/snippet}

							{#snippet fallback()}
								<div class="flex h-full items-center justify-center">
									<p class="animate-pulse">Loading 3D Juice...</p>
								</div>
							{/snippet}
							{#snippet children()}{/snippet}
						</Juice>
					</View>
				</CanvasPortal>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
