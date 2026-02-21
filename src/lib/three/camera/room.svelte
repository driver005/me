<script lang="ts">
	import { T } from '@threlte/core';
	import { OrbitControls } from '@threlte/extras';
	import * as THREE from 'three';
</script>

<T.PerspectiveCamera makeDefault position={[3.5, 3, 2.5]} fov={55}>
	<OrbitControls
		target={[0, 0.5, -0.5]}
		enablePan={false}
		mouseButtons={{
			LEFT: THREE.MOUSE.ROTATE,
			MIDDLE: THREE.MOUSE.DOLLY,
			RIGHT: undefined
		}}
		enableZoom
		enableRotate
		enableDamping
		dampingFactor={0.05}
		minDistance={3}
		maxDistance={10}
		minPolarAngle={0}
		maxPolarAngle={Math.PI / 2}
		minAzimuthAngle={0}
		maxAzimuthAngle={Math.PI / 2}
	/>
</T.PerspectiveCamera>
