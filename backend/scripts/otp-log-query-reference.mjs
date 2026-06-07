/**
 * Prints SLI log-query templates for operator log platforms.
 * Run from backend/: node scripts/otp-log-query-reference.mjs
 */

const queries = [
  {
    sli: 'OTP SMS success rate',
    target: '>= 99.5%',
    events: 'otp_delivery_completed',
    query: 'event:otp_delivery_completed | stats count by status',
    numerator: 'status=completed',
    denominator: 'status in (completed, failed)',
  },
  {
    sli: 'DLT delivery rate',
    target: 'Trend toward 100%',
    events: 'otp_delivery_completed',
    query: 'event:otp_delivery_completed | stats count by deliveryMode',
    note: 'deliveryMode=dlt vs legacy_q vs email',
  },
  {
    sli: 'Fallback usage',
    target: '0 before Phase 8D',
    events: 'otp_dlt_fallback',
    query: 'event:otp_dlt_fallback | count',
  },
  {
    sli: 'DLT provider acceptance',
    target: '>= 99%',
    events: 'provider_response',
    query: 'category:DLT event:provider_response route:dlt | stats count by return',
  },
  {
    sli: 'OTP verify success rate',
    target: 'Stable vs baseline',
    events: 'otp_verify_outcome',
    query: 'event:otp_verify_outcome | stats count by outcome, reason',
  },
  {
    sli: 'Provider latency p95',
    target: '< 3000ms',
    events: 'provider_response',
    query: 'event:provider_response | percentile(durationMs, 95) by route',
  },
  {
    sli: 'Config health at startup',
    target: 'status=healthy',
    events: 'otp_config_health',
    query: 'event:otp_config_health | latest configHealthStatus',
  },
];

console.log('# OTP DLT Log Query Reference (Phase 8C)\n');
for (const item of queries) {
  console.log(`## ${item.sli}`);
  console.log(`Target: ${item.target}`);
  console.log(`Events: ${item.events}`);
  console.log(`Query: ${item.query}`);
  if (item.numerator) console.log(`Numerator: ${item.numerator}`);
  if (item.denominator) console.log(`Denominator: ${item.denominator}`);
  if (item.note) console.log(`Note: ${item.note}`);
  console.log('');
}
