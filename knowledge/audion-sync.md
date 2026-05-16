# Sync TIK backend → AUDION-v2

TIK `backend/` ist die **open-source Quelle** für den Persona Reality `/v1` Composer.

## Dateien spiegeln

```bash
TIK=../TIK   # oder absoluter Pfad
AUDION=../AUDION-v2

rsync -av --delete \
  "$TIK/backend/app/persona_reality/" \
  "$AUDION/apps/api/app/persona_reality/"

# Fixtures in AUDION zeigen weiterhin auf TIK-Struktur — service.py in AUDION
# nach Sync anpassen ODER AUDION-service auf TIK repo_root verweisen lassen.
```

**Empfehlung Phase 2:** AUDION importiert TIK als Git-Submodule unter `vendor/tik` oder pip editable path.

## Tests

```bash
# TIK (canonical)
cd TIK/backend && pytest -q

# AUDION (integration)
cd AUDION-v2/apps/api && uv run pytest tests/test_persona_reality_sessions.py -q
```
