import * as THREE from "three";

export function offset_curve(curve: THREE.CatmullRomCurve3, offset: THREE.Vector3): THREE.CatmullRomCurve3 {
  const offsetPoints = curve.points.map(p => p.clone().add(offset));
  return new THREE.CatmullRomCurve3(offsetPoints);
}

export function image_souround(radius: number, height: number): { position: THREE.Vector3, rotation: THREE.Euler }[] {
  const radius_difference = radius * 0.2;
  return [
    {
      position: new THREE.Vector3(radius - (radius_difference * 0.25), height * 0.25, 0), // Ponit 2: right(0.25)
      rotation: new THREE.Euler(0, Math.PI / 2, 0)
    },
    {
      position: new THREE.Vector3(0, height * 0.5, -(radius - (radius_difference * 0.5))), // Ponit 3: bottom(0.5)
      rotation: new THREE.Euler(-Math.PI, 0, -Math.PI)
    },
    {
      position: new THREE.Vector3(-(radius - (radius_difference * 0.75)), height * 0.75, 0), // Ponit 2: left(0.75)
      rotation: new THREE.Euler(0, -Math.PI / 2, 0)
    },
    {
      position: new THREE.Vector3(0, height, radius - radius_difference), // Ponit 2: bottom(1)
      rotation: new THREE.Euler(0, 0, 0)
    },
  ]
}

export function camera_souround(radius: number, height: number): THREE.CatmullRomCurve3 {
  const radius_difference = radius * 0.2;
  return new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, radius), // Ponit 1: bottom(radius: 1, height: 0) 
    new THREE.Vector3(radius - (radius_difference * 0.25), height * 0.25, 0), // Ponit 2: right(0.25)
    new THREE.Vector3(0, height * 0.5, -(radius - (radius_difference * 0.5))), // Ponit 3: bottom(0.5)
    new THREE.Vector3(-(radius - (radius_difference * 0.75)), height * 0.75, 0), // Ponit 4: left(0.75)
    new THREE.Vector3(0, height, radius - radius_difference), // Ponit 1: bottom(1)
    new THREE.Vector3(radius - (radius_difference * 0.25), height * 1.25, 0), // Ponit 2: right(1.25)
    new THREE.Vector3(0, height * 1.5, -(radius - (radius_difference * 0.5))), // Ponit 3: bottom(1.5)
    new THREE.Vector3(-(radius - (radius_difference * 0.75)), height * 1.75, 0), // Ponit 4: left(1.75)
    new THREE.Vector3(0, height * 2, radius - radius_difference), // Ponit 1: bottom(1)
    new THREE.Vector3(radius - (radius_difference * 0.25), height * 2.5, 0), // Ponit 2: right(1.5)
  ])
}

export function target_souround(height: number): THREE.CatmullRomCurve3 {
  return new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0), // Ponit 1: bottom(radius: 1, height: 0) 
    new THREE.Vector3(0, height * 0.25, 0), // Ponit 2: right(0.25)
    new THREE.Vector3(0, height * 0.5, 0), // Ponit 3: bottom(0.5)
    new THREE.Vector3(0, height * 0.75, 0), // Ponit 2: left(0.75)
    new THREE.Vector3(0, height, 0), // Ponit 2: bottom(1)
    new THREE.Vector3(0, height * 1.25, 0), // Ponit 2: right(0.25)
    new THREE.Vector3(0, height * 1.5, 0), // Ponit 3: bottom(0.5)
    new THREE.Vector3(0, height * 1.75, 0), // Ponit 2: left(0.75)
    new THREE.Vector3(0, height * 2, 0), // Ponit 2: bottom(1)
    new THREE.Vector3(0, height * 2.5, 0), // Ponit 2: bottom(1)
  ])
}


// Helper to generate quarter-circle arc
function addCornerArc(
  local: THREE.Vector3[],
  cx: number,
  cz: number,
  startAngle: number,
  endAngle: number,
  radius: number,
  hh: number,
  segmentsPerCorner: number,
  flipMulX: number,
  flipMulZ: number,
) {
  for (let i = 0; i <= segmentsPerCorner; i++) {
    const t = i / segmentsPerCorner;
    const angle = startAngle + (endAngle - startAngle) * t;
    const x = (cx + radius * Math.cos(angle)) * flipMulX;
    const z = (cz + radius * Math.sin(angle)) * flipMulZ;
    local.push(new THREE.Vector3(x, hh, z));
  }
}

/**
 * Create a rounded-rectangle orbit in 3D space.
 *
 * - width: size along local X
 * - height: size along local Y
 * - depth: size along local Z
 * - radius: corner radius
 * - segmentsPerCorner: how many points to approximate each rounded corner
 * - center: world-space center of the orbit
 * - rotation: world-space orientation (Euler)
 */

export function create_rounded_rect_orbit({
  width = 8,
  height = 6,
  depth = 0,
  radius = 1,
  segmentsPerCorner = 4,
  center = new THREE.Vector3(0, 0, 0),
  rotation = new THREE.Euler(0, 0, 0),
  end_point = new THREE.Vector3(0, 0, 0),
  flipX = false,
  flipZ = false,
}: {
  width?: number;
  depth?: number;
  height?: number;
  radius?: number;
  segmentsPerCorner?: number;
  center?: THREE.Vector3;
  rotation?: THREE.Euler;
  end_point?: THREE.Vector3;
  flipX?: boolean;
  flipZ?: boolean;
}) {
  const hh = depth / 2;

  const local: THREE.Vector3[] = [];
  const flipMulX = flipX ? -1 : 1;
  const flipMulZ = flipZ ? -1 : 1;


  local.push(center);

  // --- Clockwise order starting at top-left (0,0,0)
  addCornerArc(
    local,
    0 + radius,
    height - radius,
    Math.PI,
    Math.PI / 2,
    radius,
    hh,
    segmentsPerCorner,
    flipMulX,
    flipMulZ,
  );  // top-right
  addCornerArc(
    local,
    width - radius,
    height - radius,
    Math.PI / 2,
    0,
    radius,
    hh,
    segmentsPerCorner,
    flipMulX,
    flipMulZ,
  );             // bottom-right
  addCornerArc(
    local,
    width - radius,
    0 + radius,
    2 * Math.PI,
    1.5 * Math.PI,
    radius,
    hh,
    segmentsPerCorner,
    flipMulX,
    flipMulZ,
  );       // bottom-left

  // Add explicit end point at (0,0,0)
  local.push(end_point);

  // Apply rotation + translation
  const quat = new THREE.Quaternion().setFromEuler(rotation);
  const worldPoints = local.map((p, index) => {
    if (index === 0) {
      return p.clone();
    } else {
      return p.clone().applyQuaternion(quat).add(center);
    }
  });


  return new THREE.CatmullRomCurve3(worldPoints, true, 'centripetal');
}


/**
 * Create a rounded-rectangle orbit in 3D space.
 *
 * - width: size along local X
 * - height: size along local Y
 * - depth: size along local Z
 * - radius: corner radius
 * - segmentsPerCorner: how many points to approximate each rounded corner
 * - center: world-space center of the orbit
 * - rotation: world-space orientation (Euler)
 */

export function create_rounded_corner({
  width = 8,
  height = 6,
  depth = 0,
  radius = 1,
  segmentsPerCorner = 4,
  center = new THREE.Vector3(0, 0, 0),
  rotation = new THREE.Euler(0, 0, 0),
  flipX = false,
  flipZ = false,
}: {
  width?: number;
  depth?: number;
  height?: number;
  radius?: number;
  segmentsPerCorner?: number;
  center?: THREE.Vector3;
  rotation?: THREE.Euler;
  flipX?: boolean;
  flipZ?: boolean;
}) {
  const hh = depth / 2;

  const local: THREE.Vector3[] = [];
  const flipMulX = flipX ? -1 : 1;
  const flipMulZ = flipZ ? -1 : 1;


  local.push(center);

  // --- Clockwise order starting at top-left (0,0,0)
  addCornerArc(
    local,
    0 + radius,
    height - radius,
    Math.PI,
    Math.PI / 2,
    radius,
    hh,
    segmentsPerCorner,
    flipMulX,
    flipMulZ,
  );

  const flipWidht = flipX ? -width : width;
  const flipHeight = flipZ ? -height : height;
  local.push(new THREE.Vector3(flipWidht, 0, flipHeight));

  // Apply rotation + translation
  const quat = new THREE.Quaternion().setFromEuler(rotation);
  const worldPoints = local.map((p, index) => {
    if (index === 0) {
      return p.clone();
    } else {
      return p.clone().applyQuaternion(quat).add(center);
    }
  });


  return new THREE.CatmullRomCurve3(worldPoints, true, 'centripetal');
}