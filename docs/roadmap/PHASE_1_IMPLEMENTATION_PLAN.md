# Phase 1 Implementation Plan (ELVA Notify v2)

Scope: Phase 1 introduces DLT template governance and template validation for SMS delivery, with business logic isolated behind a business module interface. This plan contains **execution steps only**; it does not include runtime implementation details.

## Task 1: Architecture Freeze

Objective:
- Freeze the Phase 1 architecture specification so implementation and business contract work stays aligned with DLT compliance requirements.

Dependencies:
- Approval of the v2 architecture blueprint (`ELVA_NOTIFY_V2_ARCHITECTURE.md`)
- Confirmation that Redis/OTP storage remains unchanged in Phase 1.

Risks:
- Misalignment between business contract expectations and template validation rules.
- DLT variable ordering assumptions may conflict with Fast2SMS `variables_values` positional mapping.

Deliverables:
- Signed-off architecture doc for Phase 1.
- A stable set of concepts:
  - Core Engine
  - Business Registry
  - Business Modules
  - Template Validation Layer
  - Logging Layer
  - Provider Layer

Estimated effort:
- 6–10 hours

## Task 2: Business Registry

Objective:
- Create the configuration contract that resolves `businessId` and exposes the business template catalog to the Core Engine.

Dependencies:
- eNandi business contract content defined in `ENANDI_BUSINESS_CONTRACT.md`.
- Decision on business identifier source in Phase 1 (businessId mapping relative to existing `appId`, as per agreed contract).

Risks:
- Business resolution failures could block OTP/notify flows.
- TemplateKey collision/namespace issues across future businesses.

Deliverables:
- Business Registry spec:
  - supported businesses list (Phase 1: eNandi only)
  - templateKey catalog exposure contract
  - schema lookup interface contract for validation layer
- Configuration governance notes (what changes require redeploy, what can be reloaded safely).

Estimated effort:
- 10–16 hours

## Task 3: eNandi Business Module

Objective:
- Implement the eNandi module definition as a pure template catalog provider for the template validation layer.

Dependencies:
- DLT portal approval records for each eNandi template:
  - `DLT Template ID`
  - sender ID
  - entity/PEID
  - approved variable slots and ordering
- Template variable schema decisions (variable names, types, formatting rules).

Risks:
- Incorrect DLT template ID or variable order can produce provider rejection or non-compliant SMS.
- Incomplete validation rules might allow unsupported variable sets.

Deliverables:
- eNandi module contract:
  - templateKey list
  - variables schema per templateKey
  - DLT metadata binding per templateKey
  - event-to-template mapping rules for OTP vs notify flows (as applicable in Phase 1)

Estimated effort:
- 12–18 hours

## Task 4: DLT Validation Layer

Objective:
- Add the centralized validation layer that enforces:
  - template existence in the resolved business module
  - required variable presence
  - variable type/format/length constraints
  - deterministic positional mapping to Fast2SMS `variables_values`

Dependencies:
- Business Registry interface contract (Task 2).
- eNandi variable schema definitions (Task 3).
- Logging categories/required fields alignment (see `LOGGING_SPECIFICATION.md`).

Risks:
- Schema mismatches may cause frequent provider failures or rejection by Fast2SMS.
- Legacy free-text SMS behavior could accidentally bypass validation.

Deliverables:
- Validation failure taxonomy and client-facing error mapping for Phase 1.
- Deterministic rules for:
  - extra variable behavior (reject vs ignore; Phase 1 should be explicit)
  - type mismatch behavior
  - ordering rules based on variable position

Estimated effort:
- 14–20 hours

## Task 5: Fast2SMS DLT Integration

Objective:
- Ensure SMS delivery uses Fast2SMS DLT route and resolved DLT metadata for template-based SMS.

Dependencies:
- Template validation readiness (Task 4).
- Fast2SMS DLT credential availability for ELVA’s principal entity model:
  - sender ID
  - entity/PEID model reference
  - Fast2SMS integration config readiness

Risks:
- Provider payload mismatch (wrong sender ID, wrong entity, wrong variables_values order).
- Route misconfiguration can still send non-DLT SMS.

Deliverables:
- Provider-layer contract for DLT payload:
  - route selection (DLT route only for template-based SMS in Phase 1)
  - payload fields required for Fast2SMS DLT acceptance
- Provider error mapping to consistent platform outcome states and corresponding logs.

Estimated effort:
- 10–14 hours

## Task 6: Business Logging

Objective:
- Implement structured logging aligned with the v2 logging specification.

Dependencies:
- Logging fields and categories from `LOGGING_SPECIFICATION.md`.
- Template validation lifecycle stage definitions.

Risks:
- Missing required fields reduces audit usefulness.
- Logging sensitive content (plaintext OTP or full variable contents) creates compliance risk.

Deliverables:
- Log schema enforcement checklist:
  - required fields always present
  - category mapping rules for validation vs provider vs system errors
- Sanitization rules for sensitive values.

Estimated effort:
- 8–12 hours

## Task 7: Documentation Portal

Objective:
- Publish the Phase 1 documentation portal structure and keep it consistent with the contracts.

Dependencies:
- All Phase 1 contract documents updated and finalized:
  - architecture
  - eNandi business contract
  - logging spec
  - documentation portal structure

Risks:
- Documentation drift: templates/variables rules in docs might not match validation implementation.

Deliverables:
- `/docs` markdown portal blueprint:
  - Introduction
  - Getting started
  - API reference
  - Businesses (eNandi)
  - Templates
  - Errors
  - FAQ
  - Changelog

Estimated effort:
- 6–10 hours

## Task 8: Testing

Objective:
- Validate correctness of DLT template governance without breaking OTP fundamentals.

Dependencies:
- DLT templates and variable schemas for eNandi are complete in the business module definition.
- Provider sandbox access (Fast2SMS DLT test environment) if available.

Risks:
- Integration tests might not fully detect variables_values ordering issues until provider acceptance.
- Regression risk in OTP verify behavior if orchestration is changed.

Deliverables:
- Test plan aligned to Phase 1 risk areas:
  - unknown templateKey → correct error and logs
  - missing variables → correct error and logs
  - invalid variable formats → correct error and logs
  - valid payload → provider call attempt with correct DLT payload contract
  - provider failures → correct platform error outcome and logs
- Traceability mapping between validation failures and log lifecycle stages.

Estimated effort:
- 16–24 hours

