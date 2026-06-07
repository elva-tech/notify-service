# ELVA Notify — API Testing Collection (Postman / curl)

| | |
|---|---|
| **Purpose** | Copy-paste API requests for eNandi integration testing without the Playground. |
| **API base URL** | `{{API_BASE_URL}}` (from `NEXT_PUBLIC_API_BASE_URL`) |
| **Production example** | `https://api.notify.elvatech.in` |
| **Credentials** | `appId: eNandi`, `apiKey: <from APP_CREDENTIALS_JSON>` |

**Headers (all requests):**

```
Content-Type: application/json
```

`appId` and `apiKey` go in the **JSON body**, not headers.

---

## Postman environment variables

| Variable | Example |
|----------|---------|
| `baseUrl` | `{{API_BASE_URL}}` |
| `appId` | `eNandi` |
| `apiKey` | `eNandi_123` |
| `phone` | `918660397320` |
| `email` | `user@example.com` |

---

## 1. OTP SEND (SMS)

**Endpoint:** `POST {{baseUrl}}/otp/send`

**Body:**
```json
{
  "appId": "{{appId}}",
  "apiKey": "{{apiKey}}",
  "phone": "{{phone}}"
}
```

**Expected response (200):**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "expiresIn": 300,
  "requestId": "<uuid>"
}
```

**Common failures:**

| HTTP | error | Cause |
|------|-------|-------|
| 401 | `unauthorized` | Missing apiKey |
| 403 | `forbidden` | Wrong credentials |
| 429 | `cooldown_active` | Resend within 30s of prior SMS send |
| 429 | `rate_limited` | >3/min or >10/hr per phone |
| 502 | `sms_failed` | Fast2SMS rejection; OTP revoked from Redis |

**curl:**
```bash
curl -X POST "$baseUrl/otp/send" \
  -H "Content-Type: application/json" \
  -d '{"appId":"eNandi","apiKey":"eNandi_123","phone":"918660397320"}'
```

---

## 2. OTP VERIFY SUCCESS

**Endpoint:** `POST {{baseUrl}}/otp/verify`

Use the 6-digit code received by SMS (not returned in API response).

**Body:**
```json
{
  "appId": "{{appId}}",
  "apiKey": "{{apiKey}}",
  "phone": "{{phone}}",
  "otp": "123456"
}
```

**Expected response (200):**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "requestId": "<uuid>"
}
```

**curl:**
```bash
curl -X POST "$baseUrl/otp/verify" \
  -H "Content-Type: application/json" \
  -d '{"appId":"eNandi","apiKey":"eNandi_123","phone":"918660397320","otp":"123456"}'
```

---

## 3. OTP VERIFY FAILURE

Same endpoint; submit wrong code.

**Expected response (401):**
```json
{
  "success": false,
  "error": "mismatch",
  "message": "Invalid OTP",
  "requestId": "<uuid>"
}
```

After 3 failed attempts:

**Expected response (429):**
```json
{
  "success": false,
  "error": "max_attempts",
  "message": "Too many failed attempts. Request a new code."
}
```

---

## 4. OTP RESEND

**Endpoint:** `POST {{baseUrl}}/otp/resend`

**Body:** Same as OTP SEND.

**Expected response (200):** Same shape as send (`expiresIn: 300`).

**Common failures:**

| HTTP | error | Cause |
|------|-------|-------|
| 429 | `cooldown_active` | Within 30s of successful send/resend |

**curl:**
```bash
curl -X POST "$baseUrl/otp/resend" \
  -H "Content-Type: application/json" \
  -d '{"appId":"eNandi","apiKey":"eNandi_123","phone":"918660397320"}'
```

---

## 5. EMAIL OTP SEND

**Endpoint:** `POST {{baseUrl}}/otp/send`

**Body:**
```json
{
  "appId": "{{appId}}",
  "apiKey": "{{apiKey}}",
  "channel": "EMAIL",
  "email": "{{email}}"
}
```

**Expected response (200):** Same as SMS send.

**curl:**
```bash
curl -X POST "$baseUrl/otp/send" \
  -H "Content-Type: application/json" \
  -d '{"appId":"eNandi","apiKey":"eNandi_123","channel":"EMAIL","email":"user@example.com"}'
```

---

## 6. EMAIL OTP VERIFY

**Endpoint:** `POST {{baseUrl}}/otp/verify`

**Body:**
```json
{
  "appId": "{{appId}}",
  "apiKey": "{{apiKey}}",
  "email": "{{email}}",
  "otp": "123456"
}
```

**Expected response (200):** Same as SMS verify success.

---

## 7. ORDER_PLACED (Notify)

**Endpoint:** `POST {{baseUrl}}/notify`

**Body:**
```json
{
  "appId": "{{appId}}",
  "apiKey": "{{apiKey}}",
  "channel": "SMS",
  "to": ["{{phone}}"],
  "templateKey": "ORDER_PLACED",
  "variables": {
    "customerName": "Arun",
    "businessName": "eNandi",
    "orderId": "ORD-2026-001"
  }
}
```

**DLT pipe order:** `customerName|businessName|orderId`

**Expected response (200):**
```json
{
  "success": true,
  "message": "Notification sent",
  "channel": "SMS",
  "templateKey": "ORDER_PLACED",
  "requestId": "<uuid>"
}
```

**Common failures:**

| HTTP | error | Cause |
|------|-------|-------|
| 400 | `missing_variable` | Missing `orderId`, etc. |
| 500 | `notification_failed` | Fast2SMS rejection |

**curl:**
```bash
curl -X POST "$baseUrl/notify" \
  -H "Content-Type: application/json" \
  -d '{
    "appId":"eNandi",
    "apiKey":"eNandi_123",
    "channel":"SMS",
    "to":["918660397320"],
    "templateKey":"ORDER_PLACED",
    "variables":{"customerName":"Arun","businessName":"eNandi","orderId":"ORD-2026-001"}
  }'
```

---

## 8. ORDER_DELIVERED (Notify)

**Body:**
```json
{
  "appId": "{{appId}}",
  "apiKey": "{{apiKey}}",
  "channel": "SMS",
  "to": ["{{phone}}"],
  "templateKey": "ORDER_DELIVERED",
  "variables": {
    "customerName": "Arun",
    "orderId": "ORD-2026-001",
    "businessName": "eNandi"
  }
}
```

**DLT pipe order:** `customerName|orderId|businessName`

**Expected response (200):** `templateKey: ORDER_DELIVERED`

---

## 9. OUT_FOR_DELIVERY (Notify)

**Body:**
```json
{
  "appId": "{{appId}}",
  "apiKey": "{{apiKey}}",
  "channel": "SMS",
  "to": ["{{phone}}"],
  "templateKey": "OUT_FOR_DELIVERY",
  "variables": {
    "customerName": "Arun",
    "orderId": "ORD-2026-001",
    "businessName": "eNandi"
  }
}
```

**DLT pipe order:** `customerName|orderId|businessName` (same shape as ORDER_DELIVERED; different `templateKey` / messageId)

**Expected response (200):** `templateKey: OUT_FOR_DELIVERY`

---

## Blocked: LOGIN_OTP via Notify

**Do not use** `/notify` for login OTP.

```json
POST /notify  templateKey=LOGIN_OTP  →  400 otp_template_not_supported
```

Use **§1 OTP SEND** instead.

---

## Template mapping reference

| templateKey | API | messageId | variables (pipe order) |
|-------------|-----|-----------|------------------------|
| LOGIN_OTP | `/otp/send` | 216423 | businessName \| otp |
| LOGIN_OTP_WITH_ID | `/otp/send` (+ loginId) | 216426 | businessName \| loginId \| otp |
| ORDER_PLACED | `/notify` | 216424 | customerName \| businessName \| orderId |
| ORDER_DELIVERED | `/notify` | 216425 | customerName \| orderId \| businessName |
| OUT_FOR_DELIVERY | `/notify` | 216427 | customerName \| orderId \| businessName |

Shared DLT metadata: `senderId=ELVATK`, `entityId=1201177860312735154`
