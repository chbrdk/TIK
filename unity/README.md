# Persona Reality — Unity (Quest 3)

Part of the [TIK monorepo](../README.md). Unity 6 LTS client for Persona Reality.

**Spec:** repo root · **API:** `../backend/` · **Golden JSON:** `../fixtures/golden/`

## Requirements

- Unity **6000.0.x** LTS
- Meta Quest 3 (Android IL2CPP) — configure after first open

## Quick start

1. Unity Hub → Open folder **`TIK/unity`** (this directory).
2. Sync mock config from repo root:
   ```bash
   ../scripts/sync-unity-fixture.sh
   ```
3. **Tools → Persona Reality → Validate Mock JSON (Edit Mode)**
4. **Tools → Persona Reality → Create Runtime Bootstrap Objects**
5. Play Mode with `SessionBootstrapper` → Auto Load Mock On Start.

## Layout

```
Assets/_Project/
  Scripts/Data/       scene_config DTOs
  Scripts/Core/       SceneConfigLoader, ActDirector, …
  StreamingAssets/scene_configs/dev_klaus_dortmund.json
```

## License

MIT — see [LICENSE](LICENSE).
