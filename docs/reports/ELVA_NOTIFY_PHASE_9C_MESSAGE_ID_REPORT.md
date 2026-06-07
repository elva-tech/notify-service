# Phase 9C — Fast2SMS Message ID Fix Report

**Date:** 2026-06-06  
**Objective:** Send Fast2SMS Message ID (`216423`, etc.) in the DLT `message` field instead of the TRAI/DLT Template ID (`1207…`).

---

## 1. Files Modified

| File | Change |
|------|--------|
| `backend/config/businesses/enandi/templates.json` | Added `messageId` per template (216423–216427) |
| `backend/config/businesses/workspace/templates.json` | Added placeholder `messageId` fields (scaffold) |
| `backend/config/templates/templates.template.json` | Documented `messageId` in onboarding template |
| `backend/src/businesses/schemaValidator.js` | Validate `messageId`; store in `dlt.messageId`; duplicate check |
| `backend/src/services/dltPayloadResolver.service.js` | Resolve and return `messageId`; log in `dlt_payload_ready` |
| `backend/src/services/sms/providers/fast2sms.js` | `message: messageId` (not `templateId`) |
| `backend/src/services/sms/sms.service.js` | Pass `messageId` to provider |
| `backend/src/services/notification.service.js` | Fix `fast2sms_request_prepared` to log real `messageId` |
| `backend/src/services/platformMetadata.service.js` | Expose `template.dlt.messageId` in API (no longer duplicated from `templateId`) |
| `backend/src/services/otpHealthSnapshot.service.js` | Include `messageId` in metadata completeness |
| `backend/src/services/businessConfigAudit.service.js` | Warn on placeholder `messageId` |

Frontend playground already reads `messageId` from the platform API (`dlt-test-utils.ts`, `template-test-card.tsx`); no behavioral changes required beyond API now returning correct values.

---

## 2. Before / After Payload Comparison

### Before (broken)

```json
{
  "route": "dlt",
  "sender_id": "ELVATK",
  "message": "1207177979441360359",
  "entity_id": "1201177860312735154",
  "variables_values": "eNandi|785112",
  "numbers": "918660397320"
}
```

**Fast2SMS response:** HTTP 424 — `Invalid Message ID (or Template, Entity ID)`

### After (fixed)

```json
{
  "route": "dlt",
  "sender_id": "ELVATK",
  "message": "216423",
  "entity_id": "1201177860312735154",
  "variables_values": "eNandi|005928",
  "numbers": "918660397320"
}
```

**Fast2SMS response:** HTTP 200 — `return: true`, `"SMS sent successfully."`

Both `templateId` (TRAI) and `messageId` (Fast2SMS) are preserved internally for logging and platform metadata.

---

## 3. Example LOGIN_OTP Payload

| Field | Value |
|-------|-------|
| Template Key | `LOGIN_OTP` |
| Template ID (TRAI) | `1207177979441360359` |
| Message ID (Fast2SMS) | `216423` |
| Sender ID | `ELVATK` |
| Entity ID | `1201177860312735154` |
| Variables | `eNandi\|005928` |

Outbound Fast2SMS body:

```json
{
  "route": "dlt",
  "sender_id": "ELVATK",
  "message": "216423",
  "entity_id": "1201177860312735154",
  "variables_values": "eNandi|005928",
  "numbers": "918660397320"
}
```

---

## 4. Example ORDER_PLACED Payload

| Field | Value |
|-------|-------|
| Template Key | `ORDER_PLACED` |
| Template ID (TRAI) | `1207177979197056177` |
| Message ID (Fast2SMS) | `216424` |
| Sender ID | `ELVATK` |
| Entity ID | `1201177860312735154` |
| Variables | `Arun\|eNandi\|ORD-001` |

Outbound Fast2SMS body:

```json
{
  "route": "dlt",
  "sender_id": "ELVATK",
  "message": "216424",
  "entity_id": "1201177860312735154",
  "variables_values": "Arun|eNandi|ORD-001",
  "numbers": "918660397320"
}
```

---

## 5. Verification Logs

### `dlt_payload_ready`

```json
{
  "event": "dlt_payload_ready",
  "templateId": "1207177979441360359",
  "messageId": "216423",
  "senderId": "ELVATK",
  "entityId": "1201177860312735154"
}
```

### `fast2sms_request_prepared` (LOGIN_OTP via POST /otp/send)

```json
{
  "event": "fast2sms_request_prepared",
  "templateKey": "LOGIN_OTP",
  "templateId": "1207177979441360359",
  "messageId": "216423",
  "variablesValues": "eNandi|005928",
  "senderId": "ELVATK",
  "entityId": "1201177860312735154"
}
```

### `provider_response` (LOGIN_OTP)

```json
{
  "event": "provider_response",
  "route": "dlt",
  "httpStatus": 200,
  "return": true,
  "templateId": "1207177979441360359"
}
```

### `provider_response` (ORDER_PLACED direct send)

```json
{
  "event": "provider_response",
  "route": "dlt",
  "httpStatus": 200,
  "return": true,
  "providerResponse": {
    "return": true,
    "message": ["SMS sent successfully."]
  }
}
```

---

## 6. Fast2SMS Accept / Reject Result

| Test | Result |
|------|--------|
| LOGIN_OTP (`POST /otp/send`, appId `eNandi`) | **Accepted** — HTTP 200, `return: true`, API `success: true` |
| ORDER_PLACED (direct DLT send) | **Accepted** — HTTP 200, `return: true`, `"SMS sent successfully."` |
| Before fix (templateId in `message`) | **Rejected** — HTTP 424, invalid Message ID |

---

## eNandi Message ID Mapping

| Template Key | messageId | templateId (TRAI) |
|--------------|-----------|-------------------|
| LOGIN_OTP | 216423 | 1207177979441360359 |
| ORDER_PLACED | 216424 | 1207177979197056177 |
| ORDER_DELIVERED | 216425 | 1207177979979637116 |
| LOGIN_OTP_WITH_ID | 216426 | 1207177979905330405 |
| OUT_FOR_DELIVERY | 216427 | 1207177987065122467 |

---

## Verification Commands Run

```bash
npm run backend:dev
# POST /otp/send — eNandi LOGIN_OTP to 918660397320 → 200 success
# Direct ORDER_PLACED DLT send → return:true
```

**Conclusion:** Root cause confirmed and fixed. Fast2SMS DLT API requires the Fast2SMS Message ID in the `message` field; TRAI template IDs remain in config and logs for compliance traceability.
