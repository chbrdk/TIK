import { env } from './env'

export const KITCHEN_WORLD_SLUG = env.kitchenWorldSlug

export interface AnchorDefinition {
  id: string
  position: [number, number, number]
}

export type EnvironmentKind = 'splat' | 'placeholder'

export type PlaceholderVariant = 'void_mirror' | 'living_room' | 'void_constellation'

export interface EnvironmentDefinition {
  /** Canonical Persona Reality environment_id (library key). */
  environmentId: string
  /** Default narrative act when matcher picks this room. */
  defaultAct: number
  kind: EnvironmentKind
  /** image-blaster world slug (splat worlds only). */
  worldSlug?: string
  displayName: string
  anchors: AnchorDefinition[]
  semantics: {
    metric_scale_factor: number
    ground_plane_offset: number
    flip_y: boolean
  }
  placeholderVariant?: PlaceholderVariant
}

/** Shared environment library — keyed by environment_id (not per persona). */
export const ENVIRONMENT_REGISTRY: Record<string, EnvironmentDefinition> = {
  env_void_mirror_v1: {
    environmentId: 'env_void_mirror_v1',
    defaultAct: 1,
    kind: 'placeholder',
    placeholderVariant: 'void_mirror',
    displayName: 'Void · Spiegel',
    anchors: [{ id: 'mirror_center', position: [0, 1.45, -2.2] }],
    semantics: { metric_scale_factor: 1, ground_plane_offset: 0, flip_y: false },
  },
  env_kitchen_lived_in_dach_v1: {
    environmentId: 'env_kitchen_lived_in_dach_v1',
    defaultAct: 2,
    kind: 'splat',
    worldSlug: KITCHEN_WORLD_SLUG,
    displayName: 'Küche',
    anchors: [
      { id: 'phone_main', position: [1.15, 0.95, -1.35] },
      { id: 'wall_calendar', position: [-0.85, 1.55, -1.05] },
      { id: 'kitchen_counter_docs', position: [0.35, 1.0, -0.55] },
    ],
    semantics: { metric_scale_factor: 1, ground_plane_offset: 0, flip_y: true },
  },
  env_home_office_lived_in_dach_v1: {
    environmentId: 'env_home_office_lived_in_dach_v1',
    defaultAct: 3,
    kind: 'splat',
    worldSlug: 'modern-office-360',
    displayName: 'Home Office',
    anchors: [{ id: 'monitor_left', position: [-1.2, 1.35, 1.8] }],
    semantics: {
      metric_scale_factor: 1.6493142,
      ground_plane_offset: 1.6121744,
      flip_y: true,
    },
  },
  env_home_living_lived_in_dach_v1: {
    environmentId: 'env_home_living_lived_in_dach_v1',
    defaultAct: 4,
    kind: 'placeholder',
    placeholderVariant: 'living_room',
    displayName: 'Wohnzimmer',
    anchors: [
      { id: 'sofa_main', position: [0, 0.45, -1.2] },
      { id: 'wall_calendar', position: [-1.4, 1.5, -2.0] },
      { id: 'kitchen_counter_docs', position: [1.1, 0.95, -0.8] },
    ],
    semantics: { metric_scale_factor: 1, ground_plane_offset: 0, flip_y: false },
  },
  env_void_constellation_v1: {
    environmentId: 'env_void_constellation_v1',
    defaultAct: 5,
    kind: 'placeholder',
    placeholderVariant: 'void_constellation',
    displayName: 'Void · Constellation',
    anchors: [{ id: 'qr_panel', position: [0, 1.35, -1.8] }],
    semantics: { metric_scale_factor: 1, ground_plane_offset: 0, flip_y: false },
  },
}

export const SESSION_ACTS = [1, 2, 3, 4, 5] as const

export type SessionAct = (typeof SESSION_ACTS)[number]

/** @deprecated Use SESSION_ACTS */
export const PILOT_ACTS = [2, 3] as const

export function getEnvironmentById(environmentId: string): EnvironmentDefinition | undefined {
  return ENVIRONMENT_REGISTRY[environmentId]
}

export function getEnvironmentByAct(act: number): EnvironmentDefinition | undefined {
  return Object.values(ENVIRONMENT_REGISTRY).find((e) => e.defaultAct === act)
}

export function listSplatEnvironments(): EnvironmentDefinition[] {
  return Object.values(ENVIRONMENT_REGISTRY).filter((e) => e.kind === 'splat')
}

export function sceneProjectUrl(slug: string): string {
  return `/worlds/${slug}/scene.json`
}

export function worldManifestUrl(slug: string): string {
  return `/worlds/${slug}/manifest.json`
}
