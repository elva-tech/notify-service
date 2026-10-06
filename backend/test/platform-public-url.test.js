const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const {
  resolvePublicPlatformUrl,
  DEFAULT_LOCAL_PLATFORM_URL,
  DEFAULT_PRODUCTION_PLATFORM_URL,
} = require('../src/config/publicPlatformUrl');

describe('resolvePublicPlatformUrl', () => {
  it('uses localhost in development when unset', () => {
    assert.equal(
      resolvePublicPlatformUrl({ platformPublicUrl: '', nodeEnv: 'development' }),
      DEFAULT_LOCAL_PLATFORM_URL,
    );
  });

  it('uses production portal when unset and NODE_ENV is production', () => {
    assert.equal(
      resolvePublicPlatformUrl({ platformPublicUrl: undefined, nodeEnv: 'production' }),
      DEFAULT_PRODUCTION_PLATFORM_URL,
    );
  });

  it('ignores localhost PLATFORM_PUBLIC_URL in production', () => {
    assert.equal(
      resolvePublicPlatformUrl({
        platformPublicUrl: 'http://localhost:3000',
        nodeEnv: 'production',
      }),
      DEFAULT_PRODUCTION_PLATFORM_URL,
    );
  });

  it('respects explicit production URL', () => {
    assert.equal(
      resolvePublicPlatformUrl({
        platformPublicUrl: 'https://staging.example.com/',
        nodeEnv: 'production',
      }),
      'https://staging.example.com',
    );
  });
});
