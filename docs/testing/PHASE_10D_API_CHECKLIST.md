# Phase 10D — API Validation Checklist

Use this checklist before eNandi production integration. Run against staging/local with real credentials and a test handset.

**Base URL:** `{{API_BASE_URL}}` (set `NEXT_PUBLIC_API_BASE_URL`; production: `https://api.notify.elvatech.in`)  
**Test appId:** `eNandi`  
**Test phone:** `918660397320` (or your handset)

Reference: [Postman collection](./POSTMAN_COLLECTION.md)

---

## OTP APIs

| # | Test | Pass | Notes |
|---|------|------|-------|
| □ | **Send OTP** — `POST /otp/send` returns 200, `expiresIn: 300` | | SMS received on handset |
| □ | **Verify OTP success** — correct code returns 200 | | Redis key deleted after verify |
| □ | **Verify OTP wrong** — wrong code returns 401 `mismatch` | | `attempts` increments in Redis |
| □ | **Resend cooldown** — `/otp/resend` within 30s returns 429 `cooldown_active` | | |
| □ | **Resend success** — after cooldown, resend returns 200, new SMS | | Old OTP hash rotated |
| □ | **Email OTP send** — `channel: EMAIL` returns 200 | | Email received |
| □ | **Email OTP verify** — verify with code from email returns 200 | | Same Redis key pattern as SMS |

---

## Notify APIs

| # | Test | Pass | Notes |
|---|------|------|-------|
| □ | **ORDER_PLACED** — `POST /notify` returns 200 | | Fast2SMS `return: true` in logs |
| □ | **ORDER_DELIVERED** — `POST /notify` returns 200 | | Pipe order: customerName\|orderId\|businessName |
| □ | **OUT_FOR_DELIVERY** — `POST /notify` returns 200 | | messageId 216427 |
| □ | **LOGIN_OTP blocked** — `/notify` + LOGIN_OTP returns 400 `otp_template_not_supported` | | Confirms OTP/notify split |

---

## Redis validation

Inspect with `redis-cli` during OTP tests.

| # | Test | Pass | Command / expected |
|---|------|------|-------------------|
| □ | **OTP key created** | | `HGETALL otp:eNandi:<phone>` → hash, salt, attempts=0 |
| □ | **Cooldown key created** | | `GET otp:cooldown:eNandi:<phone>` → `1`, TTL ~30 |
| □ | **OTP deleted after verify** | | After success: `TTL otp:eNandi:<phone>` → `-2` |
| □ | **Attempts increment** | | After wrong verify: `attempts` → 1, then 2 |
| □ | **Max attempts delete key** | | 3rd wrong verify: key gone, HTTP 429 |

---

## DLT validation (server logs)

Search logs by `requestId` from API response.

| # | Test | Pass | Expected log fields |
|---|------|------|---------------------|
| □ | **provider_response return=true** | | `"return": true`, `"route": "dlt"` |
| □ | **Correct messageId** | | LOGIN_OTP→216423, ORDER_PLACED→216424, etc. |
| □ | **Correct templateId** | | TRAI ID in logs (not in Fast2SMS `message` field) |
| □ | **Correct senderId** | | `ELVATK` |
| □ | **Correct entityId** | | `1201177860312735154` |
| □ | **OTP redaction** | | `fast2sms_request_prepared.variablesValues` shows `eNandi\|******` — **no plaintext OTP in logs** |

---

## Security / production readiness

| # | Test | Pass | Notes |
|---|------|------|-------|
| □ | No OTP in API responses | | Send returns only `expiresIn` |
| □ | No OTP in structured logs | | Phase 10D redaction active |
| □ | `OTP_DLT_ENABLED=true` in production | | eNandi uses DLT-only path |
| □ | OpenAPI validates | | `npm run openapi:validate` |
| □ | Business config validates | | `npm run validate:businesses` |

---

## Sign-off

| Role | Name | Date | Result |
|------|------|------|--------|
| Integrator | | | |
| Platform | | | |

**Remaining blockers:** Document any failed items above before go-live.
