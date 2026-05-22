# Persona Reality Studio

Stand: Mai 2026 · Admin-UI: `webxr` → `/admin` · API: `POST /v1/pipeline/sessions` · Job-Liste: `GET /v1/pipeline/jobs`, `/admin/jobs`

## Dev-Start

```bash
# Terminal 1 — API
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env   # ANTHROPIC_API_KEY, GOOGLE_API_KEY, IMAGE_BLASTER_ROOT (nur Marble)
export PYTHONPATH=.
uvicorn app.main:app --reload --port 8000

# Terminal 2 — WebXR + Studio
cd webxr
npm install
VITE_STUDIO_API_BASE=/api npm run dev

# Browser
# Studio: https://localhost:5173/admin
# Stories (Golden + VR): https://localhost:5173/admin/stories
# Runtime: https://localhost:5173/?config=/scene_configs/<persona_id>_de.json
```

image-blaster Anker-Editor (anderer Port als WebXR):

```bash
cd ../image-blaster && bun run dev -- --port 5174
# https://localhost:5174/<world_slug>/anchors
```

## Narrative vs. Pipeline

NOVA spricht die **Persona** an, nicht die MSQ-Tool-Suite. Audion/Echeon/Checkion/CMS liefern Inhalt im Hintergrund — Namen gehören **nicht** in Voiceover. Details: `knowledge/persona-reality-narrative-layer.md`.

## Pipeline-Schritte

| Step | State | Aktion |
|------|-------|--------|
| 1 | `persona` | Claude → `persona_inputs` + `persona_profile` + validate |
| 2 | `acts` | Claude × 5 → normalize → **Python-Schema** (3 Versuche/Act), finaler Check aller 5 Acts |
| 3 | `narrative` | **Google Gemini** leere **Umgebungs-Plates** Acts 2–4 (keine Personen/Story-Szene) → `webxr/public/narrative-previews/{persona}/` |
| 4 | `compile` | Node: compile-persona, compile-act --all, assemble |
| — | `awaiting_worlds` | **Stopp** — Admin zeigt Szenen-Galerie; Nutzer klickt „Welten generieren“ |
| 5 | `worlds` | Marble (`--image` = Gemini-PNG) + anchors + sync |
| 6 | `publish` | Copy golden/narrative → `webxr/public/` |
| end | `completed` / `failed` | VR-Preview-URL im Job |

API: `POST /v1/pipeline/jobs/{id}/generate-worlds` startet Schritte worlds + publish.

## Job-States

`queued` → `persona` → `acts` → `compile` → `worlds` (optional) → `publish` → `completed` | `failed`

Jobs: `fixtures/jobs/{job_id}/job.json` + `log.txt` (gitignored). Übersicht: **Admin → Alle Jobs** oder `GET /v1/pipeline/jobs` (neueste zuerst).

**Fixture-Bestand (Mai 2026):** Nur `klaus_dortmund` (Referenz) und `schott_glasbau_ingenieur_v8` (aktive Schott-Session). Alte API-Test-Personas entfernt — kein Batch-Gemini. Aufräumen: `scripts/cleanup-story-fixtures.sh`.

## Admin-Formular (Nutzer-Eingaben)

| Feld | Pflicht | Wer erzeugt es |
|------|---------|----------------|
| Zielgruppe | ja | Nutzer |
| Unternehmen (Name + Beschreibung) | ja | Nutzer |
| `persona_id` | nein | **Persona-Agent** (snake_case aus Company + Zielgruppe; optional manuell unter „Erweitert“) |
| Szenen-Vorschau (Gemini) | nein (default an) | Pipeline Schritt `narrative` |
| Acts, scene_config, Welten | — | Pipeline |

**Szenen-Rhythmus:** Act 2 Morgen privat, Act 3 Tag beruflich, Act 4 Abend privat — `backend/app/pipeline/prompts/persona_system.md`.

## NOVA-Sprache (ElevenLabs)

Admin → **Stories** → Story-Details → Abschnitt **NOVA-Sprache** (oder Job-Detail).

| Env (`backend/.env`) | Bedeutung |
|----------------------|-----------|
| `ELEVENLABS_API_KEY` | API-Key von elevenlabs.io |
| `ELEVENLABS_VOICE_ID` | Voice-ID für NOVA (nicht `el_*` aus scene_config — echte ElevenLabs-ID) |

Output: `webxr/public/voiceovers/de/<track_id>.mp3` (z. B. `nova_de_act2_01.mp3`). Abspielen im Admin per HTML5-Audio; **WebXR-Runtime** lädt dieselben URLs automatisch (Untertitel + MP3).

API: `GET/POST /v1/pipeline/personas/{id}/voiceover-audio` (+ `/generate`).

## Acts review (Sprecher + Welten + Vorschau-Bild)

Nach **narrative** + **compile**: Job-Status `awaiting_worlds`. Admin → **Szenen-Freigabe** (Galerie Acts 2–4) → Button **Welten generieren & publizieren** (`POST …/generate-worlds`). Gemini-PNG = **leeres Environment-Plate** (Marble `--image`), keine narrative Szene mit Personen.

**Previews neu erzeugen:** alte PNGs löschen (`fixtures/generated/{persona}/narrative-previews/`, `webxr/public/narrative-previews/{persona}/`) und Job mit `from_step: narrative` retry — oder `skip_existing_previews: false` im API-Request.

| API | Inhalt |
|-----|--------|
| `GET /v1/pipeline/jobs/{job_id}/acts` | NOVA-Zeilen, `prompt_en`, `negative_prompt`, aufgelöster Marble-Prompt |
| `GET /v1/pipeline/personas/{persona_id}/acts` | gleich ohne Job |

Admin: Job-Detail → Abschnitt **„Acts — Sprecher & Welten“** (nach Act-Schritt).

## Tests

```bash
npm run test:pipeline        # schnell (~Sekunden), ohne @slow E2E
npm run test:pipeline:full   # inkl. gemocktem Full-Pipeline-E2E
```

## E2E-Checkliste

1. Admin: neue Session (nur Zielgruppe + Company)
2. Job-Log bis `completed` (ohne Marble zuerst)
3. Preview: Acts 1–5, Pre-Beat + Beat Untertitel
4. Optional: `generateWorlds` + Anker-Link

## ENV

Siehe [repos-and-urls.md](./repos-and-urls.md) — Studio-Abschnitt.
