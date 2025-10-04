<script>
	import { useLoader } from "@threlte/core";
	import { Environment } from "@threlte/extras";
	import { EquirectangularReflectionMapping, TextureLoader } from "three";

  const { load } = useLoader(TextureLoader)
  const map = load('/textures/nebula.jpg', {
    transform(texture) {
      texture.mapping = EquirectangularReflectionMapping
      return texture
    }
  })
</script>

{#await map then texture}
  <Environment
    isBackground
    {texture}
  />
{/await}