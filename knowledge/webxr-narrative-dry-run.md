# WebXR Narrative Dry-Run Checklist

Stand: Mai 2026 · Mit ElevenLabs-MP3 unter `webxr/public/voiceovers/de/<track_id>.mp3`.

## Voraussetzungen

```bash
cd TIK
node scripts/merge-narrative-into-scene-config.mjs
cd webxr && npm run sync:config && npm run dev
```

Quest: `https://<LAN-IP>:5173`

## Checkliste

- [ ] **Act 1:** Drei NOVA-Zeilen nacheinander, Auto-Advance zu Act 2
- [ ] **Act 2:** Pre-Story (Küche), Hint auf Handy, Pickup → Feed-Overlay **nach** Text (nicht sofort)
- [ ] **Act 3:** Pre-Story, Hint Monitor, Look-at → CHECKION-Dashboard nach Zeile
- [ ] **Act 4:** Sofa-Hint, Sit-down → diegetische Metriken (Kalender + Dokumente)
- [ ] **Act 5:** Timer-VO, QR-Overlay ~17s, Session Ende
- [ ] Gesamtdauer Desktop ~4–5 min (ohne Audio)
- [ ] Quest: Untertitel lesbar, Overlay zwischen Kamera und Hotspot

## Daten

| Asset | Pfad |
|-------|------|
| Authoring | `fixtures/narrative/klaus_dortmund_de.json` |
| Merged config | `fixtures/golden/klaus_dortmund_de.json` |
| Runtime | `webxr/public/scene_configs/` + `webxr/public/narrative/` |

## NOVA-Audio (ElevenLabs)

1. Admin → Stories → **NOVA-Sprache** → Spuren generieren (`ELEVENLABS_*` in `backend/.env`).
2. MP3s liegen unter `webxr/public/voiceovers/de/`.
3. WebXR: `VoiceoverLinePlayer` spielt MP3 + Untertitel parallel; ohne Datei → nur Untertitel-Timing wie bisher.

| Asset | Pfad |
|-------|------|
| MP3 | `webxr/public/voiceovers/de/<track_id>.mp3` |
| URL-Helfer | `webxr/src/config/voiceover-audio.ts` |
