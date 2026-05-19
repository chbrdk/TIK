import { z } from 'zod'

const vec3 = z.tuple([z.number(), z.number(), z.number()])

export const sceneProjectSchema = z.object({
  version: z.number(),
  metricScaleFactor: z.number().optional(),
  groundPlaneOffset: z.number().optional(),
  groundPlaneColliderEnabled: z.boolean().optional(),
  instances: z.array(
    z.object({
      instanceId: z.string(),
      objectId: z.string(),
      assetId: z.string(),
      physics: z.enum(['rigidbody', 'static', 'ghost']).optional(),
      position: vec3,
      rotation: vec3,
      scale: vec3,
    }),
  ),
})

export type SceneProject = z.infer<typeof sceneProjectSchema>
