# ELVA Notify Backend

Express microservice for OTP generation/verification, SMS (legacy + DLT), and email notifications.

## Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your Redis, Fast2SMS, SendGrid, and APP_CREDENTIALS_JSON values
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start with file watch (default port from `.env`) |
| `npm start` | Production start |

## Environment

Copy `backend/.env.example` to `backend/.env`. Do not use a shared root `.env`.

| Variable | Description |
|----------|-------------|
| `PORT` | HTTP port (use `4000` for local dev alongside frontend on `3000`) |
| `REDIS_*` | Redis connection |
| `FAST2SMS_*` | SMS provider |
| `SENDGRID_API_KEY`, `EMAIL_FROM` | Email provider |
| `APP_CREDENTIALS_JSON` | `appId` → `apiKey` map |

## API

| Endpoint | Auth |
|----------|------|
| `GET /health` | No |
| `POST /otp/send`, `/otp/resend`, `/otp/verify` | Yes |
| `POST /notify` | Yes |

See [root README](../README.md) for API details and [docs/](../docs/) for full documentation.

## OpenAPI specification

Machine-readable API contract (OpenAPI 3.1):

```text
backend/openapi/
├── openapi.yaml
└── components/
    ├── schemas.yaml
    ├── errors.yaml
    └── security.yaml
```

Validate from repository root:

```bash
npm run openapi:validate
```

Browse the interactive reference in the documentation portal at `/api-reference` (frontend-only; no Swagger route on the backend).

## From repository root

```bash
npm run backend:dev
npm run backend:start
```
