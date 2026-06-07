# Business Validation Rules

| | |
|---|---|
| **Purpose** | Schema and governance rules enforced at startup and via validation CLI. |
| **Intended Audience** | Platform maintainers, onboarding operators. |
| **Last Updated** | 2026-06-05 |
| **Related Documents** | [Configuration Reference](./configuration-reference.md) · [Business Governance](../architecture/business-governance.md) |

---

## Validation layers

```mermaid
flowchart LR
    A[Config files] --> B[Startup schema validator]
    B --> C[Service registry]
    A --> D[validate:businesses CLI]
    D --> E[PASS / WARN / FAIL]
    E --> F[business-health-snapshot.json]
    F --> G[/platform/businesses]
```

**Startup validation** (unchanged): schema errors abort process.

**CLI validation** (Phase 9A): adds WARN for placeholders and missing OTP mappings.

---

## Schema rules (FAIL)

| Rule | Error |
|------|-------|
| Missing `business.json` or `templates.json` | Folder incomplete |
| `businessId` ≠ folder name | ID mismatch |
| Duplicate `templateKey` | Within business |
| Duplicate `templateId` | Within business |
| Duplicate variable `position` | Within template |
| Empty `templates` array | No templates |
| Invalid variable `type` | Unsupported type |
| OTP mapping references unknown business/template | Mapping consistency |

---

## Governance rules (WARN)

| Rule | Code |
|------|------|
| DLT field contains placeholder (`REPLACE`, `TODO`) | `placeholder_dlt_field` |
| Template ID is placeholder | `placeholder_template_id` |
| No OTP mapping for business | `otp_mapping_missing` |

---

## Readiness states

| Status | Criteria |
|--------|----------|
| **Production** | Schema valid, DLT complete, OTP mapped |
| **Ready** | Schema valid, DLT complete, no OTP mapping |
| **Draft** | Schema valid but placeholders remain |
| **Invalid** | Schema validation failed |

---

## CLI usage

```bash
npm run validate:businesses
```

Exit code `1` only on `FAIL`. `WARN` exits `0` with warnings printed.

---

## Health snapshot

`backend/.generated/business-health-snapshot.json` — generated at startup and by validation CLI.
