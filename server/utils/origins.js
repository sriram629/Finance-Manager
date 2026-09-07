function origin(value, name) {
  if (!value) throw new Error(`${name} is required`);
  const url = new URL(value);
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (url.username || url.password || url.search || url.hash || url.pathname !== '/' ||
      (url.protocol !== 'https:' && !(process.env.NODE_ENV !== 'production' && local && url.protocol === 'http:'))) {
    throw new Error(`${name} must be an HTTPS origin (localhost HTTP is allowed in development)`);
  }
  return url.origin;
}
module.exports = { origin };
