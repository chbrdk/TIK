# Unity Project Skeleton — Persona Reality v1

**Engine:** Unity 6 LTS (6000.0.x) · URP · Single-Pass Stereo  
**XR Stack:** Meta XR All-in-One SDK + XR Interaction Toolkit + OpenXR Plugin  
**Build Target:** Android (Quest 3 / 3S)  
**Architecture style:** Data-driven, ScriptableObject-backed, Addressables-streamed.

---

## 1. Architectural Principles

1. **No hard references in Scripts.** Every environment, persona, voiceover, prefab is referenced through an `AssetReference` on a ScriptableObject. The `scene_config.json` carries only IDs; the Loader resolves IDs → SOs → AssetReferences → loaded prefabs.

2. **Acts are Timeline-driven, not state-machine-driven.** Each Act is a Unity Timeline asset that orchestrates: environment activation, NOVA tracks, ambient audio, persona inner monologue, beat triggers. The `ActDirector` swaps the active Timeline per act.

3. **Beats are events, not coroutines.** `BeatTriggerSystem` subscribes to triggers (timer / pickup / sit / look_at) and raises `BeatFiredEvent`. Listeners (VO, haptics, UI overlay, diegetic anchor animation) react independently. Decoupled = testable.

4. **One Unity Scene at runtime.** `10_Session.unity` is the only loaded scene during the experience. Environments are *prefab instances* swapped via Addressables — not Unity Scenes. This avoids LoadSceneAsync stalls between acts.

5. **Strict performance budget enforced via custom validation.** A pre-build validator (Editor script) walks the project, flags any asset/material/scene that violates the budget. Run on every CI build.

---

## 2. Folder Structure

```
Assets/
└── _Project/                               # All project assets live here; never at root
    ├── Art/
    │   ├── Environments/                   # Imported Asset Store packs (organized per shell)
    │   │   ├── env_kitchen_lived_in_dach/
    │   │   ├── env_living_room_lived_in_dach/
    │   │   └── ...
    │   ├── HeroAssets/                     # AI-generated branded items (glTF imports)
    │   │   ├── vaillant_arotherm/
    │   │   ├── porsche_keyfob/
    │   │   └── ...
    │   ├── Skyboxes/                       # Skybox AI / DiT360 outputs
    │   ├── Materials/                      # URP shared materials
    │   ├── Shaders/                        # Custom shaders (mirror_morph, glow_warm, etc.)
    │   └── Textures/UI/
    ├── Audio/
    │   ├── Nova/                           # ElevenLabs NOVA tracks (DE + EN)
    │   │   ├── DE/                         # nova_de_act{n}_{line}.ogg
    │   │   └── EN/
    │   ├── InnerMonologue/                 # Per-persona inner voice
    │   │   └── klaus_dortmund/
    │   ├── Ambient/                        # Per-environment loops
    │   └── SFX/                            # Interactions, transitions
    ├── Data/                               # ScriptableObject instances
    │   ├── Personas/                       # PersonaSO assets
    │   │   ├── klaus_dortmund.asset
    │   │   ├── anna_stuttgart.asset
    │   │   └── ...
    │   ├── Environments/                   # EnvironmentSO assets
    │   ├── Animations/                     # AnimationPresetSO (glow_warm, pulse_red, ...)
    │   ├── Voiceovers/                     # VoiceoverManifestSO (lookup tables)
    │   └── Clients/                        # ClientBrandSO (Vaillant, Porsche, Bosch, ...)
    ├── Prefabs/
    │   ├── _Core/
    │   │   ├── SessionBootstrapper.prefab
    │   │   ├── ActDirector.prefab
    │   │   ├── XRRig.prefab                # Pre-configured Meta XR rig
    │   │   └── NovaPresence.prefab
    │   ├── Environments/                   # One root prefab per environment shell
    │   ├── Interactables/
    │   │   ├── Phone.prefab
    │   │   ├── Monitor.prefab
    │   │   ├── Mirror.prefab
    │   │   └── QRCodePanel.prefab
    │   ├── Avatar/
    │   │   ├── PersonaAvatar.prefab        # RPM loader target
    │   │   └── NovaAvatar.prefab           # Abstract guide
    │   └── Diegetic/
    │       └── MetricAnchorBase.prefab     # Base for diegetic metric anchors
    ├── Scenes/
    │   ├── 00_Boot.unity                   # Pre-warm, splash, waits for session
    │   ├── 10_Session.unity                # Main runtime scene
    │   └── _Dev/
    │       └── 90_EnvironmentSandbox.unity # For artist iteration without full pipeline
    ├── Scripts/
    │   ├── Core/
    │   │   ├── SessionBootstrapper.cs
    │   │   ├── SceneConfigLoader.cs
    │   │   ├── ActDirector.cs
    │   │   ├── BeatTriggerSystem.cs
    │   │   ├── SessionManager.cs
    │   │   └── BoothCompanionListener.cs   # WebSocket from iPad
    │   ├── Data/                           # DTOs that mirror scene_config.json
    │   │   ├── SceneConfig.cs
    │   │   ├── PersonaData.cs
    │   │   ├── NarrativeBeatData.cs
    │   │   └── DiegeticMetricData.cs
    │   ├── ScriptableObjects/
    │   │   ├── PersonaSO.cs
    │   │   ├── EnvironmentSO.cs
    │   │   ├── AnimationPresetSO.cs
    │   │   ├── VoiceoverManifestSO.cs
    │   │   └── ClientBrandSO.cs
    │   ├── Triggers/
    │   │   ├── TriggerBase.cs
    │   │   ├── TimerTrigger.cs
    │   │   ├── PickupTrigger.cs
    │   │   ├── SitDownTrigger.cs
    │   │   ├── LookAtTrigger.cs
    │   │   └── SceneEnterTrigger.cs
    │   ├── Diegetic/
    │   │   ├── DiegeticMetricAnchor.cs
    │   │   ├── Animations/
    │   │   │   ├── GlowWarmAnimation.cs
    │   │   │   ├── PulseRedAnimation.cs
    │   │   │   ├── FlickerAnimation.cs
    │   │   │   ├── ColorShiftAnimation.cs
    │   │   │   ├── ParticleBurstAnimation.cs
    │   │   │   └── ScaleBreathAnimation.cs
    │   ├── Voice/
    │   │   ├── NovaVoiceoverPlayer.cs
    │   │   ├── InnerMonologuePlayer.cs
    │   │   └── AmbientAudioController.cs
    │   ├── Avatar/
    │   │   ├── MirrorMorphController.cs
    │   │   └── PersonaAvatarSpawner.cs     # Ready Player Me loader
    │   ├── DataLayers/
    │   │   ├── EcheonFeedRenderer.cs       # Renders feed on Phone canvas
    │   │   ├── CheckionDashboardRenderer.cs
    │   │   └── StoryblokMockupRenderer.cs
    │   ├── Interaction/
    │   │   ├── PhonePickupHandler.cs
    │   │   ├── MonitorTabSwitcher.cs
    │   │   └── QRCodeRenderer.cs
    │   ├── UI/
    │   │   └── WorldSpaceCanvasBase.cs
    │   └── Editor/
    │       ├── PerformanceBudgetValidator.cs   # Pre-build asset validator
    │       └── SceneConfigSchemaValidator.cs   # Validates JSON against schema
    ├── Settings/
    │   ├── URP_Quest3.asset
    │   ├── URP_Quest3_Renderer.asset
    │   ├── XR_OpenXR.asset
    │   └── BuildProfile_Quest3.asset
    ├── Timelines/
    │   ├── Act1_Mirror.playable
    │   ├── Act2_Morning.playable
    │   ├── Act3_Workday.playable
    │   ├── Act4_Evening.playable
    │   └── Act5_Reveal.playable
    └── StreamingAssets/
        ├── scene_configs/                  # Cached configs for offline testing
        ├── voiceovers/                     # Optionally embedded for offline reliability
        └── echeon_cache/                   # Cached news feed for offline mode

Packages/                                   # via Package Manager only
ProjectSettings/
```

---

## 3. ScriptableObject Architecture

### `PersonaSO` (CreateAssetMenu)

```csharp
[CreateAssetMenu(menuName = "PersonaReality/Persona")]
public class PersonaSO : ScriptableObject
{
    public string id;
    public string displayName;
    public int age;
    public GenderExpression genderExpression;
    public string location;
    public string occupation;

    [Header("Axes")]
    public Sector sector;
    public LifeStage lifeStage;
    public TechAffinity techAffinity;
    public DecisionStyle decisionStyle;
    public string industry;

    [Header("Content")]
    [TextArea(2, 4)] public string[] painPoints;
    [TextArea(2, 4)] public string[] decisionDrivers;

    [Header("Avatar")]
    public string rpmAvatarId;
    public string innerVoiceElevenLabsId;
    public OutfitPreset outfitPreset;
}
```

### `EnvironmentSO`

```csharp
[CreateAssetMenu(menuName = "PersonaReality/Environment")]
public class EnvironmentSO : ScriptableObject
{
    public string id;
    public string displayName;

    [Header("Tags")]
    public SettingClass settingClass;
    public Style style;
    public Region region;
    public Mood[] moods;
    public int versionPriority = 1;

    [Header("Asset")]
    public AssetReferenceGameObject environmentPrefab;
    public AssetReferenceTexture2D skyboxTexture;

    [Header("Lighting Presets Supported")]
    public LightingPreset[] supportedPresets;

    [Header("Anchor Map")]
    [Tooltip("Maps anchor_object IDs from scene_config to GameObject names in the prefab")]
    public AnchorMapping[] anchorMap;
}
```

### `AnimationPresetSO`

One asset per `animation_preset` enum value. Each implements `IDiegeticAnimation`:

```csharp
public abstract class AnimationPresetSO : ScriptableObject
{
    public abstract void Apply(GameObject anchor, float intensity, MonoBehaviour host);
    public abstract void Release(GameObject anchor);
}
```

Concrete: `GlowWarmPresetSO`, `PulseRedPresetSO`, etc. — each drives material property animations via `MaterialPropertyBlock` (no material instancing → no draw-call explosion).

### `VoiceoverManifestSO`

Maps `voiceover_track_id` strings → `AssetReferenceAudioClip`. One manifest per language. Loaded once at boot.

### `ClientBrandSO`

```csharp
[CreateAssetMenu(menuName = "PersonaReality/ClientBrand")]
public class ClientBrandSO : ScriptableObject
{
    public string clientId;
    public Sprite logo;
    public Color colorPrimary;
    public Color colorSecondary;
    public PropSwap[] propSwaps;
}

[Serializable]
public struct PropSwap
{
    public string fromAssetId;
    public AssetReferenceGameObject toAsset;
}
```

---

## 4. Runtime Flow

```
APP LAUNCH
  │
  ▼
[00_Boot.unity]
  └─ SessionBootstrapper waits for BoothCompanionListener
      └─ iPad pushes {session_id, scene_config_json} over WebSocket
  ▼
[Load 10_Session.unity additive]
  └─ SceneConfigLoader.Parse(json) → SceneConfig (POCO)
  ▼
[Resolve AssetReferences in parallel]
  ├─ EnvironmentSO[5] (one per act)
  ├─ PersonaAvatar (Ready Player Me URL)
  ├─ VoiceoverClips[~16 tracks for selected language]
  ├─ EcheonFeedItems[~8]
  └─ BrandLayer assets (if client_id present)
  ▼
[Apply ClientBrandSO prop swaps + color tokens to materials]
  ▼
[Spawn XR Rig at neutral pose, fade from black]
  ▼
[ActDirector.StartAct(1)]
  ├─ Instantiates env_void_mirror prefab
  ├─ Activates Act1_Mirror.playable
  ├─ Timeline fires beats → BeatTriggerSystem → listeners react
  └─ On Timeline end → ActDirector.StartAct(2) [transition fade]
  ▼
[Act 2 → Act 3 → Act 4 → Act 5]
  ▼
[Act 5 end → QRCodeRenderer shows take-home QR → fade out]
  ▼
[SessionManager.NotifyComplete()]
  └─ Companion iPad gets "ready for next visitor" signal
  ▼
[Reset to 10_Session idle state, await next config]
```

**Critical:** Acts 1 and 5 use the same `env_void_*` prefab type but with different content. Acts 2–4 trigger Addressables.Release on the previous environment before instantiating the next — keeps memory bounded.

---

## 5. Core Scripts — Key Contracts

### `SceneConfigLoader`

```csharp
public class SceneConfigLoader : MonoBehaviour
{
    public static SceneConfigLoader Instance { get; private set; }
    public SceneConfig Current { get; private set; }

    public event Action<SceneConfig> OnConfigLoaded;

    public async Task LoadFromJson(string json)
    {
        Current = JsonConvert.DeserializeObject<SceneConfig>(json);
        await ResolveAllReferences();
        OnConfigLoaded?.Invoke(Current);
    }

    private async Task ResolveAllReferences() { /* batch Addressables loads */ }
}
```

### `ActDirector`

```csharp
public class ActDirector : MonoBehaviour
{
    [SerializeField] private PlayableDirector director;
    [SerializeField] private PlayableAsset[] actTimelines = new PlayableAsset[5];

    public int CurrentAct { get; private set; }
    public event Action<int> OnActStart;
    public event Action<int> OnActEnd;

    public async Task StartAct(int actNumber) { /* fade, swap env, play timeline */ }
}
```

### `BeatTriggerSystem`

```csharp
public class BeatTriggerSystem : MonoBehaviour
{
    public event Action<NarrativeBeatData> OnBeatFired;

    private void Awake() { /* subscribe to all TriggerBase instances in scene */ }
    public void ArmBeats(IEnumerable<NarrativeBeatData> beatsForCurrentAct) { /* … */ }
}
```

### `DiegeticMetricAnchor` (MonoBehaviour on env objects)

```csharp
public class DiegeticMetricAnchor : MonoBehaviour
{
    [SerializeField] private string anchorId;   // matches scene_config.anchor_object

    public void Apply(DiegeticMetric metric, AnimationPresetSO preset)
    {
        preset.Apply(gameObject, metric.value / 100f, this);
    }
}
```

---

## 6. Addressables Groups

| Group | Build Path | Load Path | Streaming? |
|---|---|---|---|
| `environments` | LocalBuildPath | LocalLoadPath | Local (bundled) — needed offline |
| `personas` | LocalBuildPath | LocalLoadPath | Local |
| `voiceovers_de` | LocalBuildPath | LocalLoadPath | Local |
| `voiceovers_en` | LocalBuildPath | LocalLoadPath | Local |
| `client_brands` | LocalBuildPath | LocalLoadPath | Local |
| `hero_assets` | LocalBuildPath | LocalLoadPath | Local |

**Booth-Reliability-Regel:** Alle Assets local-bundled. Quest 3 darf zur Laufzeit niemals von einer Remote-CDN ziehen müssen. Einzige Netzwerk-Abhängigkeit: WebSocket vom iPad mit dem JSON-Config.

---

## 7. JSON-Deserialisierung — Convention

- Library: `Newtonsoft.Json` (Unity-Package `com.unity.nuget.newtonsoft-json`)
- DTOs in `Scripts/Data/` mit `[JsonProperty]`-Attributen für snake_case-Felder
- Enums via `StringEnumConverter`
- Validierung optional via `Json.Schema` Package (Pre-build Editor-Check), Runtime nur try/catch

```csharp
public class SceneConfig
{
    [JsonProperty("meta")] public Meta Meta;
    [JsonProperty("persona")] public PersonaData Persona;
    [JsonProperty("environments")] public EnvironmentBinding[] Environments;
    [JsonProperty("narrative_beats")] public NarrativeBeatData[] NarrativeBeats;
    // ...
}
```

---

## 8. Conventions

- **Naming:** PascalCase für Klassen/Methoden/Properties, camelCase für Felder/Locals, snake_case für JSON-Keys und Asset-IDs.
- **Asset-IDs** durchgängig snake_case: `env_kitchen_lived_in_dach_v1`, `klaus_dortmund`, `nova_de_act2_03`.
- **Prefabs** beginnen mit `_` für Core-Prefabs (`_SessionBootstrapper`), sonst Domäne-prefix (`env_*`, `int_*`, `ui_*`).
- **Scenes** zwei-stellig prefixed (`00_Boot`, `10_Session`).
- **Magic strings vermeiden:** Asset-IDs als `const string` in `IDs.cs`-Static-Class.

---

## 9. Test/Iteration Workflow

1. `90_EnvironmentSandbox.unity` öffnen
2. EnvironmentSO + PersonaSO drag-droppen
3. `Tools → Persona Reality → Load Mock Session` (Editor-Menüeintrag, lädt `StreamingAssets/scene_configs/dev_klaus.json`)
4. Play-Mode → durchspielen ohne iPad
5. Vor jedem Build: `Tools → Persona Reality → Run Performance Validator`

---

## 10. Build Checklist

- [ ] Color Space: Linear
- [ ] Graphics API: Vulkan (Quest 3 nativ), GLES3 nur als Fallback deaktiviert
- [ ] Multithreaded Rendering: on
- [ ] Static Batching: on
- [ ] Dynamic Batching: off (kontraproduktiv mit URP+VR)
- [ ] GPU Skinning: on
- [ ] Shader Stripping: aggressive, "Mixed Lighting Modes: Subtractive only"
- [ ] IL2CPP, ARM64 only
- [ ] Stripping Level: Low (Medium birgt Reflection-Risiken bei Newtonsoft)
- [ ] Quality: Quest3 Preset, V-Sync Count 0 (XR überschreibt)
- [ ] OpenXR Features: Meta Quest Support, Hand Tracking, Passthrough
- [ ] XR Interaction Toolkit Samples: Starter Assets imported
- [ ] Newtonsoft.Json link.xml beigelegt (Stripping-Schutz)

---

*Dieses Dokument ist die zentrale Referenz für Unity-Architektur. Änderungen am Aufbau werden hier gepflegt, bevor sie ins Code-Repo gehen.*
