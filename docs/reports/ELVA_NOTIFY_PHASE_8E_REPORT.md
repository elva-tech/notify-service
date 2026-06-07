# ELVA Notify — Phase 8E Report

**Date:** 2026-06-06  
**Scope:** eNandi full template exposure, playground, API validation, live DLT testing, production readiness  
**Source of truth:** `backend/config/businesses/enandi/templates.json`

---

## Executive summary

| Area | Status |
|------|--------|
| Template catalog (5/5) | ✅ Complete |
| Documentation (`docs/businesses/enandi.md`) | ✅ Per-template sections added |
| Playground (5 selectable templates) | ✅ Complete with DLT panel + copy payload |
| Local API validation (no SMS) | ✅ All 5 pass |
| Live Fast2SMS + handset proof | ⚠️ **Not executed** — no test handset configured |
| OTP DLT live verification | ⚠️ **Not executed** — requires `LIVE_DLT_PHONE` |
| Platform portal | ✅ All 5 templates in manifest + searchable routes |

### Final verdict

**READY FOR STAGING ONLY**

**Evidence:** All templates are consistently configured, documented, exposed in playground and platform, and pass local validation including DLT payload generation. The audit gap for **provider delivery and handset receipt** remains open because no `LIVE_DLT_PHONE` was available during this run. Live Fast2SMS calls were dry-run only.

**To reach production:** Run `npm run test:enandi-dlt-live -- --phone=<handset>` with backend + Redis up, confirm all five templates deliver SMS, then re-run OTP send/verify for `CMS` and optionally `eNandi`.

---

## Part 1 — Template catalog audit matrix

**Business DLT defaults:** entityId `1201177860312735154`, senderId `ELVATK`

| templateKey | purpose | templateId | senderId | entityId | variables | docs? | platform? | playground? | API testable? | DLT ready? |
|-------------|---------|------------|----------|----------|-----------|-------|-----------|-------------|---------------|------------|
| LOGIN_OTP | Send OTP for user login | 1207177979441360359 | ELVATK | 1201177860312735154 | otp (6 digits) | ✅ | ✅ | ✅ `/otp/send` | ✅ `/otp/send`; `/notify` → `otp_template_not_supported` | ✅ payload; ⚠️ live SMS pending |
| LOGIN_OTP_WITH_ID | Login OTP with identity | 1207177979905330405 | ELVATK | 1201177860312735154 | otp, loginId | ✅ | ✅ | ✅ `/otp/send` + loginId | ✅ DLT build; no otp-mapping entry | ✅ payload; ⚠️ live SMS pending |
| ORDER_PLACED | Order placed | 1207177979197056177 | ELVATK | 1201177860312735154 | orderId, orderDate | ✅ | ✅ | ✅ `/notify` | ✅ valid/invalid notify | ✅ payload; ⚠️ live SMS pending |
| ORDER_DELIVERED | Order delivered | 1207177979979637116 | ELVATK | 1201177860312735154 | orderId, deliveryDateTime | ✅ | ✅ | ✅ `/notify` | ✅ valid/invalid notify | ✅ payload; ⚠️ live SMS pending |
| OUT_FOR_DELIVERY | Out for delivery | 1207177987065122467 | ELVATK | 1201177860312735154 | orderId, expectedDeliveryTime | ✅ | ✅ | ✅ `/notify` | ✅ valid/invalid notify | ✅ payload; ⚠️ live SMS pending |

**Consistency checks**

| Surface | Result |
|---------|--------|
| Business registry (`templates.json`) | 5 templates — canonical |
| OTP mappings | `eNandi`, `CMS` → `LOGIN_OTP` only; `LOGIN_OTP_WITH_ID` not mapped |
| OpenAPI | Notify + OTP schemas unchanged; template keys referenced in docs |
| Playground | `frontend/lib/enandi-dlt-templates.ts` mirrors registry |
| Platform manifest | Regenerated 2026-06-06 — all 5 under `/platform/businesses/enandi` |

**Note:** Phase brief listed `deliveryDate` for ORDER_DELIVERED; registry uses `deliveryDateTime` (`YYYY-MM-DD HH:mm`). Playground and docs match the registry.

---

## Part 2 — Documentation completeness

**Primary doc:** `docs/businesses/enandi.md`

| templateKey | dedicated section | purpose | templateId | senderId | entityId | variables | validation | example payload | example response | DLT mapping |
|-------------|-------------------|---------|------------|----------|----------|-----------|------------|-----------------|------------------|-------------|
| LOGIN_OTP | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ `/otp/send` | ✅ | ✅ OTP mappings |
| LOGIN_OTP_WITH_ID | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ notes no mapping |
| ORDER_PLACED | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ integration examples | ✅ pipe |
| ORDER_DELIVERED | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ pipe |
| OUT_FOR_DELIVERY | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ pipe |

**Remaining doc drift (non-blocking):**

- `docs/api/otp.md` — one troubleshooting row still mentions route `q` only
- `docs/architecture/dlt-layer.md` — updated in this phase for OTP DLT opt-in
- Platform manifest `examplePayload` for OTP templates still shows legacy `/notify` shape (portal display only)

---

## Part 3 — Playground verification

**Section:** `eNandi DLT Templates` in `frontend/lib/playground-config.ts`

| templateKey | endpoint | variables rendered | templateId | senderId | entityId | pipe preview | copy payload |
|-------------|----------|------------------|------------|----------|----------|--------------|--------------|
| LOGIN_OTP | POST /otp/send | otp (info only) | ✅ | ✅ | ✅ | ✅ | ✅ |
| LOGIN_OTP_WITH_ID | POST /otp/send | otp, loginId | ✅ | ✅ | ✅ | ✅ | ✅ |
| ORDER_PLACED | POST /notify | orderId, orderDate | ✅ | ✅ | ✅ | ✅ | ✅ |
| ORDER_DELIVERED | POST /notify | orderId, deliveryDateTime | ✅ | ✅ | ✅ | ✅ | ✅ |
| OUT_FOR_DELIVERY | POST /notify | orderId, expectedDeliveryTime | ✅ | ✅ | ✅ | ✅ | ✅ |

**Component:** `frontend/components/playground/dlt-template-info.tsx` — metadata panel + variable table + copy payload/pipe.

**TypeScript:** `npx tsc --noEmit` passes (verified earlier in phase).

---

## Part 4 — Local API validation matrix (no SMS)

**Script:** `npm run validate:enandi-dlt` → `backend/scripts/validate-enandi-notify-local.mjs`  
**Run:** 2026-06-06 — **ALL PASS**

| templateKey | DLT payload | valid request | invalid request | notes |
|-------------|-------------|---------------|-----------------|-------|
| LOGIN_OTP | ✅ `482910` | `/notify` → `otp_template_not_supported` | same (blocked before var check) | OTP via `/otp/send` only |
| LOGIN_OTP_WITH_ID | ✅ `482910\|user_01` | `/notify` → `otp_template_not_supported` | same | |
| ORDER_PLACED | ✅ `ORD-2026-001\|2026-06-06` | ✅ ok | ✅ `missing_variable` (orderDate) | |
| ORDER_DELIVERED | ✅ `ORD-2026-001\|2026-06-06 14:30` | ✅ ok | ✅ `missing_variable` (deliveryDateTime) | |
| OUT_FOR_DELIVERY | ✅ `ORD-2026-001\|14:30` | ✅ ok | ✅ `validation_error` (bad time) | |

**Health check:** `GET /health` → `otpDlt.globalDltEnabled: true`, `mappingCount: 2`.

**Config fix applied:** `OTP_DLT_ENABLED=true` in root `.env`; `backend/src/config/env.js` loads root `.env` then `backend/.env`.

---

## Part 5 — Live Fast2SMS DLT testing

**Script:** `npm run test:enandi-dlt-live -- --phone=<handset>`  
**Prerequisites met:** backend running, Fast2SMS key present, `OTP_DLT_ENABLED=true`  
**Blocker:** No `LIVE_DLT_PHONE` or `--phone=` provided

**Dry-run results** (payload + Fast2SMS request shape only):

| Order | templateKey | senderId | entityId | templateId | variables_values | Fast2SMS | Handset |
|-------|-------------|----------|----------|------------|------------------|----------|---------|
| 1 | ORDER_PLACED | ELVATK | 1201177860312735154 | 1207177979197056177 | ORD-8E-001\|2026-06-06 | skipped | ❌ |
| 2 | ORDER_DELIVERED | ELVATK | 1201177860312735154 | 1207177979979637116 | ORD-8E-001\|2026-06-06 14:30 | skipped | ❌ |
| 3 | OUT_FOR_DELIVERY | ELVATK | 1201177860312735154 | 1207177987065122467 | ORD-8E-001\|14:30 | skipped | ❌ |
| 4 | LOGIN_OTP | — | — | — | — | OTP HTTP 400 (empty phone) | ❌ |
| 5 | LOGIN_OTP_WITH_ID | ELVATK | 1201177860312735154 | 1207177979905330405 | 482910\|user_8e | skipped (direct DLT) | ❌ |

**Artifacts:** [`ELVA_NOTIFY_PHASE_8E_LIVE_RESULTS.json`](./ELVA_NOTIFY_PHASE_8E_LIVE_RESULTS.json) (written on script run)

---

## Part 6 — OTP DLT verification

| test | status | evidence |
|------|--------|----------|
| POST /otp/send CMS → LOGIN_OTP | ⚠️ not run | requires handset |
| POST /otp/send + loginId | ⚠️ not run | `loginId` wired in `otp.controller.js`; no otp-mapping for WITH_ID |
| otp_dlt_dispatch logs | ⚠️ not captured | |
| otp_delivery_completed | ⚠️ not captured | |
| POST /otp/verify | ⚠️ not run | |
| cooldown / rate limit / Redis | ✅ unchanged code paths | no regression testing without live send |

**Recommendation:** Test with hybrid app `CMS` first (`legacyRouteEnabled: true` fallback). Avoid `eNandi` app until DLT delivery confirmed (`legacyRouteEnabled: false`).

---

## Part 7 — Platform portal verification

**Routes verified (manifest-driven):**

| route | content |
|-------|---------|
| `/platform/businesses/enandi` | 5 templates listed |
| `/platform/businesses/enandi/{templateKey}` | per-template DLT metadata |
| `/platform/otp` | eNandi + CMS mappings, retirement/hybrid badges |

**Search tests** (haystack in `business-manifest.json`):

| query | expected hit | result |
|-------|--------------|--------|
| LOGIN_OTP | template + OTP mapping | ✅ |
| LOGIN_OTP_WITH_ID | template | ✅ |
| ORDER_PLACED | template | ✅ |
| ORDER_DELIVERED | template | ✅ |
| OUT_FOR_DELIVERY | template | ✅ |

Manifest regenerated: `frontend/.generated/business-manifest.json` (2026-06-06).

---

## Part 8 — Production readiness review

### Section A — Template delivery results

| templateKey | local DLT build | Fast2SMS HTTP | handset SMS |
|-------------|-----------------|---------------|-------------|
| ORDER_PLACED | ✅ | ⚠️ not sent | ❌ |
| ORDER_DELIVERED | ✅ | ⚠️ not sent | ❌ |
| OUT_FOR_DELIVERY | ✅ | ⚠️ not sent | ❌ |
| LOGIN_OTP | ✅ | ⚠️ not sent | ❌ |
| LOGIN_OTP_WITH_ID | ✅ | ⚠️ not sent | ❌ |

### Section B — OTP delivery results

| flow | status |
|------|--------|
| OTP generate + Redis store | ✅ code path unchanged |
| OTP DLT dispatch | ⚠️ not proven live |
| OTP verify | ⚠️ not proven live |

### Section C — DLT metadata verification

All five templates: senderId `ELVATK`, entityId `1201177860312735154`, template IDs match registry across backend, playground, platform manifest, and docs.

### Section D — Platform verification

All templates visible; OTP page shows DLT-only (`eNandi`) and hybrid (`CMS`) accurately; search returns all keys.

### Section E — Outstanding issues

1. **No live handset proof** — primary audit gap from Phase 8E objective
2. **LOGIN_OTP_WITH_ID** — not in `otp-mappings.json`; only direct DLT / future mapping
3. **Platform manifest examplePayload** — legacy `/notify` shape for OTP templates (cosmetic)
4. **`docs/api/otp.md`** — minor stale troubleshooting row
5. **`retirementConfigReady: false`** in health snapshot — config flag, not template-specific

### Section F — Production readiness score

| dimension | weight | score |
|-----------|--------|-------|
| Config & registry | 20% | 100% |
| Docs & playground | 20% | 95% |
| Local API validation | 20% | 100% |
| Live provider + handset | 30% | 0% |
| Platform & observability | 10% | 95% |
| **Weighted total** | | **58%** |

### Final verdict

**READY FOR STAGING ONLY**

Proceed to controlled staging with a real handset using:

```bash
# Terminal 1 — backend + Redis
npm run dev:backend

# Terminal 2 — live DLT (sequential, stops on failure)
npm run test:enandi-dlt-live -- --phone=91XXXXXXXXXX
```

After all five templates deliver and OTP verify succeeds, re-score Part 5–6 and upgrade verdict to **READY FOR PRODUCTION**.

---

## Changes delivered in Phase 8E

| file | change |
|------|--------|
| `frontend/lib/enandi-dlt-templates.ts` | Template catalog for playground |
| `frontend/lib/playground-config.ts` | 5-template DLT section |
| `frontend/components/playground/dlt-template-info.tsx` | Metadata + copy payload |
| `docs/businesses/enandi.md` | Per-template sections, corrected flows |
| `docs/architecture/dlt-layer.md` | OTP DLT opt-in notes |
| `backend/scripts/validate-enandi-notify-local.mjs` | Local validation (Part 4) |
| `backend/scripts/live-enandi-dlt-test.mjs` | Live test harness (Part 5/6) |
| `backend/src/config/env.js` | Load root `.env` |
| `backend/src/controllers/otp.controller.js` | Optional `loginId` for WITH_ID |
| `.env` | `OTP_DLT_ENABLED=true` |
| `package.json` | `validate:enandi-dlt`, `test:enandi-dlt-live` |
