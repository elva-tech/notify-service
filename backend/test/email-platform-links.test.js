/**
 * Ensures all transactional email hrefs use buildPlatformUrl (prod portal vs local dev).
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const {
  DEFAULT_PRODUCTION_PLATFORM_URL,
  DEFAULT_LOCAL_PLATFORM_URL,
} = require('../src/config/publicPlatformUrl');

const {
  buildPlatformUrl,
  getPlatformBaseUrl,
  PLATFORM_EMAIL_PATHS,
} = require('../src/services/email/platformEmailHtml');

const {
  buildRequesterApprovedEmailHtml,
} = require('../src/services/brandRequestNotification.service');

describe('buildPlatformUrl (explicit base)', () => {
  it('builds production authentication docs link', () => {
    assert.equal(
      buildPlatformUrl(PLATFORM_EMAIL_PATHS.docsAuthentication, DEFAULT_PRODUCTION_PLATFORM_URL),
      `${DEFAULT_PRODUCTION_PLATFORM_URL}/docs/api/authentication`,
    );
  });

  it('builds local onboard status link', () => {
    const id = 'req_test_1';
    assert.equal(
      buildPlatformUrl(PLATFORM_EMAIL_PATHS.onboardStatus(id), DEFAULT_LOCAL_PLATFORM_URL),
      `${DEFAULT_LOCAL_PLATFORM_URL}/onboard/status/req_test_1`,
    );
  });
});

describe('transactional emails use configured platform base', () => {
  it('approval email hrefs match getPlatformBaseUrl()', () => {
    const base = getPlatformBaseUrl();
    const request = {
      id: 'req_link_audit',
      brandId: 'demo',
      brandName: 'Demo',
      submittedBy: { name: 'Alex', email: 'alex@example.com' },
      templates: { otp: [], notify: [], email: ['NOTIFY_USER'] },
    };
    const html = buildRequesterApprovedEmailHtml(request, {
      appId: 'demo-app',
      apiKey: 'secret',
    });

    assert.ok(html.includes(`${base}${PLATFORM_EMAIL_PATHS.docsAuthentication}`));
    assert.ok(html.includes(`${base}${PLATFORM_EMAIL_PATHS.onboardStatus(request.id)}`));
    if (base.includes('localhost')) {
      assert.match(html, /href="http:\/\/localhost:3000\//);
    } else {
      assert.doesNotMatch(html, /href="http:\/\/localhost:3000\//);
    }
  });

  it('buildPlatformUrl uses live config when base override omitted', () => {
    const base = getPlatformBaseUrl();
    assert.equal(
      buildPlatformUrl('/platform/approvals'),
      `${base}/platform/approvals`,
    );
  });
});

describe('PLATFORM_EMAIL_PATHS registry', () => {
  it('includes every onboarding email destination', () => {
    assert.equal(typeof PLATFORM_EMAIL_PATHS.onboardStatus, 'function');
    assert.match(PLATFORM_EMAIL_PATHS.docsAuthentication, /^\/docs\//);
    assert.match(PLATFORM_EMAIL_PATHS.platformApprovals, /^\/platform\//);
  });
});
