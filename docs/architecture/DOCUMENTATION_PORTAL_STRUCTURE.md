## Goal

Design the future documentation portal structure under `docs/` to make ELVA Notify v2 implementation-independent and easy for internal teams to use.

The documentation portal is markdown-only (no frontend code) and should serve as the canonical reference for:

- Template contracts and variable schemas
- API semantics (request/response and error behavior)
- Errors and troubleshooting guidance
- Onboarding and operations

## `/docs` Structure

Proposed directory structure:

```
/docs
  /introduction
  /getting-started
  /api-reference
  /businesses
  /templates
  /errors
  /faq
  /changelog
```

Leaf pages:

```
/docs/introduction
/docs/getting-started
/docs/api-reference
/docs/businesses/enandi
/docs/templates
/docs/errors
/docs/faq
/docs/changelog
```

## Purpose of Every Page

### `/docs/introduction`
Purpose: High-level product overview for ELVA Notify v2.

Includes:
- Vision, goals, non-goals
- Supported channels (SMS via Fast2SMS, EMAIL via SendGrid)
- DLT compliance principle: template-first for DLT-governed SMS

### `/docs/getting-started`
Purpose: First steps for ELVA teams integrating with Notify.

Includes:
- Authentication model (`appId` + `apiKey`)
- Environment readiness checklist (Redis, provider credentials)
- How to choose SMS templates via `templateKey` + `variables` (Phase 1)

### `/docs/api-reference`
Purpose: Canonical API behavior documentation.

Includes:
- Request/response schemas
- Error codes and conditions
- Backward compatibility notes (Phase 1 migration scope)

### `/docs/businesses/enandi`
Purpose: eNandi business contract details.

Includes:
- Approved templateKeys for eNandi
- Variables and validation rules per template
- Example payloads and example SMS (must reflect approved DLT wording)

### `/docs/templates`
Purpose: Template catalog and schema governance.

Includes:
- Template schema definitions (variable name/type/position/required)
- How templateKey maps to DLT metadata (DLT template ID, sender ID, entity ID)
- Governance workflow (how templates are added/updated safely)

### `/docs/errors`
Purpose: Central error taxonomy.

Includes:
- Template validation errors (unknown templateKey, missing variables, invalid variables)
- Provider/DLT delivery errors
- OTP errors (verification mismatch, expired, max attempts)
- A consistent mapping between client-visible errors and operator logs

### `/docs/faq`
Purpose: Operational and integration FAQs.

Includes:
- “How do I onboard a new business?”
- “Where do I get DLT Template IDs?”
- “What happens if variables don’t match the schema?”
- “How does Phase 1 migration handle legacy free-text SMS?”

### `/docs/changelog`
Purpose: Track changes to the documentation and contracts across releases.

Includes:
- Versioned contract changes for templates and error codes
- Deprecations and migration guidance

## Navigation Hierarchy

Suggested navigation (top-level):

1. Introduction
2. Getting Started
3. API Reference
4. Businesses
5. Templates
6. Errors
7. FAQ
8. Changelog

Within “Businesses”, sub-navigation is business-scoped:

- eNandi (Phase 1)

“Templates” should be accessible both globally and business-scoped via cross-links:

- eNandi business contract references relevant template schemas.

*** End of File

