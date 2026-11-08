const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

// Vercel's Node runtime can refuse require() of ES modules (ERR_REQUIRE_ESM). Newer Node versions
// allow it by default, so this test turns that feature off to behave like the strict runtime.
const root = path.join(__dirname, '..', '..');
const load = (file) =>
  spawnSync(process.execPath, ['--no-experimental-require-module', '-e', `require(${JSON.stringify(path.join(root, file))}); console.log('LOADED')`], { encoding: 'utf8' });

for (const file of ['api/tutor.js', 'api/tutor-status.js', 'api/admin-session.js', 'api/_lib/firebaseAdmin.js']) {
  test(`${file} loads without require()-ing an ES module`, () => {
    const r = spawnSync(process.execPath, ['--no-experimental-require-module', '-e', `require(${JSON.stringify(path.join(root, file))}); console.log('LOADED')`], { encoding: 'utf8' });
    assert.doesNotMatch(r.stderr, /ERR_REQUIRE_ESM/);
    assert.match(r.stdout, /LOADED/);
  });
}

test('firebase-admin token verification code path (jwks-rsa) is CommonJS-compatible', () => {
  const r = load('node_modules/firebase-admin/lib/utils/jwt.js');
  assert.doesNotMatch(r.stderr, /ERR_REQUIRE_ESM/);
  assert.match(r.stdout, /LOADED/);
});

test('the dependency tree has no ESM-only jose under jwks-rsa', () => {
  const jwks = require(path.join(root, 'node_modules/jwks-rsa/package.json'));
  const jose = require(path.join(root, 'node_modules/jose/package.json'));
  assert.notEqual(jose.type, 'module', `jose ${jose.version} is ESM-only but jwks-rsa ${jwks.version} loads it with require()`);
});
