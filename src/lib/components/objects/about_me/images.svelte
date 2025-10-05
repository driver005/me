<script lang="ts">
  import { T } from '@threlte/core'
  import { DoubleSide } from 'three'
  import { ImageMaterial, Suspense } from '@threlte/extras'
  import * as THREE from 'three'

  let {
    start = 0
  }: {
    start?: number
  } = $props();

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

  const size = 10;
  const cell_size = size + 3;

  const numCols = urls_list[0].length
  const numRows = urls_list.length
  const offsetX = ((numCols - 1) * cell_size) / 2
  const offsetY = ((numRows - 1) * cell_size) / 2

  const Start = 60;
  const End = -60;

  let groupPosition = $derived.by(() => {
    return [-20, Start + (End - Start) * start, -5] as [number, number, number]
  });

  // const IMAGE_CURVE = new THREE.CatmullRomCurve3([
  //   new THREE.Vector3(-30, -40, 0),
  //   new THREE.Vector3(-30, 0, 0),
  //   new THREE.Vector3(-30, 40, 0)
  // ]);

// // Derived position based on start
//   const position = $derived.by(() => {
//     const p = IMAGE_CURVE.getPointAt(start);
//     return [p.x, p.y, p.z] as [number, number, number]
//   })

//   // Derived rotation based on start
//   const rotation = $derived.by(() => {
//     let tangent = IMAGE_CURVE.getPointAt(start).normalize();
//      // Use a fixed global up vector
//     const worldUp = new THREE.Vector3(0, 1, 0);
//     let right = new THREE.Vector3().crossVectors(worldUp, tangent).normalize();
//     let correctedUp = new THREE.Vector3().crossVectors(tangent, right).normalize();

//     let m = new THREE.Matrix4().makeBasis(right, correctedUp, tangent);
//     let euler = new THREE.Euler().setFromRotationMatrix(m, 'XYZ');
//     return [euler.x, euler.y, euler.z] as [number, number, number]
//   })
</script>

<T.Group position={groupPosition} rotation={[-THREE.MathUtils.degToRad(90), THREE.MathUtils.degToRad(90), THREE.MathUtils.degToRad(90)]}>
  <Suspense>
    {#each urls_list as row, rowIndex}
      {#each row as url, colIndex}
        <T.Mesh
          position={[
            colIndex * cell_size - offsetX,
            -(rowIndex * cell_size) + offsetY + colIndex * (start * 10),
            0
          ]}
        >
          <T.PlaneGeometry args={[size, size]} />
          <ImageMaterial url={url} side={DoubleSide} transparent radius={0.8} />
        </T.Mesh>
      {/each}
    {/each}
  </Suspense>
</T.Group>
