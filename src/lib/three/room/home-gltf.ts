import type * as THREE from 'three';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Node/material/animation names extracted straight from `static/models/home-transformed.glb`'s own
 * codegen output — both `@threlte/gltf --types` and `pmndrs/gltfjsx --types` produce this identical
 * shape (same underlying @gltf-transform pipeline, same source file), neither can emit plain TS: both
 * only know how to emit a Svelte/React *component*. This file is that same type data, lifted out by
 * hand into a framework-free `.ts` — the actual ceiling of what "auto-generate a home.ts" can mean
 * here. Regenerate by rerunning (from `static/models/`):
 *
 *   npx @threlte/gltf@3.0.0-next.11 home.glb --root /models/ --keepnames --meta --shadows \
 *     --printwidth 120 --precision 2 --draco ./ --preload --suspense --isolated --transform \
 *     --resolution 1024 --simplify --weld 0.0001 --ratio 0.75 --error 0.001 --types
 *
 * and re-copying its `ActionName`/`nodes`/`materials` block below whenever the source .glb changes.
 */
export type HomeActionName =
	| 'MilkMoveUp'
	| 'PotionMoveX'
	| 'SpeakerMoveUp'
	| 'Rotor_XAction'
	| 'Rotor_YAction'
	| 'FishAction'
	| 'ChairAction'
	| 'JuiceMoveUp'
	| 'CassetRotate'
	| 'Bed';

export interface HomeGLTFNodes {
	SpaceMilk_2: THREE.Mesh;
	SpaceMilk_3: THREE.Mesh;
	SpaceMilk_4: THREE.Mesh;
	SpaceMilk_5: THREE.Mesh;
	SpaceMilk_6: THREE.Mesh;
	SpaceMilk_7: THREE.Mesh;
	SpaceMilk_8: THREE.Mesh;
	SpaceMilk_9: THREE.Mesh;
	SpacePotion_2: THREE.Mesh;
	SpacePotion_3: THREE.Mesh;
	SpacePotion_4: THREE.Mesh;
	SpacePotion_5: THREE.Mesh;
	SpacePotion_6: THREE.Mesh;
	SpacePotion_7: THREE.Mesh;
	SpacePotion_8: THREE.Mesh;
	SpacePotion_9: THREE.Mesh;
	SpaceSpeaker_2: THREE.Mesh;
	SpaceSpeaker_3: THREE.Mesh;
	SpaceSpeaker_4: THREE.Mesh;
	SpaceSpeaker_5: THREE.Mesh;
	SpaceSpeaker_6: THREE.Mesh;
	SpaceSpeaker_7: THREE.Mesh;
	SpaceSpeaker_8: THREE.Mesh;
	SpaceSpeaker_9: THREE.Mesh;
	SpaceSpeaker_10: THREE.Mesh;
	SpaceSpeaker_11: THREE.Mesh;
	PC_2: THREE.Mesh;
	PC_3: THREE.Mesh;
	PC_4: THREE.Mesh;
	PC_5: THREE.Mesh;
	Rotor_1: THREE.Mesh;
	Rotor_2: THREE.Mesh;
	Rotor_3: THREE.Mesh;
	Rotor_4: THREE.Mesh;
	Rotor_5: THREE.Mesh;
	Bowl: THREE.Mesh;
	Fish: THREE.Mesh;
	Eye_1: THREE.Mesh;
	Eye_2: THREE.Mesh;
	Water: THREE.Mesh;
	ChairTop: THREE.Mesh;
	ChairTop_1: THREE.Mesh;
	ChairLegs_1: THREE.Mesh;
	ChairLegs_2: THREE.Mesh;
	SpaceJuice_2: THREE.Mesh;
	SpaceJuice_3: THREE.Mesh;
	SpaceJuice_4: THREE.Mesh;
	SpaceJuice_5: THREE.Mesh;
	SpaceJuice_6: THREE.Mesh;
	SpaceJuice_7: THREE.Mesh;
	SpaceJuice_8: THREE.Mesh;
	SpaceJuice_9: THREE.Mesh;
	SpaceJuice_10: THREE.Mesh;
	SpaceJuice_11: THREE.Mesh;
	SpaceJuice_12: THREE.Mesh;
	SpaceCasset_2: THREE.Mesh;
	SpaceCasset_3: THREE.Mesh;
	SpaceCasset_4: THREE.Mesh;
	SpaceCasset_5: THREE.Mesh;
	SpaceCasset_6: THREE.Mesh;
	SpaceCasset_7: THREE.Mesh;
	SpaceCasset_8: THREE.Mesh;
	SpaceCasset_9: THREE.Mesh;
	Kirby_1: THREE.Mesh;
	Laptop_2: THREE.Mesh;
	Laptop_3: THREE.Mesh;
	Laptop_4: THREE.Mesh;
	Laptop_5: THREE.Mesh;
	Laptop_6: THREE.Mesh;
	Cube006: THREE.Mesh;
	Cube006_1: THREE.Mesh;
	Cube006_2: THREE.Mesh;
	Cube004: THREE.Mesh;
	Cube004_1: THREE.Mesh;
	Joint_1: THREE.Mesh;
	Joint_2: THREE.Mesh;
	Joint_3: THREE.Mesh;
	SpacePanda_1: THREE.SkinnedMesh;
	GitHub_1: THREE.Mesh;
	GitHub_2: THREE.Mesh;
	Blog_1: THREE.Mesh;
	Blog_2: THREE.Mesh;
	Twitter_1: THREE.Mesh;
	Twitter_2: THREE.Mesh;
	LinkedIn_1: THREE.Mesh;
	LinkedIn_2: THREE.Mesh;
	Instagram_1: THREE.Mesh;
	Instagram_2: THREE.Mesh;
	Home_1: THREE.Mesh;
	Home_2: THREE.Mesh;
	Home_3: THREE.Mesh;
	Home_4: THREE.Mesh;
	Home_5: THREE.Mesh;
	Home_6: THREE.Mesh;
	Home_7: THREE.Mesh;
	Home_8: THREE.Mesh;
	Home_9: THREE.Mesh;
	Home_10: THREE.Mesh;
	Home_11: THREE.Mesh;
	Home_12: THREE.Mesh;
	Home_13: THREE.Mesh;
	Home_14: THREE.Mesh;
	Home_15: THREE.Mesh;
	Home_16: THREE.Mesh;
	Home_17: THREE.Mesh;
	Home_18: THREE.Mesh;
	Home_19: THREE.Mesh;
	Home_20: THREE.Mesh;
	Home_21: THREE.Mesh;
	Home_22: THREE.Mesh;
	Home_23: THREE.Mesh;
	Home_24: THREE.Mesh;
	Home_25: THREE.Mesh;
	Home_26: THREE.Mesh;
	Home_27: THREE.Mesh;
	Home_28: THREE.Mesh;
	Home_29: THREE.Mesh;
	Home_30: THREE.Mesh;
	Home_31: THREE.Mesh;
	Home_32: THREE.Mesh;
	Home_33: THREE.Mesh;
	Home_34: THREE.Mesh;
	Home_35: THREE.Mesh;
	Home_36: THREE.Mesh;
	Home_37: THREE.Mesh;
	Home_38: THREE.Mesh;
	Home_39: THREE.Mesh;
	Home_40: THREE.Mesh;
	Home_41: THREE.Mesh;
	Home_42: THREE.Mesh;
	Plane: THREE.Mesh;
	Plane_1: THREE.Mesh;
	Plane_2: THREE.Mesh;
	Plane_3: THREE.Mesh;
	spine: THREE.Bone;
}

export interface HomeGLTFMaterials {
	spacemilk: THREE.MeshStandardMaterial;
	lightpink: THREE.MeshStandardMaterial;
	'Material.004': THREE.MeshBasicMaterial;
	'lightpurple gradient edge': THREE.MeshStandardMaterial;
	'magic gradient': THREE.MeshStandardMaterial;
	'translucent top': THREE.MeshStandardMaterial;
	'purple gradient': THREE.MeshStandardMaterial;
	'Material.002': THREE.MeshStandardMaterial;
	'liquid outline cork': THREE.MeshStandardMaterial;
	rendered: THREE.MeshBasicMaterial;
	reflection: THREE.MeshStandardMaterial;
	'liquid outline': THREE.MeshStandardMaterial;
	glass: THREE.MeshPhysicalMaterial;
	cork: THREE.MeshStandardMaterial;
	'space liquid': THREE.MeshStandardMaterial;
	outline: THREE.MeshStandardMaterial;
	liquid: THREE.MeshStandardMaterial;
	top: THREE.MeshStandardMaterial;
	'highlights side': THREE.MeshStandardMaterial;
	'highlights top': THREE.MeshStandardMaterial;
	magic: THREE.MeshStandardMaterial;
	bass: THREE.MeshStandardMaterial;
	'liquid.001': THREE.MeshStandardMaterial;
	bottom: THREE.MeshStandardMaterial;
	Computer: THREE.MeshStandardMaterial;
	Glass: THREE.MeshStandardMaterial;
	Exhaust: THREE.MeshStandardMaterial;
	BasePurple: THREE.MeshStandardMaterial;
	BaseWhite: THREE.MeshStandardMaterial;
	Goldfish: THREE.MeshStandardMaterial;
	Eyeball: THREE.MeshStandardMaterial;
	WaterHigherTransparency: THREE.MeshPhysicalMaterial;
	ChairCushion: THREE.MeshStandardMaterial;
	ChairGray: THREE.MeshStandardMaterial;
	BaseBlack: THREE.MeshStandardMaterial;
	liquidtop: THREE.MeshStandardMaterial;
	'Outline.001': THREE.MeshStandardMaterial;
	box_base: THREE.MeshStandardMaterial;
	IMG_1142: THREE.MeshStandardMaterial;
	Material: THREE.MeshStandardMaterial;
	'light green layerweight': THREE.MeshStandardMaterial;
	'Outline.003': THREE.MeshStandardMaterial;
	dots: THREE.MeshStandardMaterial;
	'dark purple line': THREE.MeshStandardMaterial;
	recyclabe: THREE.MeshStandardMaterial;
	Render: THREE.MeshStandardMaterial;
	transparent: THREE.MeshStandardMaterial;
	metal_refl: THREE.MeshStandardMaterial;
	'dark purple': THREE.MeshStandardMaterial;
	circle: THREE.MeshStandardMaterial;
	text: THREE.MeshStandardMaterial;
	Kirby: THREE.MeshStandardMaterial;
	LaptopBase: THREE.MeshStandardMaterial;
	LaptopKeys: THREE.MeshStandardMaterial;
	LaptopTouchpad: THREE.MeshStandardMaterial;
	LaptopIntel: THREE.MeshStandardMaterial;
	LaptopDetail: THREE.MeshStandardMaterial;
	LaptopLigth: THREE.MeshStandardMaterial;
	LaptopDisplay: THREE.MeshStandardMaterial;
	JointFire: THREE.MeshStandardMaterial;
	JointPaper: THREE.MeshStandardMaterial;
	JointTip: THREE.MeshStandardMaterial;
	SpacePanda: THREE.MeshStandardMaterial;
	GithubLogo: THREE.MeshStandardMaterial;
	LightWooden: THREE.MeshStandardMaterial;
	BlogLogo: THREE.MeshStandardMaterial;
	TwitterLogo: THREE.MeshStandardMaterial;
	LinkedInMaterial: THREE.MeshStandardMaterial;
	InstagramLogo: THREE.MeshStandardMaterial;
	LeatherCracked: THREE.MeshStandardMaterial;
	WoodDark: THREE.MeshStandardMaterial;
	WoodLast: THREE.MeshStandardMaterial;
	GucciBase: THREE.MeshStandardMaterial;
	GucciGold: THREE.MeshStandardMaterial;
	Cartton: THREE.MeshStandardMaterial;
	CarttonHandle: THREE.MeshStandardMaterial;
	CarttonCap: THREE.MeshStandardMaterial;
	TV: THREE.MeshStandardMaterial;
	PlasticBasicBlack: THREE.MeshStandardMaterial;
	Cover_3: THREE.MeshStandardMaterial;
	Cover_1: THREE.MeshStandardMaterial;
	Cover_2: THREE.MeshStandardMaterial;
	Cover_4: THREE.MeshStandardMaterial;
	Keyboard: THREE.MeshStandardMaterial;
	BaseBlueTwo: THREE.MeshStandardMaterial;
	BaseBrown: THREE.MeshStandardMaterial;
	BigPicture: THREE.MeshStandardMaterial;
	WoodLight: THREE.MeshStandardMaterial;
	LampShade: THREE.MeshStandardMaterial;
	LampBase: THREE.MeshStandardMaterial;
	LampLigth: THREE.MeshStandardMaterial;
	Dust: THREE.MeshStandardMaterial;
	TextMaterial: THREE.MeshStandardMaterial;
	P1SColor: THREE.MeshStandardMaterial;
	Emission: THREE.MeshStandardMaterial;
	FabricWeaved: THREE.MeshStandardMaterial;
	MePicture: THREE.MeshStandardMaterial;
	LightBase: THREE.MeshStandardMaterial;
	StringLigth: THREE.MeshStandardMaterial;
	FabricWeavedDark: THREE.MeshStandardMaterial;
	SmallPicture: THREE.MeshStandardMaterial;
	Cactus: THREE.MeshStandardMaterial;
	'Modern Fiberstone': THREE.MeshStandardMaterial;
	GardenSoil: THREE.MeshStandardMaterial;
	AuxWoodLast: THREE.MeshStandardMaterial;
	RubberBumpy: THREE.MeshStandardMaterial;
	AuxDisplay: THREE.MeshStandardMaterial;
	ClockHour: THREE.MeshStandardMaterial;
	ClockMinute: THREE.MeshStandardMaterial;
}

/** Vanilla `GLTFLoader`'s own result plus the `nodes`/`materials` name→object maps — those maps don't
 *  exist on the loader's own output (drei's `useGraph`/Threlte's `useGltf` build them by walking the
 *  scene graph after load, which is exactly what `Room`'s own `buildGraph()` does before handing back
 *  a value of this type). */
export type HomeGLTF = GLTF & {
	nodes: HomeGLTFNodes;
	materials: HomeGLTFMaterials;
};
