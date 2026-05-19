# SICK — Thomas Berger · Vollständige Session-Story (DE)

**persona_id:** `sick_instandhaltung_lebensmittel_v1`  
**Throughline:** Stör- und Audit-Tag in der Getränkeabfüllung — Linie steht, IFS-Audit in 48 Stunden.

**Runtime:** `webxr/.env.local` → `VITE_SCENE_CONFIG_URL=/scene_configs/sick_instandhaltung_lebensmittel_v1_de.json`

---

## Act 1 — Transformation (Void / Spiegel)

*Trigger: Szene betreten*

1. Willkommen bei Persona Reality.
2. Gleich wirst du jemand anderem — Thomas Berger, Leiter Instandhaltung in Regensburg.
3. Schau in den Spiegel. Dein Stör- und Audit-Tag an der Abfülllinie beginnt jetzt.

→ Auto-Advance zu Act 2

---

## Act 2 — Abfülllinie / echeon (05:45)

*Ort: `sick-filling-line-stoppage` · Pre-Beat, dann Pickup am Wartungswagen-Tablet*

**Pre-Beat (nova_de_act2_01):**

1. Kurz vor sechs — Abfüllhalle in Regensburg. Die Linie steht.
2. Rote Meldung am HMI. IFS-Audit in zwei Tagen. Jede Minute zählt.
3. Am Wartungswagen wartet dein Tablet. Der Tag beginnt mit Informationen.

**Beat (Pickup → nova_de_act2_02):**

1. Das ist dein echeon-Feed — kuratiert für Leiter Instandhaltung wie dich.
2. Stillstände, Sensorik, Audit-Vorbereitung — was Food-Produktion heute bewegt.

*Feed-Headlines (echeon):* Predictive Maintenance Abfülllinien · IFS nach CIP · Fehlalarme Förderstrecken

---

## Act 3 — Leitstand / CHECKION (11:30)

*Ort: `sick-production-control-room` · Pre-Beat, dann Blick auf Wandmonitor*

**Pre-Beat (nova_de_act3_01):**

1. Halb zwölf — Leitstand. Die Linie steht noch. Schichtbuch offen.
2. CHECKION zeigt, wie sichtbar dein Werk und SICK AG im Fachsegment online sind.
3. Schau auf den Wandmonitor.

**Beat (Look-at → nova_de_act3_02):**

1. Betriebs-Sichtbarkeit, Lieferanten-Ranking, Technik-Content-Score — auf einen Blick.
2. So erleben Produktionsleitung und Zulieferer eure digitale Präsenz.

---

## Act 4 — CIP-Technikraum / AUDION (21:15)

*Ort: `sick-cip-technical-room-evening` · Pre-Beat, dann Sit-down auf Stuhl*

**Pre-Beat (nova_de_act4_01):**

1. Spätabend im CIP-Raum. Der Reinigungszyklus läuft länger als geplant — die Linie bleibt still.
2. Setz dich. Hier wird die Last greifbar — am Panel und in den Audit-Ordnern.

**Beat (Sit-down → nova_de_act4_02):**

1. AUDION macht sichtbar, was dich wirklich beschäftigt.
2. Ausfallrisiko, Audit-Druck — nicht abstrakt, sondern hier im Raum.

*Diegetische Metriken:* Ausfallrisiko 81% (CIP-Panel) · Audit-Druck 74% (IFS-Ordner)

---

## Act 5 — Abschluss (Void / Constellation)

*Ort: `void-constellation` · Timer → QR*

**Beat (Timer → nova_de_act5_01):**

1. Du hast Thomas Berger fünf Minuten lang erlebt.
2. echeon, CHECKION, AUDION — ein Stör- und Audit-Tag aus seiner Perspektive.
3. Scanne den Code — dein Report für SICK AG wartet.

*Timeline:* QR-Overlay ~17s · Session-Ende ~38s

---

## Pfade

| Asset | Pfad |
|-------|------|
| scene_config | `fixtures/golden/sick_instandhaltung_lebensmittel_v1_de.json` |
| narrative | `fixtures/narrative/sick_instandhaltung_lebensmittel_v1_de.json` |
| WebXR public | `webxr/public/scene_configs/` + `narrative/` |
