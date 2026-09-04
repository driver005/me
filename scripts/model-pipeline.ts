import { execSync } from "node:child_process"
import { copyFileSync, existsSync, mkdirSync, readdirSync, renameSync, unlinkSync } from "node:fs"
import { join, resolve } from "node:path"
import { exit } from "node:process"

/**
 * This script is used to transform gltf and glb files into Threlte components.
 * It uses the `@threlte/gltf` package to do so.
 * It works in two steps:
 * 1. Transform the gltf/glb files located in the sourceDir directory
 * 2. Move the Threlte components to the targetDir directory
 */
const configuration = {
  sourceDir: resolve(join("static", "models")),
  targetDir: resolve(join("src", "lib", "models")),
  overwrite: true,
  root: "/models/",
  types: false,
  keepnames: true,
  meta: true,
  shadows: true,
  printwidth: 120,
  precision: 2,
  draco: "./",
  preload: true,
  suspense: true,
  isolated: true,
  transform: {
    enabled: true,
    resolution: 1024,
    simplify: {
      enabled: true,
      weld: 0.0001,
      ratio: 0.75,
      error: 0.001
    }
  },
  // KTX2/Basis Universal texture resolution for the extra compression pass below — lower than
  // `transform.resolution` on purpose: KTX2's own on-GPU footprint is dominated by resolution (a
  // fixed bits-per-pixel format, unlike webp/jpeg — quality settings barely move the needle), so this
  // is the actual lever for keeping the KTX2-compressed download size reasonable.
  ktxTextureSize: 512
} as const

// if the target directory doesn"t exist, create it
mkdirSync(configuration.targetDir, { recursive: true })

// throw error if source directory doesn"t exist
if (!existsSync(configuration.sourceDir)) {
  throw new Error(`Source directory ${configuration.sourceDir} doesn"t exist.`)
}

// read the directory, filter for .glb and .gltf files and files *not* ending
// with -transformed.gltf or -transformed.glb as these should not be transformed
// again.
const gltfFiles = readdirSync(configuration.sourceDir).filter((file) => {
  return (
    (file.endsWith(".glb") || file.endsWith(".gltf")) &&
    !file.endsWith("-transformed.gltf") &&
    !file.endsWith("-transformed.glb")
  )
})

if (gltfFiles.length === 0) {
  console.log("No gltf or glb files found.")
  exit()
}

const filteredGltfFiles = gltfFiles.filter((file) => {
  if (!configuration.overwrite) {
    const componentFilename = file.split(".").slice(0, -1).join(".") + ".svelte"
    const componentPath = join(configuration.targetDir, componentFilename)
    if (existsSync(componentPath)) {
      console.error(`File ${componentPath} already exists, skipping.`)
      return false
    }
  }
  return true
})

if (filteredGltfFiles.length === 0) {
  console.log("No gltf or glb files to process.")
  exit()
}

filteredGltfFiles.forEach((file) => {
  // run the gltf transform command on every file
  const path = join(configuration.sourceDir, file)

  // parse the configuration
  const args: string[] = []
  if (configuration.root) args.push(`--root ${configuration.root}`)
  if (configuration.types) args.push("--types")
  if (configuration.keepnames) args.push("--keepnames")
  if (configuration.meta) args.push("--meta")
  if (configuration.shadows) args.push("--shadows")
  args.push(`--printwidth ${configuration.printwidth}`)
  args.push(`--precision ${configuration.precision}`)
  if (configuration.draco) args.push(`--draco ${configuration.draco}`)
  if (configuration.preload) args.push("--preload")
  if (configuration.suspense) args.push("--suspense")
  if (configuration.isolated) args.push("--isolated")
  if (configuration.transform.enabled) {
    args.push(`--transform`)
    args.push(`--resolution ${configuration.transform.resolution}`)
    if (configuration.transform.simplify.enabled) {
      args.push(`--simplify`)
      args.push(`--weld ${configuration.transform.simplify.weld}`)
      args.push(`--ratio ${configuration.transform.simplify.ratio}`)
      args.push(`--error ${configuration.transform.simplify.error}`)
    }
  }
  const formattedArgs = args.join(" ")

  console.log(`Running command: npx @threlte/gltf@next ${path} ${formattedArgs}`)

  // run the command
  const cmd = `npx @threlte/gltf@next ${path} ${formattedArgs}`
  try {
    execSync(cmd, {
      cwd: configuration.sourceDir
    })
  } catch (error) {
    console.error(`Error transforming model: ${error}`)
  }
})

// Extra compression pass on top of @threlte/gltf's own --transform, in two steps:
//
// 1. Convert every texture to PNG first (`gltf-transform png --formats "*"`). Sounds backwards for a
//    *compression* pass, but it's required: @threlte/gltf's own --transform already re-encodes
//    textures as WebP, and gltf-transform's own `etc1s`/`uastc`/`ktx2` texture-compress step can only
//    read PNG/JPEG source pixels — fed WebP directly, it silently skips every texture with a
//    "unsupported texture type" warning and produces a KTX2 file with none of the textures actually
//    converted. Confirmed by hand: chaining png-convert before ktx2-compress is the only way that
//    doesn't hit that skip.
// 2. Run the real optimization: dedup, prune, resample, sparse, KTX2/Basis Universal (ETC1S) texture
//    compression at `ktxTextureSize`, and a final draco re-encode. Deliberately NOT using
//    --join/--palette/--instance/--simplify/--weld here: those merge or rename meshes and materials,
//    verified (by hand, comparing node/material name lists before and after) to silently erase the
//    exact substring-matched names room.ts depends on for its own special-cased meshes (hour/minute
//    hands, joint visibility, tv/auxdisplay video screens, glass/water/leathercracked material swaps).
//    --prune-attributes false is required for the same kind of reason: the tv/auxdisplay materials in
//    the source GLB carry no baked texture (room.ts assigns their real video texture at runtime, via
//    create_video_texture() — see setupNode()), so from gltf-transform's own point of view their
//    TEXCOORD_0 attribute looks unused and its default prune pass deletes it outright. Confirmed by
//    hand: a model built without this flag has zero UV coordinates on those two meshes, which is what
//    made the video render at the wrong size/mapping once this pipeline started using --compress draco
//    (draco re-encoding runs through the same optimize() call, so the prune happens right alongside it).
//
// KTX2 keeps textures compressed on the GPU instead of decompressing fully into VRAM the way WebP/PNG
// do — roughly a 10x reduction in resident texture memory (a 1024x1024 texture that cost ~5.6MB of
// VRAM as WebP costs well under 1MB as ETC1S). Requires the `toktx` binary (from Khronos'
// KTX-Software) on PATH — see README.md's own requirements note; this step is skipped with a clear
// error if it's missing rather than silently producing a broken model.
const transformedGlbFiles = readdirSync(configuration.sourceDir).filter(
  (file) => file.endsWith("-transformed.glb") || file.endsWith("-transformed.gltf")
)
transformedGlbFiles.forEach((file) => {
  const path = join(configuration.sourceDir, file)
  const pngPath = `${path}.png-tmp`
  const ktxPath = `${path}.ktx-tmp`

  const pngCmd = `npx gltf-transform png ${path} ${pngPath} --formats "*"`
  const ktxCmd =
    `npx gltf-transform optimize ${pngPath} ${ktxPath} --compress draco --texture-compress ktx2 ` +
    `--texture-size ${configuration.ktxTextureSize} --flatten false --join false --palette false ` +
    `--instance false --simplify false --weld false --prune-attributes false`

  console.log(`Running command: ${pngCmd}`)
  console.log(`Running command: ${ktxCmd}`)
  try {
    execSync(pngCmd, { cwd: configuration.sourceDir })
    execSync(ktxCmd, { cwd: configuration.sourceDir })
    renameSync(ktxPath, path)

    // Both `gltf-transform png` and `gltf-transform optimize` here write glTF-JSON-plus-external-
    // resources (their own output filenames — .png-tmp/.ktx-tmp — don't end in a literal .glb, which
    // is what steers gltf-transform into that mode instead of a single self-contained binary file) —
    // confirmed by hand: `file home-transformed.glb` reports "JSON text data", and its own `images[]`
    // all point at loose sibling .ktx2 files sitting right next to it. That's fine at runtime (this
    // app serves everything under static/ as-is, and GLTFLoader resolves relative image URIs against
    // the manifest's own URL), but the FIRST (png) step's own loose per-texture .png siblings
    // (baseColor_1.png, emissive_1.png, etc.) are pure intermediate waste — superseded by the SECOND
    // step's .ktx2 files, never referenced by the final manifest, confirmed by grepping its own
    // `images[].uri` list. Left uncleaned they were quietly shipping ~6MB of dead files into static/.
    const staleTextures = readdirSync(configuration.sourceDir).filter((f) => f.endsWith(".png"))
    for (const stale of staleTextures) unlinkSync(join(configuration.sourceDir, stale))
  } catch (error) {
    console.error(
      `Error compressing transformed model (is 'toktx' from KTX-Software installed and on PATH? ` +
        `see README.md): ${error}`
    )
  } finally {
    if (existsSync(pngPath)) unlinkSync(pngPath)
  }
})

// read dir again, but search for .svelte files only.
const svelteFiles = readdirSync(configuration.sourceDir).filter((file) => file.endsWith(".svelte"))

svelteFiles.forEach((file) => {
  // now move every file to /src/components/models
  const path = join(configuration.sourceDir, file)
  const newPath = join(configuration.targetDir, file)
  copyFile: try {
    // Sanity check, we checked earlier if the file exists. Still, the CLI takes
    // a while, so who knows what happens in the meantime.
    if (!configuration.overwrite) {
      // check if file already exists
      if (existsSync(newPath)) {
        console.error(`File ${newPath} already exists, skipping.`)
        break copyFile
      }
    }
    copyFileSync(path, newPath)
  } catch (error) {
    console.error(`Error copying file: ${error}`)
  }

  // remove the file from /static/models
  try {
    unlinkSync(path)
  } catch (error) {
    console.error(`Error removing file: ${error}`)
  }
})
