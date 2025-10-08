export const DO_NOT_ANIMATE = "DO_NOT_ANIMATE"

export function randomInt(min: number, max: number): number {
  const range = max - min;

  // Use a symmetric curve from -1 to 1
  const r = (Math.random() * 2 - 1); // uniform in [-1, 1]

  // Optionally, bias slightly toward center for smooth motion
  const bias = Math.pow(Math.abs(r), 1.5) * Math.sign(r);

  return min + (range / 2) * bias + range / 2;
}

export const getCategoryColor = (category: CATEGORY): string => {
  const colors = {
    frontend: '#4fc3f7',
    backend: '#81c784',
    graphics: '#ff8a65',
    devops: '#ba68c8',
    data: '#4db6ac',
    mobile: '#ffd54f',
    systems: '#ff7043',
    ai: '#7b1fa2',
    embedded: '#4caf50',
    blockchain: '#607d8b'
  }
  return colors[category]
}

export const getCategoryEmissive = (category: CATEGORY): string => {
  const emissives = {
    frontend: '#29b6f6',
    backend: '#66bb6a',
    graphics: '#ff5722',
    devops: '#ab47bc',
    data: '#26a69a',
    mobile: '#ffca28',
    systems: '#f44336',
    ai: '#512da8',
    embedded: '#81c784',
    blockchain: '#546e7a'
  }
  return emissives[category]
}

export type CATEGORY = 'frontend' | 'backend' | 'graphics' | 'devops' | 'data' | 'mobile' | 'systems' | 'ai' | 'embedded' | 'blockchain'

// 🌟 RADIAL SKILL TREE - Combined recursive version
export type SKILL = {
  id: string
  name: string
  position: [number, number, number]
  size: number
  category: CATEGORY
  level: number
  parent?: string
}

export type SKILLDEFINITION = {
  id: string
  name: string
  category: CATEGORY
  size: number
  children?: SKILLDEFINITION[]
}


export type SYNERGY = {
  from: string
  to: string
  name: string
  color: string
  strength: number
}

export type CROSS_CONENECTIONS = {
  from: string,
  to: string,
  name: string
}


export const root_skill: SKILLDEFINITION = {
  id: DO_NOT_ANIMATE,
  name: 'Full Stack Developer',
  category: 'frontend',
  size: 0.1,
  children: [
    {
      id: 'frontend',
      name: 'Frontend',
      category: 'frontend',
      size: 0.2,
      children: [
        { id: 'html', name: 'HTML5', category: 'frontend', size: 0.12 },
        { id: 'css', name: 'CSS3', category: 'frontend', size: 0.12 },
        {
          id: 'javascript',
          name: 'JavaScript',
          category: 'frontend',
          size: 0.18,
          children: [
            { id: 'react', name: 'React', category: 'frontend', size: 0.16 },
            { id: 'typescript', name: 'TypeScript', category: 'frontend', size: 0.15 }
          ]
        }
      ]
    },
    {
      id: 'backend',
      name: 'Backend',
      category: 'backend',
      size: 0.2,
      children: [
        {
          id: 'node',
          name: 'Node.js',
          category: 'backend',
          size: 0.14,
          children: [
            { id: 'express', name: 'Express', category: 'backend', size: 0.11 },
            { id: 'postgres', name: 'PostgreSQL', category: 'backend', size: 0.12 }
          ]
        },
        { id: 'python', name: 'Python', category: 'backend', size: 0.19 },
      ]
    },
    {
      id: 'graphics',
      name: 'Graphics',
      category: 'graphics',
      size: 0.2,
      children: [
        { id: 'webgl', name: 'WebGL', category: 'graphics', size: 0.14 },
        { id: 'threejs', name: 'Three.js', category: 'graphics', size: 0.17 },
        { id: 'shader', name: 'GLSL', category: 'graphics', size: 0.13 },
      ]
    },
    {
      id: 'systems',
      name: 'Systems',
      category: 'systems',
      size: 0.2,
      children: [
        { id: 'c', name: 'C', category: 'systems', size: 0.16 },
        { id: 'rust', name: 'Rust', category: 'systems', size: 0.18 },
      ]
    },
    {
      id: 'ai',
      name: 'AI/ML',
      category: 'ai',
      size: 0.2,
      children: [
        { id: 'tensorflow', name: 'TensorFlow', category: 'ai', size: 0.14 },
        { id: 'pytorch', name: 'PyTorch', category: 'ai', size: 0.14 },
      ]
    }
  ]
}


export function create_skills_recursive(
  skills: SKILL[],
  branch: SKILLDEFINITION,
  parentPosition: [number, number, number] = [0, 0, 0],
  level: number = 0,
  radius: number = 3.5,
  parentAngle: number = 0,
  siblingsCount: number = 1,
  index: number = 0,
  parentId: string | null = null,
  childSpread: number = 0.8
) {
  const angle =
    level === 1
      ? index * (2 * Math.PI) / siblingsCount // even around circle for level 1
      : parentAngle + (index - (siblingsCount - 1) / 2) * childSpread // small offset for deeper levels

  const x = parentPosition[0] + (level === 0 ? 0 : Math.cos(angle) * radius)
  const z = parentPosition[2] + (level === 0 ? 0 : Math.sin(angle) * radius)

  skills.push({
    id: branch.id,
    name: branch.name,
    position: [x, 0, z],
    size: branch.size,
    category: branch.category,
    level,
    parent: parentId || undefined
  })

  // Recurse for children
  branch.children?.forEach((child, i) => {
    create_skills_recursive(
      skills,
      child,
      [x, 0, z],
      level + 1,
      radius,
      angle,
      branch.children!.length,
      i,
      branch.id
    )
  })
}

// 🔗 Generate synergies based on parent-child relationships
export function create_radial_synergies(skills: SKILL[]): SYNERGY[] {
  const synergies: SYNERGY[] = []

  // Create connections from parent to child
  for (const skill of skills) {
    if (skill.parent) {
      const parent = skills.find(s => s.id === skill.parent)!
      const categoryColor = getCategoryColor(parent.category)
      synergies.push({
        from: parent.id,
        to: skill.id,
        name: `${parent.name} → ${skill.name}`,
        color: categoryColor,
        strength: 0.8 + Math.random() * 0.2
      })
    }
  }

  // Add some cross-connections between related skills
  const crossConnections: Array<CROSS_CONENECTIONS> = [
    { from: 'react', to: 'typescript', name: 'Type Safety' },
    { from: 'node', to: 'express', name: 'Server Framework' },
    { from: 'webgl', to: 'threejs', name: '3D Abstraction' }
  ]

  for (const conn of crossConnections) {
    const fromSkill = skills.find(s => s.id === conn.from)
    const toSkill = skills.find(s => s.id === conn.to)
    if (fromSkill && toSkill) {
      synergies.push({
        from: conn.from,
        to: conn.to,
        name: conn.name,
        color: '#ffffff',
        strength: 0.7
      })
    }
  }

  return synergies
}

