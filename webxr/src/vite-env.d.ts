/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SCENE_CONFIG_URL?: string
  readonly VITE_STUDIO_API_BASE?: string
  readonly VITE_IMAGE_BLASTER_DEV_URL?: string
  readonly VITE_WORLD_SLUG?: string
  readonly VITE_WORLD_MANIFEST_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
