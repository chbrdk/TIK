# Persona Reality — Pipeline-Zwischensequenzen (3D / Diagramme)

Stand: Mai 2026 · Status: **Konzept** (noch nicht im Runtime-Default)

## Frage

Sollen **feste Zwischensequenzen** mit animierten 3D-Objekten/Diagrammen zeigen, *was im Hintergrund passiert* — z. B. Audion (Entscheidungs-Zusammensetzung), Echeon (Filter aus tausenden Meldungen auf Relevanz)?

**Kurzantwort:** Ja — aber **sparsam**, **persona-nah**, **ohne Toolnamen in NOVA**. Der Besucher bleibt die Persona; die Animation ist **Metapher für sein Erlebnis**, nicht MSQ-Produkt-Schulung.

## Was heute schon da ist

| Baustein | Ort | Limit |
|----------|-----|-------|
| `CheckionMonitorDashboard3d` | Am Monitor, `chart_show` | 3 Balken, Reveal-Animation |
| `DiegeticMetricBadge` | Ankern Act 4 | Pulse/Glow, keine Erklär-Story |
| `OverlayPanel` / `BetweenViewOverlay` | Feed, Dashboard, QR | 2D-Panel, kein Pipeline-Diagramm |
| Act-Crossfade | Splat-Wechsel | Kein inhaltliches Diagramm |
| `TimelineCue` | subtitle, overlay, chart, diegetic | **Kein** `pipeline_interstitial` |

→ Die **Idee** ergänzt die Lücke zwischen „Daten-UI“ und „verstehen, warum ich diese drei Meldungen sehe“.

## Zwei Platzierungen (empfohlen: beides, unterschiedliche Länge)

### A) In-Szene (diegetisch) — **Hauptweg**

Animation **auf dem Anker** (Tablet, Monitor), während Thomas in Küche/Homeoffice bleibt.

| Act | Metapher (ohne Produktname) | Komponente (Vorschlag) |
|-----|----------------------------|------------------------|
| 1 | Viele Profilepunkte → **ein Abbild** | `AudionComposeDiagram3d` am Spiegel/void_anchor |
| 2 | Wolke Meldungen → **3 bleiben** | `EcheonFilterDiagram3d` auf Tablet-Screen |
| 3 | Generische Seite → **seine** Seite | `CheckionPersonalizeDiagram3d` am Monitor (+ bestehendes Bar-Chart) |
| 4 | Tagespunkte → **Muster** | Erweiterung `DiegeticMetricBadge` / kleine Timeline |
| 5 | Blöcke → **sein** Report/QR | `CmsAssembleDiagram3d` am QR-Panel |

**NOVA dazu:** nur Gefühl („Plötzlich nur noch drei — er atmet auf“), nicht „Echeon filtert“.

### B) Feste Void-Micro-Sequenz (optional) — **max. 1× pro Session**

10–20 s in `void-minimal`, **ein** generisches Set pro Pipeline-Schicht, Parameter aus Persona:

- nach Act 1: nur Audion-Abbild (optional, wenn Spiegel-Act zu kurz)
- **oder** gar keine Void-Erklärer — alles in A)

**Nicht:** nach jedem Act eine Schulungssequenz (bricht emotionalen Tagesbogen).

## Feste Module (wiederverwendbar)

Ein Modul pro Schicht, **gleiche Geometrie** für alle Personas, **variable Daten**:

```
webxr/src/world/pipeline/
  AudionComposeDiagram3d.tsx    # N Silhouetten/Tags → 1 Kern
  EcheonFilterDiagram3d.tsx       # Partikel-Wolke → Funnel → 3 Labels (headlines)
  CheckionPersonalizeDiagram3d.tsx # 2 Ebenen: generic | personalized (Storyblok-Texturen)
  CmsAssembleDiagram3d.tsx      # Content-Blöcke → eine Seite
  pipelineAnimation.ts          # gemeinsames Reveal-Timing
```

**Inputs (aus `scene_config` / compile):**

- Audion: `persona.display_name`, Achsen-Labels (sector, decision_style …)
- Echeon: `data_layers.echeon.feed_items[]` (die 3 Headlines)
- Checkion: `storyblok` textures + `checkion.metrics`
- CMS: `report.qr_url`, optional `brand_layer`

## Timeline / Contract

Neuer Cue-Typ (Vorschlag):

```json
{
  "type": "pipeline_diagram",
  "at_sec": 4,
  "layer": "echeon",
  "anchor_object": "kitchen_tablet",
  "duration_sec": 8,
  "delay_from_beat": true
}
```

`CueDispatcher` → Event `pipeline_diagram` → `EnvironmentScene` rendert passendes Modul.

Alternativ ohne Schema-Änderung: bestehende Cues kombinieren (`chart_show` + `diegetic_metric` + kurzer `fade`) — weniger ausdrucksstark.

## Dramaturgie-Regeln

1. **Persona-Gefühl führt** — Animation illustriert *seine* Überforderung/Erleichterung, nicht Feature-Liste.
2. **Digital only** — keine Fabrik-, keine Prozess-Optimierungs-Diagramme.
3. **Kurz** — 6–12 s Animation, dann zurück zur Szene / NOVA weiter.
4. **Keine Produktnamen** in Voiceover während Diagramm (siehe `persona-reality-emotional-digital.md`).
5. **Quest-tauglich** — wenige Draw Calls, keine schweren GLB-Imports pro Act (Module einmal im Bundle).

## Was *nicht* tun

- Zwischensequenz nach **jedem** Act mit identischer Länge
- Lange Erklärertexte zu Audion/Echeon/Checkion/CMS
- Arbeitsplatz-ROI-Charts als „Pipeline“
- Pro Persona neue 3D-Assets — nur **Parameter** wechseln

## Implementierungsreihenfolge (wenn gebaut)

1. **EcheonFilterDiagram3d** am Tablet (Act 2) — stärkster „Aha“-Moment (Wolke → 3)
2. **CheckionPersonalizeDiagram3d** + bestehendes `CheckionMonitorDashboard3d` (Act 3)
3. **AudionComposeDiagram3d** Spiegel Act 1
4. Cue `pipeline_diagram` + Schema + act_system Hinweis „optional diagram cue“
5. CMS Act 5

## Bezug zu Story-Authoring

In `act_system.md` / blueprints: `beat_cue_templates` können `pipeline_diagram` enthalten, wenn die Szene einen Erklär-Moment braucht — **optional**, nicht Pflicht pro Act.

Siehe auch: `persona-reality-emotional-digital.md`, `persona-reality-narrative-layer.md`.
