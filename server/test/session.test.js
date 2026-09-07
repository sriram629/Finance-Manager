const { test } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
process.env.JWT_SECRET = 'test-only-secret';
test('password changes invalidate older sessions while current sessions remain valid', async () => {
  User.findById = () => ({ select: async () => ({ tokenVersion: 2, isVerified: true }) });
  for (const version of [1, 2]) {
    const req = { headers: { authorization: `Bearer ${jwt.sign({ id: 'user', version }, process.env.JWT_SECRET)}` } };
    let status = 200, passed = false;
    const res = { status(code) { status = code; return this; }, json() {} };
    await protect(req, res, () => { passed = true; });
    assert.equal(status, version === 2 ? 200 : 401);
    assert.equal(passed, version === 2);
  }
});
