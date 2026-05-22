# Session arc — agent-authored (not a room catalog)

Der **Persona-Agent** konzipiert die komplette Session: durchgehende Story + **pro Act der passende Ort zur Tageszeit**.

## Tagesrhythmus (Pflicht)

| Act | Zeit | Ort | Produkt |
|-----|------|-----|---------|
| 1 | — | Void / Spiegel | — |
| 2 | **Morgen** | **Privat** (Küche, Pendeln, Café, Balkon) | echeon |
| 3 | **Tag** | **Beruflich** (Büro, Baustelle, Labor, Meeting) | checkion |
| 4 | **Abend** | **Privat** (Zuhause, Esstisch, Homeoffice-Ecke) | audion |
| 5 | — | Void / Constellation | Closure |

**Business-Kontext** bleibt in Throughline, Headlines und Metriken — nur **nicht** fünf× derselbe Firmenraum.

## Pflicht: `session_arc` im Profile

| Feld | Aufgabe |
|------|---------|
| `throughline_de` / `throughline_en` | Ein Satz: wovon handelt die 5 Minuten emotional? |
| `day_structure_de` | z. B. „Morgen zu Hause → Review im Büro → Abend zu Hause“ |
| `anti_patterns_de` | Min. 2: kein Büro-Monoton, Act 2/4 nicht workplace_default |
| `acts["1".."5"]` | Je Act ein **ActArcScene** (siehe Schema) |

## Pro Act frei wählen (innerhalb des Rhythmus)

- **Act 2:** `setting_class` eher `residential_morning`, `commute`, `cafe_morning` — echeon am Phone/Tablet
- **Act 3:** `workplace_office`, `industrial_floor`, `site_trailer`, …
- **Act 4:** `residential_evening`, `home_study` — audion-Anker am heimischen Tisch/Ordner
- **Zeit & Licht:** `time_of_day` + `lighting_preset` passend (Act 2 `morning_warm`, Act 4 `evening_warm`)
- **IDs:** `environment_id` + `world_slug` neu erfinden (snake_case / kebab-case)
- **negative_prompt_en** in session_arc optional, sonst im Act-Blueprint

## Gute vs. schwache Szenen (Schott Glasbau)

**Gut:**
- Act 2: Frühstücksecke, Tablet mit echeon-Feed, Fassaden-Skizze auf dem Küchentisch
- Act 3: Ingenieurbüro mittags, Monitor mit CHECKION-Metriken
- Act 4: Abends am Esstisch, Normenmappe und Fassadendetail-Druck, AUDION-Metriken

**Schwach:**
- Act 2–4 alle im Planungsbüro
- Act 4 = leerer Projektraum im Unternehmen nach Feierabend
- Küche→Büro→Sofa ohne Glasbau-Bezug

## Danach

`tik-act-builder` / Pipeline-Act-Agent liest `session_arc.acts[N]` und schreibt vollständige `act_blueprint` — **Szene nicht in generisches Büro umbiegen**.
