# ELVA OTP Service

A small **Express** microservice that generates and verifies one-time passwords (OTP), stores them in **Redis** (hashed), delivers codes via **SMS** (Fast2SMS), and isolates traffic per **application** using `appId` and API key authentication.

---

## Authentication

Every OTP endpoint expects a JSON body that includes:

| Field     | Description |
|----------|-------------|
| `appId`  | Application identifier (must match a key in server config). |
| `apiKey` | Secret for that application. |

Credentials are defined at startup using the environment variable `APP_CREDENTIALS_JSON` (a JSON object mapping `appId` → secret). Example:

```json
{"my-app":"your-secret-key","other-app":"another-secret"}
```

- Missing or empty `appId` / `apiKey` → **401** (`error`: `unauthorized`).
- Unknown `appId`, wrong key, or invalid `appId` format (e.g. contains `:`) → **403** (`error`: `forbidden`).

`appId` in the body is also used as the **tenant key** for OTP storage (`otp:{appId}:{phone}` in Redis).

---

## Endpoints

Base URL is your server origin (e.g. `http://localhost:3000`). All OTP routes expect `Content-Type: application/json`.

### 1. `POST /otp/send`

Generates a 6-digit OTP, stores it in Redis, and sends it by SMS.

**Request body**

```json
{
  "appId": "my-app",
  "apiKey": "your-secret-key",
  "phone": "+919876543210"
}
```

**Success — `200 OK`**

```json
{
  "success": true,
  "message": "OTP sent successfully",
  "expiresIn": 300
}
```

`expiresIn` is the OTP time-to-live in **seconds** (default: 5 minutes).

---

### 2. `POST /otp/resend`

Revokes any existing OTP for the same `appId` + `phone`, then runs the same flow as **send** (new code, SMS, Redis).

**Request body**

Same as **send**:

```json
{
  "appId": "my-app",
  "apiKey": "your-secret-key",
  "phone": "+919876543210"
}
```

**Success — `200 OK`**

Same shape as **send**:

```json
{
  "success": true,
  "message": "OTP sent successfully",
  "expiresIn": 300
}
```

---

### 3. `POST /otp/verify`

Checks the submitted OTP against the stored hash for that `appId` and `phone`.

**Request body**

```json
{
  "appId": "my-app",
  "apiKey": "your-secret-key",
  "phone": "+919876543210",
  "otp": "123456"
}
```

**Success — `200 OK`**

```json
{
  "success": true,
  "message": "OTP verified successfully"
}
```

On success, the OTP is consumed (removed from Redis).

---

## Error response shape

Failures use a consistent JSON body (except where noted):

```json
{
  "success": false,
  "error": "<code>",
  "message": "<human-readable text>"
}
```

Field `error` is a short machine-oriented code; `message` is safe to show to API clients.

---

## Common `error` codes and HTTP status

| HTTP | `error`           | Typical cause |
|------|-------------------|---------------|
| 400 | `validation_error` | Invalid or missing body fields (`phone`, `appId`, `otp`), or failed normalization. |
| 401 | `unauthorized`    | Missing / invalid type or empty `appId` or `apiKey` (auth middleware). |
| 401 | `mismatch`        | OTP does not match (verify). |
| 403 | `forbidden`       | `appId` / `apiKey` do not match configured credentials. |
| 404 | `not_found`       | No active OTP for this `appId` + phone (verify). |
| 410 | `expired`         | OTP TTL elapsed (key gone or treated as expired). |
| 429 | `max_attempts`    | Too many failed verify attempts for this OTP. |
| 429 | `rate_limited`    | Send/resend rate limit exceeded for this **phone** (see below). |
| 502 | `sms_failed`      | SMS provider error; OTP is rolled back in Redis. |
| 500 | `internal_error`  | Unexpected server error. |

Additional verify-only codes (with **400** unless noted): `invalid_input`, `invalid_phone`, `invalid_app_id`, `invalid_otp_format`.

---

## Rate limiting

Applied only to **`POST /otp/send`** and **`POST /otp/resend`** (after API key checks).

- Per **normalized phone number** (digits only), using Redis fixed windows:
  - **3** requests per **minute**
  - **10** requests per **hour**
- If a limit is exceeded: **429** with `error`: `rate_limited` and  
  `message`: `"Too many OTP requests. Try later."`

`POST /otp/verify` is not rate-limited by this middleware.

---

## Operations quick reference

- **Runtime**: Node.js 18+
- **Config**: copy `.env.example` to `.env` — set `REDIS_*`, `FAST2SMS_API_KEY`, `APP_CREDENTIALS_JSON`, etc.
- **Start**: `npm install` then `npm start` (or `npm run dev` with watch).

`GET /health` is available for load balancer or uptime checks (no authentication).
