# Persona Reality × PLEXON Integration

Stand: Juni 2026

## Rolle von PLEXON

PLEXON bleibt **Control Plane** — Persona Reality ist ein **föderiertes Produkt** wie CHECKION und AUDION:

| PLEXON owned | Persona Reality owned |
|--------------|----------------------|
| Login / Identität | VR Session Runtime |
| Entitlements (wer darf Booth bedienen) | `scene_config.json` Composition |
| Usage / Billing Events | Quest + iPad Apps |
| Platform Projects (Kunde ↔ Produkte) | Environment Library, VR Personas |
| Product Registry & Health | Take-home Reports |

Keine Persona-Daten und keine VR-Assets in PLEXON-DB.

---

## 1. Product Registry

**Datei (PLEXON):** `lib/platform-products.ts`

Geplanter Eintrag:

```typescript
{
  id: 'persona_reality',
  name: 'Persona Reality',
  descriptionKey: 'products.personaReality.description',
  lifecycle: 'active',
  surface: 'federated',
  promoted: false,
  primaryActionKey: 'products.personaReality.open',
  homeUrl: getPersonaRealityUrl(),       // iPad / Booth Dashboard
  loginUrl: null,                         // nutzt PLEXON-Login
  healthUrl: `${getAudionPersonaRealityUrl()}/health`,
  capabilities: ['vr_sessions', 'booth_operator', 'reports'],
  defaultAccess: 'hidden',               // nur mit Entitlement
}
```

**Constants (PLEXON):** `lib/constants.ts`

```typescript
export function getPersonaRealityUrl(): string | null {
  return runtimeEnv('NEXT_PUBLIC_PERSONA_REALITY_URL');
}
export function getAudionPersonaRealityUrl(): string | null {
  return runtimeEnv('AUDION_PERSONA_REALITY_URL');
}
```

---

## 2. Federation Contract (bestehend)

Persona Reality **consumiert** den etablierten Vertrag — keine Sonder-API in PLEXON.

| Endpoint | Nutzung |
|----------|---------|
| `POST /api/auth/validate-credentials` | iPad Companion Login |
| `GET /api/services/profile` | Operator-Name in Booth-UI |
| `POST /api/services/usage/events` | Session composed |
| `GET /api/platform/products` | Produktkachel + Health |

**Headers:** `X-Plexon-Contract-Version`, `X-Service-Secret` (nur Service-to-Service).

Referenz: `PLEXON/knowledge/platform-federation-contract.md`

---

## 3. Usage Events

Nach jedem erfolgreichen `POST /v1/sessions`:

```json
{
  "event_key": "pr-session-{scene_id}",
  "user_id": "{plexon_operator_id}",
  "service": "persona_reality",
  "event_type": "session_composed",
  "quantity": 1,
  "metadata": {
    "persona_id": "klaus_dortmund",
    "language": "de",
    "client_id": "vaillant",
    "duration_sec": 300
  }
}
```

Idempotenz über `event_key` = `scene_id` aus `meta`.

---

## 4. Platform Projects → CHECKION Binding

**Heute in AUDION:** `projects.checkion_project_id`

**Booth-Flow:**

```
client_id (z.B. vaillant)
  → PLEXON platform_project (company)
    → AUDION project binding
      → checkion_project_id
        → CHECKION geo/ranking/domain summaries
```

**Neue Tabelle (AUDION):** `pr_client_bindings`

| client_id | checkion_project_id | brand_layer_defaults |
|-----------|---------------------|----------------------|
| vaillant | uuid-... | logo, colors |

Admin-UI später in PLEXON unter Platform Project → Tab „Persona Reality“.

---

## 5. Entitlements

**Neues Entitlement-Flag:** `persona_reality.booth_operator`

| Rolle | Rechte |
|-------|--------|
| `booth_operator` | iPad: Persona wählen, Session starten |
| `persona_reality.admin` | Environment/Persona Library pflegen (AUDION Admin) |
| MSQ Admin | Alles + PLEXON Registry |

Provisioning wie CHECKION: `PUT {AUDION}/api/platform/provisioning/users/{id}`

---

## 6. Board / MCP (Phase 6)

Optionaler MCP-Tool auf AUDION MCP Server:

| Tool | Beschreibung |
|------|--------------|
| `persona_reality_compose_session` | Debug: persona_id + language → scene_config summary |
| `persona_reality_match_environment` | Act + persona → top-3 envs |

Ermöglicht Messe-Setup-Debugging aus PLEXON Board ohne Quest.

---

## 7. Deep Links

**Federation query params** (`lib/federation-links.ts`):

```
{NEXT_PUBLIC_PERSONA_REALITY_URL}/booth
  ?plexon_source=plexon
  &plexon_return_to={encodeURIComponent(plexonUrl)}
  &platformProjectId={id}
  &client_id=vaillant
```

---

## 8. Implementierungsreihenfolge PLEXON

1. **Phase 1–4:** Kein PLEXON-Code nötig (AUDION + WebXR mit API Token)
2. **Phase 5:** iPad nutzt PLEXON Login + Entitlement-Check
3. **Phase 6:** Registry-Eintrag, Usage Events, env vars in Coolify
4. **Phase 7+:** Admin-Bindings UI, Board MCP Tools

---

## 9. Coolify Env (ergänzend)

Siehe `PLEXON/knowledge/coolify-env-variablen.md` — hinzufügen:

| Variable | App |
|----------|-----|
| `NEXT_PUBLIC_PERSONA_REALITY_URL` | PLEXON, Companion |
| `AUDION_PERSONA_REALITY_URL` | PLEXON, Companion |
| `PLEXON_SERVICE_SECRET` | AUDION /v1 (für Usage push) |
