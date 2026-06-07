# ELVA Notify Platform

Monorepo for the ELVA Notify platform:

| Package | Path | Purpose |
|---------|------|---------|
| **Backend** | `backend/` | Express OTP + Notify API |
| **Frontend** | `frontend/` | Documentation portal (Next.js) |
| **Docs** | `docs/` | Markdown source of truth (API, architecture, testing, phase reports) |

The **backend** generates and verifies one-time passwords (OTP), stores them in **Redis** (hashed), delivers codes via **SMS** (Fast2SMS) and **EMAIL** (SendGrid), exposes a unified **Notification API** (`POST /notify`), and isolates traffic per **application** using `appId` and API key authentication.

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

Base URL is your server origin (e.g. `http://localhost:4000` for local backend). All OTP routes expect `Content-Type: application/json`.

### 1. `POST /otp/send`

Generates a 6-digit OTP, stores it in Redis, and sends it by SMS (default) or EMAIL.

**Request body**

```json
{
  "appId": "my-app",
  "apiKey": "your-secret-key",
  "phone": "+919876543210"
}
```

**EMAIL example**

```json
{
  "appId": "my-app",
  "apiKey": "your-secret-key",
  "channel": "EMAIL",
  "email": "user@example.com"
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

Revokes any existing OTP for the same `appId` + recipient (`phone` or `email`), then runs the same flow as **send** (new code, SMS/EMAIL, Redis).

**Request body**

Same as **send**:

```json
{
  "appId": "my-app",
  "apiKey": "your-secret-key",
  "phone": "+919876543210"
}
```

**EMAIL example**

```json
{
  "appId": "my-app",
  "apiKey": "your-secret-key",
  "channel": "EMAIL",
  "email": "user@example.com"
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

Checks the submitted OTP against the stored hash for that `appId` and recipient (`phone` or `email`).

**Request body**

```json
{
  "appId": "my-app",
  "apiKey": "your-secret-key",
  "phone": "+919876543210",
  "otp": "123456"
}
```

**EMAIL example**

```json
{
  "appId": "my-app",
  "apiKey": "your-secret-key",
  "email": "user@example.com",
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

## Notification API

Unified API for direct SMS and EMAIL notifications. Use `channel` to choose delivery mode.

### `POST /notify`

#### Common fields

| Field | Type | Required | Description |
|------|------|----------|-------------|
| `appId` | string | Yes | Application identifier. |
| `apiKey` | string | Yes | Secret for the provided app. |
| `channel` | string | Yes | `SMS` or `EMAIL`. |
| `to` | string[] | Yes | Non-empty array of recipients. |

### SMS Example

```json
{
  "appId": "my-app",
  "apiKey": "your-secret-key",
  "channel": "SMS",
  "to": ["919876543210"],
  "message": "Your task is approved"
}
```

### EMAIL Example (HTML)

```json
{
  "appId": "my-app",
  "apiKey": "your-secret-key",
  "channel": "EMAIL",
  "to": ["user@example.com"],
  "subject": "Welcome",
  "html": "<h1>Hello</h1>"
}
```

### EMAIL Example (Template)

```json
{
  "appId": "my-app",
  "apiKey": "your-secret-key",
  "channel": "EMAIL",
  "to": ["user@example.com"],
  "subject": "Welcome",
  "template": "basic",
  "data": {
    "name": "User"
  }
}
```

### Success Response

```json
{
  "success": true,
  "message": "Notification sent",
  "channel": "EMAIL",
  "requestId": "uuid"
}
```

### Failure Response

```json
{
  "success": false,
  "error": "notification_failed",
  "message": "Provider error message",
  "channel": "SMS",
  "requestId": "uuid"
}
```

---

## Validation Rules

### EMAIL

- `subject` is required.
- Either `html` OR `template` is required.
- `html` and `template` cannot be used together.
- `data` must be an object when provided.

### SMS

- `message` is required.

### General

- `to` must be a non-empty array.
- Invalid `channel` returns **400** with `error: invalid_channel`.

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
| 400 | `invalid_channel` | Unsupported channel in notify requests. |
| 500 | `notification_failed` | Notification provider/send failure on `/notify`. |
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

### Global Rate Limit

- **10** requests per **minute**
- Applied globally per `appId` / `apiKey` / IP fallback (in-memory limiter)

---

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | HTTP server port (default `3000`). |
| `NODE_ENV` | No | Runtime environment (default `development`). |
| `FAST2SMS_API_KEY` | Yes (SMS) | Fast2SMS API key for SMS delivery. |
| `SENDGRID_API_KEY` | Yes (EMAIL) | SendGrid API key for email delivery. |
| `EMAIL_FROM` | Yes (EMAIL) | From-address used for email sends. |
| `APP_CREDENTIALS_JSON` | Yes | JSON object mapping `appId` to `apiKey`. |

---

## Repository layout

```
.
├── backend/          # Express API (src/, public/)
├── frontend/         # Next.js documentation portal
├── docs/             # Markdown documentation source
└── package.json      # Root orchestrator scripts
```

## Operations quick reference

- **Runtime**: Node.js 18+ (see `backend/.nvmrc` and `frontend/.nvmrc`)
- **Backend config**: copy `backend/.env.example` to `backend/.env`
- **Frontend config**: optional `frontend/.env` (see `frontend/.env.example`)
- **No shared root `.env`** — each package has its own environment

| Command | Description |
|---------|-------------|
| `npm run backend:dev` | Start backend API (port **4000** via `backend/.env`) |
| `npm run backend:start` | Production backend |
| `npm run frontend:dev` | Start docs portal (port **3000**) |
| `npm run dev` | Start backend + frontend together |
| `npm run build` | Build frontend only |
| `npm run otp:health` | Generate OTP DLT health snapshot |

`GET /health` is available for load balancer or uptime checks (no authentication). When an OTP health snapshot exists, the response includes an additive `otpDlt` summary object.

### OTP DLT observability (Phase 8C)

| Resource | Description |
|----------|-------------|
| [/platform/otp](http://localhost:3000/platform/otp) | Rollout dashboard, config health, retirement gate |
| `npm run otp:health` | Generate `backend/.generated/otp-health-snapshot.json` |
| `docs/architecture/otp-dlt-observability.md` | SLIs, log taxonomy, aggregation guide |
| `docs/runbooks/` | Outage, rollback, rollout, log triage, retirement readiness |

Key log events: `otp_delivery_completed`, `otp_verify_outcome`, `otp_config_health`, `otp_dlt_fallback`.

Phase implementation reports and audit artifacts are in [`docs/reports/`](docs/reports/). See [docs/README.md](docs/README.md) for the full documentation map.

See [backend/README.md](backend/README.md) and [frontend/README.md](frontend/README.md) for package-specific instructions.

---

## Notes

- SMS delivery may fail without DLT registration/compliance (India telecom regulation).
- Email delivery is powered by SendGrid.
- OTP values are stored as hashes in Redis.
- Service is multi-tenant and isolated via `appId`.
