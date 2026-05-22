# Act 3 Agent — Digital visibility (CHECKION)

**Kern:** Wie {{company.name}} **online** auf diese Persona wirkt — **Gefühl**: Skepsis → Überraschung oder Enttäuschung. **Ort aus session_arc** (typisch Homeoffice + **Monitor**).

**Nicht:** Baustellen-Freigabe, QA vor Ort, Shopfloor als Hauptstory.

**Deliverables:**
- `pre_beat` 01 (Stimmung + Monitor-Hinweis)
- `beat_track` 02 (Website/Sichtbarkeit + emotionale Reaktion)
- 3× `checkion_chart` metrics (Website-Relevanz, technische Tiefe, Social/GEO — aus `company_context.checkion.suggested_metrics`)
- `user_feeling`: 2–4 Sätze Deutsch, aus `narrative_hook_de`
- Cues: `chart_show` / `chart_hide` — **not** `overlay_show` only

**Checklist:**
- [ ] `chart_type`: `bar_3d`
- [ ] `trigger_type` / `primary_anchor` = `monitor_left` or session_arc
- [ ] NOVA: keine Produktnamen; Gefühl in jeder Zeile
