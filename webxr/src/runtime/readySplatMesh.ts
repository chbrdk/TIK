import { SplatMesh } from '@sparkjsdev/spark'

const noopRaycast: SplatMesh['raycast'] = () => {}

/** Load splat geometry and wait until Spark has initialized it. */
export async function createReadySplatMesh(url: string): Promise<SplatMesh> {
  const mesh = new SplatMesh({ url })
  await mesh.initialized
  mesh.raycast = noopRaycast
  return mesh
}

export function disposeSplatMesh(mesh: SplatMesh | null | undefined): void {
  mesh?.dispose()
}
