const crypto = require('node:crypto');
const AuthTicket = require('../models/AuthTicket');
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
async function issue(purpose, user, ttl = 60_000, challenge) {
  const value = crypto.randomBytes(32).toString('hex');
  await AuthTicket.create({ digest: digest(value), purpose, user, challenge, expiresAt: new Date(Date.now() + ttl) });
  return value;
}
async function consume(value, purpose, challenge) {
  if (typeof value !== 'string' || !/^[a-f0-9]{64}$/.test(value)) return null;
  return AuthTicket.findOneAndDelete({ digest: digest(value), purpose, ...(challenge ? { challenge } : {}), expiresAt: { $gt: new Date() } });
}
module.exports = { issue, consume, digest };
