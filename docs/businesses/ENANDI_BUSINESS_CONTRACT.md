# Business Overview

Business Name:
eNandi

This contract defines the SMS templates that are approved for DLT-governed delivery on the ELVA Notify v2 platform for the eNandi business module (Phase 1 only).

## Approved Templates

The following templateKeys are supported by the `eNandi` business module.

### 1. TemplateKey: `LOGIN_OTP`

* Template Purpose: Send OTP for user login.
* DLT Template ID: `TBD` (from DLT portal approval record for eNandi)
* Required Variables:
  - `otp`
* Variable Types:
  - `otp`: `numeric` (6 digits)
* Validation Rules:
  - `otp` must be present.
  - `otp` length must be exactly `6`.
  - `otp` must contain only digits.
  - No additional variables are permitted for this template.
* Example Payload:
```json
{
  "templateKey": "LOGIN_OTP",
  "variables": {
    "otp": "123456"
  }
}
```
* Example SMS:
  - DLT-approved text with variable placeholders: `Your login OTP is {otp}. It expires in 5 minutes.`

### 2. TemplateKey: `LOGIN_OTP_WITH_ID`

* Template Purpose: Send OTP for user login, including an additional identity/context field used by the business.
* DLT Template ID: `TBD` (from DLT portal approval record for eNandi)
* Required Variables:
  - `otp`
  - `loginId`
* Variable Types:
  - `otp`: `numeric` (6 digits)
  - `loginId`: `string` (alphanumeric), max length `30`
* Validation Rules:
  - `otp` must be present and be exactly 6 digits.
  - `loginId` must be present and match `[A-Za-z0-9_-]{1,30}`.
  - No additional variables are permitted for this template.
* Example Payload:
```json
{
  "templateKey": "LOGIN_OTP_WITH_ID",
  "variables": {
    "otp": "482910",
    "loginId": "EN-998877"
  }
}
```
* Example SMS:
  - DLT-approved text with variable placeholders: `Your login OTP is {otp} for {loginId}. It expires in 5 minutes.`

### 3. TemplateKey: `ORDER_PLACED`

* Template Purpose: Notify user that an order has been placed.
* DLT Template ID: `TBD` (from DLT portal approval record for eNandi)
* Required Variables:
  - `orderId`
  - `orderDate`
* Variable Types:
  - `orderId`: `string` (alphanumeric + `-`/`_`), max length `40`
  - `orderDate`: `date` (format: `YYYY-MM-DD`)
* Validation Rules:
  - `orderId` must be present, non-empty, and match `[A-Za-z0-9_-]{1,40}`.
  - `orderDate` must be present and match `YYYY-MM-DD`.
  - No additional variables are permitted for this template.
* Example Payload:
```json
{
  "templateKey": "ORDER_PLACED",
  "variables": {
    "orderId": "ORD-100234",
    "orderDate": "2026-06-05"
  }
}
```
* Example SMS:
  - DLT-approved text with variable placeholders: `Your order {orderId} has been placed on {orderDate}.`

### 4. TemplateKey: `ORDER_DELIVERED`

* Template Purpose: Notify user that an order has been delivered.
* DLT Template ID: `TBD` (from DLT portal approval record for eNandi)
* Required Variables:
  - `orderId`
  - `deliveryDateTime`
* Variable Types:
  - `orderId`: `string` (alphanumeric + `-`/`_`), max length `40`
  - `deliveryDateTime`: `datetime` (format: `YYYY-MM-DD HH:mm`)
* Validation Rules:
  - `orderId` must be present and match `[A-Za-z0-9_-]{1,40}`.
  - `deliveryDateTime` must be present and match `YYYY-MM-DD HH:mm`.
  - No additional variables are permitted for this template.
* Example Payload:
```json
{
  "templateKey": "ORDER_DELIVERED",
  "variables": {
    "orderId": "ORD-100234",
    "deliveryDateTime": "2026-06-05 14:30"
  }
}
```
* Example SMS:
  - DLT-approved text with variable placeholders: `Your order {orderId} has been delivered on {deliveryDateTime}.`

### 5. TemplateKey: `OUT_FOR_DELIVERY`

* Template Purpose: Notify user that an order is out for delivery.
* DLT Template ID: `TBD` (from DLT portal approval record for eNandi)
* Required Variables:
  - `orderId`
  - `expectedDeliveryTime`
* Variable Types:
  - `orderId`: `string` (alphanumeric + `-`/`_`), max length `40`
  - `expectedDeliveryTime`: `time` (format: `HH:mm`)
* Validation Rules:
  - `orderId` must be present and match `[A-Za-z0-9_-]{1,40}`.
  - `expectedDeliveryTime` must be present and match `HH:mm`.
  - No additional variables are permitted for this template.
* Example Payload:
```json
{
  "templateKey": "OUT_FOR_DELIVERY",
  "variables": {
    "orderId": "ORD-100234",
    "expectedDeliveryTime": "16:15"
  }
}
```
* Example SMS:
  - DLT-approved text with variable placeholders: `Your order {orderId} is out for delivery. Expected by {expectedDeliveryTime}.`

# Business Validation Rules

These rules define how the platform should behave when the business module is unable to produce a valid DLT SMS payload.

## Unknown template behavior

If `templateKey` is not present in the `eNandi` module catalog:

- Platform behavior:
  - Reject the request as a template validation failure.
- Client outcome (spec-level):
  - Return an error with an `invalid_template`-type classification.
- Logging outcome:
  - Log category: `DLT` + `BUSINESS`.
  - Include `business = eNandi`, `template = <templateKey>`, and validation status.

## Missing variable behavior

If a required variable for a supported templateKey is missing:

- Platform behavior:
  - Reject the request as a template validation failure.
- Client outcome (spec-level):
  - Return an error with a `missing_variable`-type classification.
- Logging outcome:
  - Log category: `DLT` + `BUSINESS`.
  - Include `template` and the list of missing variable names (redacted if needed).

## Invalid variable behavior

If a variable is present but:
- has the wrong type,
- fails length/format constraints,
- or cannot be mapped deterministically to DLT slot positions:

- Platform behavior:
  - Reject the request as a template validation failure.
- Client outcome (spec-level):
  - Return an error with a `validation_error`-type classification (or a more specific `dlt_schema_mismatch` classification if used internally).
- Logging outcome:
  - Log category: `DLT` + `ERROR`.
  - Include the variable name(s) and the failing constraint category.

## Unsupported business behavior

If the request’s business identifier does not match any registered business module:

- Platform behavior:
  - Reject the request at business resolution stage.
- Client outcome (spec-level):
  - Return an error with an `unsupported_business`-type classification.
- Logging outcome:
  - Log category: `BUSINESS` + `ERROR`.

# Future Compatibility Rules

To add future businesses without modifying eNandi:

1. **No core changes per business**
   - Core Engine treats business modules as independent catalog providers.
   - Template validation rules are driven by the business module’s exported schema.

2. **Template keys are business-scoped**
   - `templateKey` values are interpreted within the resolved business module.
   - A templateKey collision across businesses must not alter existing eNandi behavior.

3. **DLT metadata remains server-side**
   - Future businesses must provide their approved DLT template IDs and variable schemas via the business module definition process.
   - Clients cannot supply raw DLT template IDs.

4. **eNandi module remains static unless explicitly updated**
   - Unknown template or variable behavior for eNandi must remain deterministic.
   - Adding new businesses requires only:
     - registering the new business in the Business Registry
     - creating its module contract and DLT schema binding
     - validating it in non-production before enabling

