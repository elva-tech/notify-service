# API Reference

| | |
|---|---|
| **Purpose** | Introduction to the interactive API Reference in the documentation portal. |
| **Intended Audience** | Developers who want endpoint-level request/response contracts with search and deep links. |
| **Last Updated** | 2026-06-05 |
| **Related Documents** | [OpenAPI Specification](./openapi.md) · [Authentication](./authentication.md) · [OTP API](./otp.md) · [Notify API](./notify.md) · [Error Codes](./error-codes.md) |

---

## What is the API Reference?

The **API Reference** is a frontend-only explorer built from the OpenAPI 3.1 spec. It provides:

- Endpoint list grouped by tag (Health, OTP, Notify)
- Request and response JSON examples
- Documented error responses per operation
- Deep links (e.g. `/api-reference/post-otp-send`)
- Unified search with markdown documentation

Open the catalog at **[/api-reference](/api-reference)**.

---

## API Reference vs narrative docs

| Resource | Best for |
|----------|----------|
| **API Reference** (`/api-reference`) | Contract lookup, examples, error codes per endpoint |
| **OTP / Notify markdown** | Flow diagrams, middleware chains, integration guidance |
| **Error Codes** | Full error catalog and troubleshooting |
| **eNandi Business** | DLT template keys and variables |

The API Reference does not replace narrative docs — it complements them with a machine-derived contract view.

---

## Non-API endpoint

`GET /` on the backend serves the **Platform Landing Page** (static HTML). It is documented in the API Reference landing page but is **not** part of the OpenAPI contract.

---

## Search

Press `⌘K` / `Ctrl+K` and search by path, method, or keyword:

- `otp`, `notify`, `verify`, `health`
- `rate_limited`, `ORDER_PLACED`
- Operation names and schema names

Results include both documentation pages and API endpoints.
