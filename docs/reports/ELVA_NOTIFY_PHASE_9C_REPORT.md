# Phase 9C — Align DLT Templates With Approved Fast2SMS Templates

**Status:** Complete  
**Date:** 2026-06-06  
**Scope:** Template schema correction, Message ID visibility, playground input simplification. APIs, DLT routing, and OTP generation logic unchanged.

---

## 1. Summary

eNandi DLT template variable definitions in `backend/config/businesses/enandi/templates.json` were updated to match the approved Fast2SMS DLT sheet. Platform metadata now exposes `messageId` (same value as `templateId`). The playground renders forms dynamically from backend schema — users enter business values only; `otp` is server-generated and hidden from forms.

---

## 2. Files modified

### Backend

| File | Change |
|------|--------|
| `backend/config/businesses/enandi/templates.json` | Corrected all 5 template variable schemas |
| `backend/src/services/otpMappingValidator.service.js` | OTP variable requirements + generic sample builder |
| `backend/src/services/otpDltResolver.service.js` | Generic non-otp variable resolution for OTP DLT |
| `backend/src/controllers/otp.controller.js` | Passes template variable fields from request body generically |
| `backend/src/services/platformMetadata.service.js` | Added `messageId` to template + OTP mapping metadata |
| `backend/scripts/validate-enandi-notify-local.mjs` | Updated test cases |
| `backend/scripts/live-enandi-dlt-test.mjs` | Updated sample variables |

### Frontend

| File | Change |
|------|--------|
| `frontend/lib/business-config-types.ts` | Added `messageId` to types |
| `frontend/lib/dlt-test-utils.ts` | Schema-driven defaults, `messageId` in preview, generic OTP payload |
| `frontend/lib/playground-config.ts` | Updated notify sample variables |
| `frontend/components/playground/template-test-card.tsx` | Message ID in metadata, Fast2SMS payload + resolved variable order |
| `frontend/components/platform/template-details.tsx` | Message ID in DLT mapping block |
| `frontend/components/platform/template-table.tsx` | Message ID column |
| `frontend/components/platform/otp-mappings-table.tsx` | Message ID in mapping detail |

---

## 3. Schema changes — before / after

### LOGIN_OTP

| | Before | After |
|---|--------|-------|
| Variables | `otp` (pos 1) | `businessName` (1), `otp` (2) |
| Pipe example | `482910` | `eNandi\|482910` |
| SMS example | — | "Your OTP for eNandi login is 785112" |

### LOGIN_OTP_WITH_ID

| | Before | After |
|---|--------|-------|
| Variables | `otp` (1), `loginId` (2) | `businessName` (1), `loginId` (2), `otp` (3) |
| Pipe example | `482910\|user_01` | `eNandi\|7488\|482910` |

### ORDER_PLACED

| | Before | After |
|---|--------|-------|
| Variables | `orderId`, `orderDate` | `customerName`, `businessName`, `orderId` |
| Removed | `orderDate` | — |

### ORDER_DELIVERED

| | Before | After |
|---|--------|-------|
| Variables | `orderId`, `deliveryDateTime` | `customerName`, `orderId`, `businessName` |
| Removed | `deliveryDateTime` | — |

### OUT_FOR_DELIVERY

| | Before | After |
|---|--------|-------|
| Variables | `orderId`, `expectedDeliveryTime` | `customerName`, `orderId`, `businessName` |
| Removed | `expectedDeliveryTime` | — |

---

## 4. Message ID visibility

Fast2SMS `message` field in DLT payload = **Message ID** (numeric template registration ID).

Backend platform API now returns:

```json
{
  "templateKey": "LOGIN_OTP",
  "templateId": "1207177979441360359",
  "messageId": "1207177979441360359",
  "senderId": "ELVATK",
  "entityId": "1201177860312735154"
}
```

Displayed on:

- `/platform/businesses/enandi` template table
- `/platform/businesses/enandi/:templateKey` DLT mapping section
- `/platform/otp` mapping detail cards
- Playground DLT metadata panel + Fast2SMS payload preview

---

## 5. Playground input simplification

Forms use `getFormVariables()` — all schema variables except `otp` (server-generated).

| Template | User inputs |
|----------|-------------|
| LOGIN_OTP | `businessName` |
| LOGIN_OTP_WITH_ID | `businessName`, `loginId` |
| ORDER_PLACED | `customerName`, `businessName`, `orderId` |
| ORDER_DELIVERED | `customerName`, `orderId`, `businessName` |
| OUT_FOR_DELIVERY | `customerName`, `orderId`, `businessName` |

No template-key conditionals in frontend — driven entirely by backend variable schema.

OTP requests pass user fields generically in `POST /otp/send` body (additive fields matching variable names).

---

## 6. DLT preview (playground)

Fast2SMS payload preview includes:

```json
{
  "route": "dlt",
  "sender_id": "ELVATK",
  "message": "1207177979441360359",
  "messageId": "1207177979441360359",
  "entity_id": "1201177860312735154",
  "variables_values": "eNandi|******",
  "numbers": "919876543210"
}
```

Plus resolved variable order table and pipe string (OTP masked as `******`).

---

## 7. Verification results

| Check | Result |
|-------|--------|
| `node backend/scripts/validate-enandi-notify-local.mjs` | All 5 templates pass (DLT pipes match approved order) |
| `GET /platform/businesses/enandi/templates/LOGIN_OTP` | `messageId` present, variables `businessName@1`, `otp@2` |
| `npx tsc --noEmit` (frontend) | Pass |
| Frontend hardcoded template keys | None in `*.ts(x)` |
| Frontend obsolete vars (`orderDate`, etc.) | None in `*.ts(x)` |
| OTP APIs / Notify APIs / DLT routing | Unchanged |

### Sample validated DLT pipes

```
LOGIN_OTP:           eNandi|482910
LOGIN_OTP_WITH_ID:   eNandi|7488|482910
ORDER_PLACED:        Arun|eNandi|ORD-2026-001
ORDER_DELIVERED:     Arun|ORD-2026-001|eNandi
OUT_FOR_DELIVERY:    Arun|ORD-2026-001|eNandi
```

---

## 8. Screenshots checklist (manual UI)

- [ ] `/platform/businesses/enandi` — Message ID column visible per template
- [ ] `/platform/businesses/enandi/ORDER_PLACED` — Variables table shows customerName, businessName, orderId
- [ ] `/playground?view=dlt-suite&business=enandi` — LOGIN_OTP form shows only `businessName`
- [ ] Playground ORDER_PLACED — three business fields, no date fields
- [ ] Fast2SMS Payload panel shows `messageId` + resolved variable order + pipe

---

## 9. Remaining Fast2SMS rejection findings (Phase 9B)

Local ELVA validation passes; Fast2SMS may still reject live sends with:

> **Invalid Message ID (or Template, Entity ID)** (HTTP 400 / code 424)

This indicates a **Fast2SMS dashboard registration issue** (template ID, entity ID, or sender mapping), not a variable-order problem in ELVA config. After Phase 9C schema alignment, next step is to verify each Message ID is approved and mapped to sender `ELVATK` and entity `1201177860312735154` in the Fast2SMS DLT portal.

---

## 10. Rollout impact assessment

| Area | Impact |
|------|--------|
| **Notify integrators** | Must update `variables` in `POST /notify` — remove `orderDate`/`deliveryDateTime`/`expectedDeliveryTime`; add `customerName`, `businessName` as per template |
| **OTP integrators** | Must pass `businessName` in `POST /otp/send` (and `loginId` for LOGIN_OTP_WITH_ID mapping) |
| **CMS app (hybrid OTP)** | Same OTP body changes; fallback to legacy SMS unchanged |
| **eNandi app (DLT-only OTP)** | Required `businessName` on OTP send — breaking change for clients not yet sending it |
| **Backend startup** | Passes with updated OTP variable requirements |
| **Platform / Playground** | Auto-reflects new schema — no redeploy of frontend template lists needed |

**Recommendation:** Coordinate with eNandi/mobile clients before production cutover; update integration docs and notify payload examples.
