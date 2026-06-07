# Business Validation Failure Response

| | |
|---|---|
| **Purpose** | Diagnose and resolve business configuration validation failures. |
| **Intended Audience** | On-call engineers, platform maintainers. |
| **Last Updated** | 2026-06-05 |
| **Related Documents** | [Validation Rules](../businesses/validation-rules.md) · [Onboarding Guide](../businesses/onboarding-guide.md) |

---

## Symptoms

- Backend fails to start with business configuration error
- `npm run validate:businesses` returns `FAIL`
- Portal shows business as `Invalid`

---

## Immediate actions

1. Run `npm run validate:businesses` and capture full output
2. Identify failing `businessId` from diagnostics
3. Open `backend/config/businesses/<businessId>/` files
4. Fix schema errors (see table below)

---

## Common failures

| Message | Fix |
|---------|-----|
| `businessId must match folder name` | Align folder name and `business.json` `businessId` |
| `Duplicate templateKey` | Rename or remove duplicate template |
| `Duplicate templateId` | Assign unique DLT template IDs |
| `Duplicate variable position` | Re-number variable positions |
| `unsupported type` | Use allowed types: numeric, string, date, datetime, time |
| `OTP mapping references unknown business` | Fix `business` field or add business folder |
| `OTP mapping references unknown template` | Add template to `templates.json` |

---

## WARN vs FAIL

| Level | Action |
|-------|--------|
| **FAIL** | Blocks startup if schema invalid; fix before deploy |
| **WARN** | Startup succeeds; replace placeholders before production |

---

## Verification

```bash
npm run validate:businesses
npm run business:health
npm run frontend:build
```

Portal [/platform/businesses](/platform/businesses) should show updated readiness.
