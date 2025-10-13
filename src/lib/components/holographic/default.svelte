<script lang="ts">
  import { T, useTask } from '@threlte/core'
  import { DoubleSide, FrontSide, TextureLoader } from 'three'
  import HolographicMaterial from './holographic_material'
  import type { ColorRepresentation, Side } from 'three'

  const {
    fresnelAmount = 0.7,
    fresnelOpacity = 1.0,
    blinkFresnelOnly = true,
    enableBlinking = true,
    enableAdditive = true,
    hologramBrightness = 1.6,
    scanlineSize = 3.7,
    signalSpeed = 0.18,
    hologramOpacity = 0.7,
    hologramColor = '#00d5ff',
    side = FrontSide,
    imageUrl = undefined
  } = $props<{
    fresnelAmount?: number
    fresnelOpacity?: number
    blinkFresnelOnly?: boolean
    enableBlinking?: boolean
    enableAdditive?: boolean
    hologramBrightness?: number
    scanlineSize?: number
    signalSpeed?: number
    hologramOpacity?: number
    hologramColor?: ColorRepresentation
    side?: Side
    imageUrl?: number
  }>()

  let texture;
  if(imageUrl) {
    texture = new TextureLoader().load(imageUrl)
  }

  const material = new HolographicMaterial({
    fresnelAmount,
    fresnelOpacity,
    hologramBrightness,
    scanlineSize,
    signalSpeed,
    hologramColor,
    hologramOpacity,
    blinkFresnelOnly,
    enableBlinking,
    side,
    texture,
  })

  // Call update() on every frame
  useTask(() => {
    material?.update()
  })
</script>

<T
  is={material}
/>
