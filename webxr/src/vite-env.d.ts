/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SCENE_CONFIG_URL?: string
  readonly VITE_WORLD_SLUG?: string
  readonly VITE_WORLD_MANIFEST_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
