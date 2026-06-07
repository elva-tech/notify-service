# Business Configuration Reference

| | |
|---|---|
| **Purpose** | Field-level reference for `business.json`, `templates.json`, and OTP mappings. |
| **Intended Audience** | Developers and operators onboarding businesses. |
| **Last Updated** | 2026-06-05 |
| **Related Documents** | [Onboarding Guide](./onboarding-guide.md) · [Validation Rules](./validation-rules.md) |

---

## Directory layout

```text
backend/config/businesses/<businessId>/
├── business.json
└── templates.json

backend/config/templates/          # scaffolding templates (Phase 9A)
├── business.template.json
├── templates.template.json
└── otp-mapping.template.json
```

---

## business.json

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `businessId` | string | yes | Must match folder name; pattern `^[a-z][a-z0-9-]*$` |
| `displayName` | string | yes | Human-readable name for portal |
| `version` | string | yes | Business config version (e.g. `v1`) |
| `dlt.entityId` | string | yes | DLT principal entity ID |
| `dlt.defaultSenderId` | string | yes | Default sender ID for templates |

Example:

```json
{
  "businessId": "enandi",
  "displayName": "eNandi",
  "version": "v1",
  "dlt": {
    "entityId": "1201177860312735154",
    "defaultSenderId": "ELVATK"
  }
}
```

---

## templates.json

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `templates` | array | yes | Non-empty list of DLT templates |
| `templates[].templateKey` | string | yes | Unique key within business |
| `templates[].purpose` | string | yes | Human-readable description |
| `templates[].templateId` | string | yes | DLT-registered template ID |
| `templates[].variables` | array | yes | Ordered variable definitions |

### Variable fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | yes | Variable name |
| `position` | integer | yes | 1-based DLT position |
| `type` | string | yes | `numeric`, `string`, `date`, `datetime`, `time` |
| `required` | boolean | yes | Whether variable is mandatory |
| `length` | integer | no | Fixed length (numeric) |
| `digitsOnly` | boolean | no | Numeric digits constraint |
| `maxLength` | integer | no | Max string length |
| `pattern` | string | no | Regex pattern |
| `format` | string | no | Date/time format hint |

---

## OTP mapping entry

In `backend/config/otp-mappings.json`:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `business` | string | yes | Registered `businessId` |
| `templateKey` | string | yes | Template key for OTP SMS |
| `dltEnabled` | boolean | no | Per-app DLT activation |
| `legacyRouteEnabled` | boolean | no | Route=q fallback (default `true`) |

---

## Generator

```bash
node backend/scripts/create-business.mjs <businessId> [--display-name "Name"]
```

Fails if business folder already exists or `businessId` format is invalid.
