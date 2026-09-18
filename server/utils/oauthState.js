const { issue, consume } = require('./authTickets');
const crypto = require('node:crypto');
class OAuthStateStore {
  constructor(provider) { this.provider = provider; this.cookie = `fm_oauth_${provider}`; }
  options() { return { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: `/api/auth/${this.provider}` }; }
  store(req, done) {
    const challenge = req.query.challenge;
    if (typeof challenge !== 'string' || !/^[a-f0-9]{64}$/.test(challenge)) return done(new Error('Start social login from the sign-in page.'));
    issue(`state:${this.provider}`, undefined, 10 * 60_000, challenge).then(state => {
      req.res.cookie(this.cookie, state, { ...this.options(), maxAge: 10 * 60_000 });
      done(null, state);
    }, done);
  }
  verify(req, state, done) {
    const cookie = (req.headers.cookie || '').split(';').map(v => v.trim()).find(v => v.startsWith(`${this.cookie}=`))?.slice(this.cookie.length + 1);
    req.res.clearCookie(this.cookie, this.options());
    if (typeof state !== 'string' || !cookie || !/^[a-f0-9]{64}$/.test(state) || !/^[a-f0-9]{64}$/.test(cookie) || !crypto.timingSafeEqual(Buffer.from(state), Buffer.from(cookie))) {
      return done(null, false, { message: 'Invalid OAuth state' });
    }
    consume(state, `state:${this.provider}`).then(ticket => { req.oauthChallenge = ticket?.challenge; done(null, !!ticket); }, done);
  }
}
module.exports = OAuthStateStore;
