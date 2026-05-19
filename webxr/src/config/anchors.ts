export type { AnchorDefinition } from './environments'
export {
  ENVIRONMENT_REGISTRY,
  getEnvironmentByAct,
  getEnvironmentById,
  sceneProjectUrl,
  worldManifestUrl,
} from './environments'

import { getEnvironmentById } from './environments'

export function requiredAnchorIds(environmentId: string): string[] {
  return getEnvironmentById(environmentId)?.anchors.map((a) => a.id) ?? []
}
