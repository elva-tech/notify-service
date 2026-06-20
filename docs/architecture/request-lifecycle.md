# Request Lifecycle

| | |
|---|---|
| **Purpose** | Document end-to-end request lifecycles for every major ELVA Notify flow: OTP send, OTP verify, legacy SMS, DLT template SMS, and email. |
| **Intended Audience** | Developers, maintainers, and integrators who need to understand what happens between HTTP request and provider response. |
| **Last Updated** | 2026-06-05 |
| **Related Documents** | [Architecture Overview](./overview.md) · [DLT Layer](./dlt-layer.md) · [OTP API](../api/otp.md) · [Notify API](../api/notify.md) · [Authentication](../api/authentication.md) · [Error Codes](../api/error-codes.md) |

---

## Concepts

Every authenticated request passes through a common pipeline before reaching flow-specific logic:

1. **JSON parse** — `express.json()`
2. **Request ID** — UUID assigned to `req.requestId`, returned as `X-Request-Id` header and in JSON body
3. **Global rate limit** — 10 requests/minute per `appId` (or `apiKey` / IP fallback)
4. **Authentication** — `validateAppApiKey` on `/otp/*` and `/notify`
5. **Controller** — Validation and orchestration
6. **Services** — Business logic, provider calls, logging
7. **Response** — JSON with `success`, `requestId`, and flow-specific fields

Controllers do **not** emit logs. Services log via `businessLogger` with the propagated `requestId`.

---

## 1. OTP Send Lifecycle

**Endpoint:** `POST /otp/send`

Additional middleware (after auth): `checkOtpSendCooldown` → `rateLimitOtpSend`

```mermaid
sequenceDiagram
    participant Client
    participant MW as Middleware
    participant Auth as validateAppApiKey
    participant Cool as checkOtpSendCooldown
    participant Rate as rateLimitOtpSend
    participant Ctrl as otp.controller
    participant OTP as otp.service
    participant Redis
    participant Notif as notification.service
    participant SMS as sms.service
    participant F2S as Fast2SMS

    Client->>MW: POST /otp/send {appId, apiKey, phone}
    MW->>MW: requestId + global rate limit
    MW->>Auth: Validate credentials
    alt Invalid credentials
        Auth-->>Client: 401 unauthorized / 403 forbidden
    end
    Auth->>Cool: Check otp:cooldown:{appId}:{phone}
    alt Cooldown active
        Cool-->>Client: 429 cooldown_active
    end
    Cool->>Rate: Increment phone rate buckets
    alt Rate exceeded
        Rate-->>Client: 429 rate_limited
    end
    Rate->>Ctrl: assertSendOtpBodyValid
    alt Validation failed
        Ctrl-->>Client: 400 validation_error
    end
    Ctrl->>OTP: generateOTP(phone, appId)
    OTP->>Redis: SET otp:{appId}:{phone} hash+salt+attempts TTL 300s
    OTP->>OTP: logOtp otp_generated
    OTP-->>Ctrl: {otp, expiresInSeconds}
    Ctrl->>Notif: sendNotification(channel, templateData:{otp})
    alt OTP DLT enabled (OTP_DLT_ENABLED + dltEnabled)
        Notif->>Notif: otpDltResolver → buildDltPayload
        Notif->>SMS: sendDltTemplated → sendDltSMS route dlt
        SMS->>F2S: POST bulkV2 {route:dlt, templateId, variables}
    else Legacy fallback
        Notif->>SMS: sendOTP → sendSMS route q
        SMS->>F2S: POST bulkV2 {route:q, message, numbers}
    end
    alt Provider failure
        F2S-->>SMS: HTTP error
        SMS-->>Notif: throw
        Notif->>Notif: log otp_notification_failed
        Notif-->>Ctrl: throw
        Ctrl->>OTP: revokeOTP
        Ctrl-->>Client: 502 sms_failed
    end
    F2S-->>SMS: 200 OK
    Notif->>Notif: logOtp otp_notification_sent
    Notif->>Notif: logOtp otp_delivery_completed
    Ctrl->>Ctrl: applyAfterSuccessfulSend cooldown
    Ctrl-->>Client: 200 {success, expiresIn, requestId}
```

### Real Request

```json
{
  "appId": "enandi-app",
  "apiKey": "your-secret-key",
  "phone": "919876543210"
}
```

### Real Success Response

```json
{
  "success": true,
  "message": "OTP sent successfully",
  "expiresIn": 300,
  "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

### Real Failure Response (provider)

```json
{
  "success": false,
  "error": "sms_failed",
  "message": "Failed to send OTP. Please try again.",
  "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

> **Note:** OTP SMS uses Fast2SMS `route=dlt` when `OTP_DLT_ENABLED=true` and the app mapping has `dltEnabled: true` (see [OTP DLT Migration](./otp-dlt-migration.md)). Otherwise it falls back to route `q` with message: `Your ELVA OTP is {otp}. It expires in 5 minutes.`

---

## 2. OTP Verify Lifecycle

**Endpoint:** `POST /otp/verify`

No cooldown or OTP rate-limit middleware on verify.

```mermaid
sequenceDiagram
    participant Client
    participant Auth as validateAppApiKey
    participant Ctrl as otp.controller
    participant OTP as otp.service
    participant Redis

    Client->>Auth: POST /otp/verify {appId, apiKey, phone, otp}
    alt Auth failed
        Auth-->>Client: 401/403
    end
    Auth->>Ctrl: Validate body fields
    alt Missing fields
        Ctrl-->>Client: 400 validation_error
    end
    Ctrl->>OTP: verifyOTP(phone, otp, appId)
    OTP->>OTP: Normalize phone + appId
    alt Invalid format
        OTP-->>Ctrl: {valid:false, reason:invalid_otp_format}
        Ctrl-->>Client: 400
    end
    OTP->>Redis: HGETALL otp:{appId}:{phone}
    alt Key missing
        OTP-->>Ctrl: {valid:false, reason:not_found}
        Ctrl-->>Client: 404 not_found
    end
    OTP->>OTP: Compare hashed OTP
    alt Match
        OTP->>Redis: DEL key
        OTP->>OTP: logOtp otp_verify_outcome + otp_verified
        Ctrl-->>Client: 200 success
    else Mismatch
        OTP->>Redis: INCR attempts
        OTP->>OTP: logOtp otp_verify_outcome
        alt attempts >= 3
            OTP->>Redis: DEL key
            OTP-->>Ctrl: {valid:false, reason:max_attempts}
            Ctrl-->>Client: 429 max_attempts
        else
            OTP-->>Ctrl: {valid:false, reason:mismatch}
            Ctrl-->>Client: 401 mismatch
        end
    end
```

### Real Request

```json
{
  "appId": "enandi-app",
  "apiKey": "your-secret-key",
  "phone": "919876543210",
  "otp": "482910"
}
```

### Real Success Response

```json
{
  "success": true,
  "message": "OTP verified successfully",
  "requestId": "b2c3d4e5-f6a7-8901-bcde-f12345678901"
}
```

### Real Failure Response (wrong OTP)

```json
{
  "success": false,
  "error": "mismatch",
  "message": "Invalid OTP",
  "requestId": "b2c3d4e5-f6a7-8901-bcde-f12345678901"
}
```

---

## 3. Legacy SMS Notify Lifecycle

**Endpoint:** `POST /notify` with `message` field (no `business`/`templateKey`)

```mermaid
sequenceDiagram
    participant Client
    participant Auth as validateAppApiKey
    participant Ctrl as notify.controller
    participant Notif as notification.service
    participant SMS as sms.service
    participant F2S as Fast2SMS

    Client->>Auth: POST /notify {channel:SMS, to, message}
    Auth->>Ctrl: handleNotify
    Ctrl->>Ctrl: classifyNotifySmsMode → legacy
    alt Missing message
        Ctrl-->>Client: 400 validation_error
    end
    Ctrl->>Notif: sendNotification({message, ...})
    Notif->>Notif: logNotification legacy_sms_dispatch
    Notif->>SMS: sendMessage per recipient
    SMS->>F2S: POST bulkV2 {route:q, message, numbers}
    F2S-->>SMS: Response
    SMS->>SMS: logNotification provider_response
    Notif->>Notif: logNotification notification_sent
    alt Provider error
        Notif->>Notif: logError notification_failed
        Ctrl-->>Client: 500 notification_failed
    end
    Ctrl-->>Client: 200 {success, channel, requestId}
```

### Real Request

```json
{
  "appId": "enandi-app",
  "apiKey": "your-secret-key",
  "channel": "SMS",
  "to": ["919876543210"],
  "message": "Your order has been approved."
}
```

### Real Success Response

```json
{
  "success": true,
  "message": "Notification sent",
  "channel": "SMS",
  "requestId": "c3d4e5f6-a7b8-9012-cdef-123456789012"
}
```

---

## 4. DLT Template Notify Lifecycle

**Endpoint:** `POST /notify` with `business`, `templateKey`, `variables`

```mermaid
sequenceDiagram
    participant Client
    participant Auth as validateAppApiKey
    participant Ctrl as notify.controller
    participant TV as templateValidation
    participant Reg as Business Registry
    participant Notif as notification.service
    participant DLT as dltPayloadResolver
    participant SMS as sms.service
    participant F2S as Fast2SMS

    Client->>Auth: POST /notify {business, templateKey, variables}
    Auth->>Ctrl: handleNotify
    Ctrl->>Ctrl: classifyNotifySmsMode → template
    Ctrl->>TV: validateTemplateRequest
    TV->>Reg: getBusiness(apnakart)
    alt Unknown business
        TV-->>Ctrl: unsupported_business
        Ctrl-->>Client: 400
    end
    TV->>Reg: getTemplate(apnakart, templateKey)
    alt Unknown template
        TV-->>Ctrl: invalid_template
        Ctrl-->>Client: 400
    end
    TV->>TV: validateVariables
    alt Invalid variables
        TV-->>Ctrl: missing_variable / validation_error
        Ctrl-->>Client: 400
    end
    TV-->>Ctrl: validatedTemplate
    Ctrl->>Notif: sendNotification({validatedTemplate})
    Notif->>Notif: logNotification notification_dispatch
    Notif->>DLT: buildDltPayload
    DLT->>DLT: Resolve templateId, senderId, entityId
    DLT->>DLT: Build variablesValues pipe-separated
    DLT->>DLT: logDlt dlt_payload_ready
    Notif->>SMS: sendDltTemplated per recipient
    SMS->>F2S: POST bulkV2 {route:dlt, sender_id, message:templateId, variables_values, entity_id}
    F2S-->>SMS: Response
    SMS->>SMS: logDlt provider_response
    Notif->>Notif: logNotification notification_sent
    Ctrl-->>Client: 200 {success, templateKey, requestId}
```

### Real Request

```json
{
  "appId": "enandi-app",
  "apiKey": "your-secret-key",
  "channel": "SMS",
  "to": ["919876543210"],
  "business": "apnakart",
  "templateKey": "OUT_FOR_DELIVERY",
  "variables": {
    "orderId": "ORD-2026-001",
    "expectedDeliveryTime": "14:30"
  }
}
```

### Real Success Response

```json
{
  "success": true,
  "message": "Notification sent",
  "channel": "SMS",
  "templateKey": "OUT_FOR_DELIVERY",
  "requestId": "d4e5f6a7-b8c9-0123-def0-234567890123"
}
```

---

## 5. Email Notify Lifecycle

**Endpoint:** `POST /notify` with `channel: EMAIL`

```mermaid
sequenceDiagram
    participant Client
    participant Auth as validateAppApiKey
    participant Ctrl as notify.controller
    participant Notif as notification.service
    participant Email as email.service
    participant SG as SendGrid

    Client->>Auth: POST /notify {channel:EMAIL, to, subject, html}
    Auth->>Ctrl: handleNotify
    Ctrl->>Ctrl: Validate subject + html/template
    alt Invalid email body
        Ctrl-->>Client: 400 validation_error
    end
    Ctrl->>Notif: sendNotification
    Notif->>Notif: logNotification email_dispatch
    Notif->>Email: sendEmail
    Email->>Email: ensureSendgridConfigured
    alt Missing SENDGRID_API_KEY or EMAIL_FROM
        Email-->>Notif: throw
        Ctrl-->>Client: 500 notification_failed
    end
    Email->>SG: sgMail.send
    SG-->>Email: Response
    Notif->>Notif: logNotification notification_sent
    Ctrl-->>Client: 200 {success, channel:EMAIL, requestId}
```

### Real Request (HTML)

```json
{
  "appId": "enandi-app",
  "apiKey": "your-secret-key",
  "channel": "EMAIL",
  "to": ["user@example.com"],
  "subject": "Order Confirmation",
  "html": "<h1>Your order is confirmed</h1><p>Thank you for shopping with eNandi.</p>"
}
```

### Real Success Response

```json
{
  "success": true,
  "message": "Notification sent",
  "channel": "EMAIL",
  "requestId": "e5f6a7b8-c9d0-1234-ef01-345678901234"
}
```

---

## Rate Limits and Cooldowns Summary

| Flow | Limit | Error |
|------|-------|-------|
| All routes | 10 req/min per `appId` | `rate_limited` (429) |
| OTP send/resend | 3 req/min per phone | `rate_limited` (429) |
| OTP send/resend | 10 req/hr per phone | `rate_limited` (429) |
| OTP send/resend | Cooldown after successful SMS send | `cooldown_active` (429) |
| OTP verify | Max 3 wrong attempts per OTP | `max_attempts` (429) |

---

## Troubleshooting Notes

| Symptom | Lifecycle stage | Action |
|---------|-----------------|--------|
| `cooldown_active` immediately after send | OTP send | Wait for cooldown key expiry in Redis |
| OTP sent but not received | Provider step | Check Fast2SMS logs (`provider_response_failed`) |
| DLT 400 before send | Validation | Fix `variables` format — see [ApnaKart Templates](../businesses/apnakart.md) |
| `notification_failed` with DLT | Fast2SMS DLT route | Verify template ID and PEID are approved |
| Email 500 | SendGrid step | Confirm `SENDGRID_API_KEY` and `EMAIL_FROM` |

---

## Related Flow Comparison

| Aspect | OTP Send | Legacy SMS | DLT SMS | Email |
|--------|----------|------------|---------|-------|
| Endpoint | `/otp/send` | `/notify` | `/notify` | `/notify` |
| Redis | Yes | No | No | No |
| Fast2SMS route | `q` | `q` | `dlt` | — |
| Template validation | No | No | Yes | No |
| Response includes `templateKey` | No | No | Yes | No |
