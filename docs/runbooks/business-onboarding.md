# Business Onboarding Runbook

| | |
|---|---|
| **Purpose** | Operational procedure for onboarding a new business to ELVA Notify. |
| **Intended Audience** | Platform engineers, release approvers. |
| **Last Updated** | 2026-06-05 |
| **Related Documents** | [Onboarding Guide](../businesses/onboarding-guide.md) · [Business Governance](../architecture/business-governance.md) |

---

## Prerequisites

- DLT entity ID and sender ID approved
- DLT template IDs registered for each template
- `businessId` chosen per naming standards

---

## Procedure

### 1. Scaffold

```bash
node backend/scripts/create-business.mjs <businessId> --display-name "<Display Name>"
```

### 2. Configure DLT

Replace all `REPLACE_*` values in:

- `backend/config/businesses/<businessId>/business.json`
- `backend/config/businesses/<businessId>/templates.json`

### 3. Validate

```bash
npm run validate:businesses
```

Resolve all `FAIL` items. Review `WARN` items before production.

### 4. OTP mapping (if applicable)

Add entry to `backend/config/otp-mappings.json`.

### 5. Deploy

1. Restart backend (loads new business at startup)
2. Rebuild frontend: `npm run frontend:build`
3. Verify [/platform/businesses](/platform/businesses) shows expected readiness

### 6. Approve production

Confirm checklist shows:

- [ ] business.json valid
- [ ] templates.json valid
- [ ] DLT metadata complete
- [ ] OTP mapping configured (if OTP app)
- [ ] Production ready

---

## Rollback

Remove business folder and restart backend. Remove OTP mappings referencing the business.
