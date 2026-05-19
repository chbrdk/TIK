import { z } from 'zod'

const anchorManifestEntry = z.object({
  id: z.string(),
  position: z.tuple([z.number(), z.number(), z.number()]),
  trigger_type: z.string().optional(),
  trigger_target: z.string().optional(),
})

export const worldManifestSchema = z.object({
  slug: z.string(),
  environment_id: z.string(),
  splat_url: z.string(),
  splat_tier: z.string().optional(),
  collider_url: z.string().optional(),
  mode: z.enum(['world_and_anchors_only', 'full_blast']).optional(),
  semantics: z
    .object({
      metric_scale_factor: z.number().optional(),
      ground_plane_offset: z.number().optional(),
      flip_y: z.boolean().optional(),
    })
    .optional(),
  /** Authored in image-blaster anchors.json — overrides hardcoded registry positions when present. */
  anchors: z.array(anchorManifestEntry).optional(),
  anchors_pending: z.array(z.string()).optional(),
})

export type WorldManifest = z.infer<typeof worldManifestSchema>
