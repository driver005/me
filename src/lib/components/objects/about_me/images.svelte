<script lang="ts">
  import { T } from '@threlte/core'
  import { DoubleSide, MathUtils } from 'three'
  import { ImageMaterial, Suspense } from '@threlte/extras'
  import * as THREE from 'three'

  const IMAGE_CURVE = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 10, 0),
    new THREE.Vector3(-10, 0, 0),
    new THREE.Vector3(0, -10, 0)
  ]);

  const urls_list: string[][] = [
    [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Caravaggio_-_Boy_Bitten_by_a_Lizard.jpg/762px-Caravaggio_-_Boy_Bitten_by_a_Lizard.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/The_Large_Plane_Trees_%28Road_Menders_at_Saint-R%C3%A9my%29%2C_by_Vincent_van_Gogh%2C_Cleveland_Museum_of_Art%2C_1947.209.jpg/963px-The_Large_Plane_Trees_%28Road_Menders_at_Saint-R%C3%A9my%29%2C_by_Vincent_van_Gogh%2C_Cleveland_Museum_of_Art%2C_1947.209.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Antoine_Vollon_-_Mound_of_Butter_-_National_Gallery_of_Art.jpg/935px-Antoine_Vollon_-_Mound_of_Butter_-_National_Gallery_of_Art.jpg',
    ],
    [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/KlimtDieJungfrau.jpg/803px-KlimtDieJungfrau.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/The_Denial_of_St._Peter_-_Gerard_Seghers_-_Google_Cultural_Institute.jpg/1024px-The_Denial_of_St._Peter_-_Gerard_Seghers_-_Google_Cultural_Institute.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/De_bedreigde_zwaan_Rijksmuseum_SK-A-4.jpeg/911px-De_bedreigde_zwaan_Rijksmuseum_SK-A-4.jpeg'
    ],
  ]

  const cellSize = 1.2
  const numCols = urls_list[0].length
  const numRows = urls_list.length
  const offsetX = ((numCols - 1) * cellSize) / 2
  const offsetY = ((numRows - 1) * cellSize) / 2

  let {
    start = 0
  }: {
    start?: number
  } = $props();


// Derived position based on start
  const position = $derived.by(() => {
    const p = IMAGE_CURVE.getPointAt(start)
    return [p.x, p.y, p.z] as [number, number, number]
  })

  // Derived rotation based on start
  const rotation = $derived.by(() => {
    let tangent = new THREE.Vector3(0, -1, 0);
    console.log("tangent:", tangent);
    let up = new THREE.Vector3(1, 0, 0)
    let right = new THREE.Vector3().crossVectors(up, tangent).normalize()
    console.log("right:", right);
    let correctedUp = new THREE.Vector3().crossVectors(tangent, right).normalize()
    console.log("correctedUp:", correctedUp);

    let m = new THREE.Matrix4().makeBasis(right, correctedUp, tangent)
    console.log("m:", m);
    let euler = new THREE.Euler().setFromRotationMatrix(m, 'XYZ')
    console.log("euler:",correctedUp);
    return [euler.x, euler.y, euler.z] as [number, number, number]
  })
</script>

<T.Group position={position} rotation={rotation}>
  <Suspense>
    {#each urls_list as row, rowIndex}
      {#each row as url, colIndex}
        <T.Mesh
          position={[
            colIndex * cellSize - offsetX,
            -(rowIndex * cellSize) + offsetY,
            0
          ]}
        >
          <T.PlaneGeometry args={[1, 1]} />
          <ImageMaterial url={url} side={DoubleSide} transparent />
        </T.Mesh>
      {/each}
    {/each}
  </Suspense>
</T.Group>
