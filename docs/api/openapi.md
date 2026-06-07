# OpenAPI Specification

| | |
|---|---|
| **Purpose** | Describes the machine-readable OpenAPI 3.1 contract for the ELVA Notify backend API. |
| **Intended Audience** | Integrators, client developers, and maintainers who need a formal API contract. |
| **Last Updated** | 2026-06-05 |
| **Related Documents** | [API Reference Intro](./reference.md) · [Authentication](./authentication.md) · [OTP API](./otp.md) · [Notify API](./notify.md) · [Error Codes](./error-codes.md) |

---

## Overview

The OpenAPI specification is the **source of truth** for the HTTP API contract. It lives in the backend package:

```text
backend/openapi/
├── openapi.yaml
└── components/
    ├── schemas.yaml
    ├── errors.yaml
    └── security.yaml
```

The documentation portal consumes a generated manifest at build/dev time:

```text
backend/openapi/openapi.yaml
        ↓
frontend/scripts/generate-openapi-manifest.mjs
        ↓
frontend/.generated/openapi-manifest.json
        ↓
/api-reference pages + search
```

---

## Covered operations

| Method | Path | Auth |
|--------|------|------|
| `GET` | `/health` | No |
| `POST` | `/otp/send` | Yes (`appId`, `apiKey` in body) |
| `POST` | `/otp/resend` | Yes |
| `POST` | `/otp/verify` | Yes |
| `POST` | `/notify` | Yes |

`GET /` (static HTML landing page) is **not** included in the OpenAPI spec.

---

## Authentication model

Credentials are sent in the **JSON request body**, not headers. The spec documents `appId` and `apiKey` on protected request schemas and uses `x-elva-auth` metadata on operations.

See [Authentication](./authentication.md) for the narrative guide.

---

## Validation

From the repository root:

```bash
npm run openapi:validate
```

This validates the spec and component references. It is development tooling only — no runtime impact.

---

## Interactive reference

Browse the searchable endpoint catalog:

**[/api-reference](/api-reference)**

For narrative flows and examples, continue using [OTP](./otp.md) and [Notify](./notify.md).
