# Persona Reality — Narrative vs. Pipeline

Stand: Mai 2026

## Was der Besucher in WebXR erleben soll

Der Nutzer **wird zur Persona geführt** — und erkennt **typische Touchpoints**, an denen die Pipeline wirkt: Morgen-Signale, Tages-Freigaben, Abend-Auswertung. Die Persona ist ein **Abbild aus Audion**; Echeon/Checkion/CMS liefern Signale, Daten und Inhalte **als Erlebnis** — nicht als Tool-Namen in NOVA.

## Pipeline (hinter der Kulisse)

| Schicht | Rolle | In WebXR sichtbar? |
|---------|--------|-------------------|
| **Audion** | Persona aus vielen Audion-Ressourcen synthetisieren (Profil, Achsen, Pain Points, Stimme) | Nein — Ergebnis ist die Figur |
| **Echeon** | Welt/Aktualität in Echtzeit auswerten; für **diese** Persona filtern: was relevant ist, wie sie reagieren könnte, was sie bewegt | Nein — Ergebnis sind Feed-Items, Headlines, Morgen-Signale **in ihrer Sprache** |
| **Checkion** | Relevante Seiten der Unternehmens-Website analysieren (Angebot, Cases, Zahlen) | Nein — Ergebnis sind Metriken/Charts **zum Projekt/Kunden**, nicht „checkion“ |
| **CMS / PLEXON** | Dynamisch passenden Inhalt für Szene, Overlay, QR zusammensetzen | Nein — Ergebnis sind UI-Inhalte ohne Tool-Branding |

Act-Zuordnung (technisch, für `data_viz` / `product_layer`):

- Act 2 (Morgen privat) ← Echeon-Schicht → `echeon_feed`
- Act 3 (Tag beruflich) ← Checkion-Schicht → `checkion_chart`
- Act 4 (Abend privat) ← Audion-Schicht → `audion_diegetic`
- Act 5 ← Closure / QR

## NOVA — Sprachregeln (Pflicht)

**Verboten** in `voiceover.lines`, `core_message_de/en`, Narrative-Untertiteln:

- Produktnamen: `echeon`, `checkion`, `audion`, `Echeon`, `CHECKION`, `AUDION`
- Meta-Sätze: „Das ist dein echeon-Feed“, „checkion dokumentiert jeden Schritt“, „AUDION zeigt dir …“
- Messe-/Suite-Narrativ: drei Produkte als Feature-Kette erklären

**Erlaubt / gewünscht (Touchpoint-Sprache):**

| Act | Touchpoint (so sagt NOVA) | Pipeline |
|-----|---------------------------|----------|
| 1 | Spiegel/Profil — „zusammengesetzt aus echten Entscheidungsmustern“ | Audion |
| 2 | Morgenüberblick, kuratierte Meldungen, Signal zum Projekt | Echeon |
| 3 | Freigabe, QA-Fotos, Kennzahlen zum Anbieter | Checkion |
| 4 | Tagesauswertung, Abweichungen, Lessons für morgen | Audion |
| 5 | Drei Momente des Tages + QR | CMS |

- Ich-/Du-Perspektive, konkrete Projekte, `{{company.name}}` wo passend
- **UI/Overlays** zeigen Feed, Chart, diegetische Metriken — NOVA erklärt **Bedeutung**, nicht Produktnamen

## UI vs. Sprache

- `data_viz.mode`, `feed_source`, `anchor_object` (z. B. `rugged_tablet_checkion`) bleiben **technische IDs** im JSON.
- Overlays/Charts dürfen KPIs zeigen; **NOVA** benennt nur **Bedeutung** für die Persona.

## Bestehende Sessions

Golden-Fixtures (z. B. Schott v8, Weber, Klaus) können noch **alte Tool-Namen** in Voiceovers enthalten. Nach Prompt-Update: Acts **neu generieren** (`tik-act-builder` / Pipeline) oder Voiceover manuell überarbeiten, dann compile + publish.

## Referenz in Prompts

- `knowledge/persona-reality-emotional-digital.md` — Gefühl + nur digitale Touchpoints
- `backend/app/pipeline/prompts/act_system.md` — NOVA-Abschnitt
- `backend/app/pipeline/prompts/persona_system.md` — `session_arc` / throughline
- `.cursor/skills/tik-act-builder/references/act-core-matrix.md`
