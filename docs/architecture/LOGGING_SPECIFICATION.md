# Logging Goals

Provide structured, compliance-friendly observability for OTP and DLT-governed SMS. Logs must enable:

- Correlating all steps in a single request using `requestId`.
- Understanding template resolution and validation decisions (what templateKey, what variable schema).
- Detecting and debugging DLT/provider failures without exposing sensitive data (e.g., plaintext OTP).
- Supporting multi-business operations and audits.

# Log Categories

The system emits logs in the following high-level categories:

1. `SYSTEM`
   - Request lifecycle start/end, environment/config validation outcomes, dependency readiness.
2. `BUSINESS`
   - Business module selection, templateKey existence checks in the business module catalog.
3. `OTP`
   - OTP generation/verify lifecycle milestones (no plaintext OTP content).
4. `NOTIFICATION`
   - Notification send attempts and channel routing decisions (SMS/EMAIL).
5. `DLT`
   - Template registry resolution, variable schema validation outcomes, DLT payload construction readiness.
6. `ERROR`
   - Provider errors, validation failures, and unexpected system exceptions (sanitized).

# Required Fields

Every log entry emitted by ELVA Notify v2 must include:

- `requestId`
- `business`
- `template`
- `recipient`
- `status`
- `timestamp`

Field semantics:

- `requestId`: Correlation identifier generated/propagated for the request.
- `business`: Business identifier (Phase 1: `eNandi`; others later).
- `templateKey`: Template key used for the SMS (spec alias: `template`; emitted as `templateKey` in JSON logs).
- `recipient`: For SMS, the normalized destination phone identifier; for EMAIL, the normalized email address (never unnormalized/raw inputs).
- `status`: One of the platform outcome states (examples: `started`, `validated`, `rejected`, `sent`, `provider_failed`, `completed`).
- `timestamp`: ISO-8601 timestamp in UTC.

# Log Lifecycle

For a typical SMS notification request, logs should progress through these conceptual stages:

1. `SYSTEM` stage: Request accepted and `requestId` assigned.
2. `BUSINESS` stage: Business module resolved.
3. `DLT` stage:
   - Template existence checked.
   - Variables validated (presence, types/constraints, position/slot readiness).
4. `NOTIFICATION` stage: Provider routing decision taken (SMS via Fast2SMS DLT route).
5. `DLT` stage: DLT payload readiness recorded (without including sensitive values).
6. `SYSTEM` stage: Provider call made and provider response captured.
7. `SYSTEM` stage: Request completion outcome logged.

On error, the lifecycle diverges:

- Validation errors:
  - `DLT` logs the rejection reason(s).
  - `ERROR` logs sanitized context and classification.
  - Provider layer is not invoked.
- Provider errors:
  - `DLT` logs payload readiness and provider request metadata.
  - `ERROR` logs provider error classification and response status.

# Phase 8C OTP DLT Events (additive)

| Event | Category | Purpose |
|-------|----------|---------|
| `otp_config_health` | SYSTEM | Startup config health snapshot summary |
| `otp_delivery_completed` | OTP | Terminal OTP dispatch event (`deliveryMode`, `durationMs`, `providerRoute`) |
| `otp_verify_outcome` | OTP | All verify outcomes (`outcome`, `reason`; never OTP value) |

See [OTP DLT Observability](./otp-dlt-observability.md) and [Log Triage Runbook](../runbooks/otp-dlt-log-triage.md).

# Log Retention

Phase 1 retention targets (policy-level; operator-configured):

- Hot retention (queryable quickly): 7–14 days
- Warm retention (compliance audits): 30 days
- Long retention (optional/legal, if required): up to 90 days

Retention duration may vary by environment (dev/staging/prod) but must preserve:

- TemplateKey and validation outcomes (for DLT compliance evidence).
- Provider acceptance/rejection outcomes (for delivery troubleshooting).
- Business resolution decisions (to prove correct template governance).

# Future Multi-Business Strategy

To support future businesses without breaking existing audit flows:

- The required fields remain unchanged; only the `business` value changes.
- Template keys are namespaced by business module definition rules (collision handling is business-scoped).
- Logging categories remain stable:
  - Validation failures always appear under `DLT` (plus `BUSINESS` when relevant).
  - Provider failures always appear under `DLT` + `ERROR`.

