# Business Onboarding Runbook

| | |
|---|---|
| **Purpose** | Operational procedure for onboarding a new business to ELVA Notify. |
| **Intended Audience** | Platform engineers, release approvers. |
| **Last Updated** | 2026-06-05 |
| **Related Documents** | [Onboarding Guide](../businesses/onboarding-guide.md) · [Business Governance](../architecture/business-governance.md) |

---

## Brand onboarding (developer requests)

Developers submit brand access via the portal; ops approves in the platform UI.

| Step | Who | Action |
|------|-----|--------|
| 1 | Developer | Open `/onboard`, choose templates, submit request |
| 2 | System | Emails requester (status link) and `ADMIN_NOTIFY_EMAIL` |
| 3 | Ops | Open `/platform/approvals`, enter `OPS_ADMIN_TOKEN`, approve or reject |
| 4 | System | On approve: upserts active brand in `brand-registry.json`; emails requester |
| 5 | Developer | ELVA emails `appId`, `apiKey`, and `brandId` after approval |

### Required env

```env
ADMIN_NOTIFY_EMAIL=ops@elvatech.in
OPS_ADMIN_TOKEN=<secret>
PLATFORM_PUBLIC_URL=https://notify.elvatech.in
SENDGRID_API_KEY=<key>
EMAIL_FROM=noreply@elvatech.in
```

### Verify after approval

```bash
curl -s "$API_BASE/platform/brands" | jq '.brands[] | select(.brandId=="<brandId>")'
```

---

## Legacy business module onboarding

The steps below apply when adding a new **business module** (DLT config under `config/businesses/`). Brand-only onboarding uses the flow above.


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
