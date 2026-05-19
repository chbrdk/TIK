import type { SceneConfig } from '@/schema/scene-config'
import type { WorldManifest } from '@/schema/world-manifest'
import { environmentForAct } from './SceneConfigLoader'
import type { NarrativeDirector } from './NarrativeDirector'

export interface ActDirectorState {
  act: number
  environmentId: string | null
  worldSlug: string
  manifest: WorldManifest
  config: SceneConfig
}

export class ActDirector {
  constructor(
    public readonly state: ActDirectorState,
    private readonly narrative: NarrativeDirector,
  ) {}

  static create(
    config: SceneConfig,
    manifest: WorldManifest,
    narrative: NarrativeDirector,
    act: number,
  ): ActDirector {
    const envEntry = environmentForAct(config, act)
    if (!envEntry) throw new Error(`No environment for act ${act}`)
    return new ActDirector(
      {
        act,
        environmentId: envEntry.environment_id,
        worldSlug: manifest.slug,
        manifest,
        config,
      },
      narrative,
    )
  }

  start() {
    this.narrative.start(this.state.act)
  }

  onPickup(target: string) {
    this.narrative.onPickup(target)
  }

  onLookAt(target: string) {
    this.narrative.onLookAt(target)
  }

  onSitDown(target: string) {
    this.narrative.onSitDown(target)
  }

  dispose() {
    this.narrative.dispose()
  }
}
