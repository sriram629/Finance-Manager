const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const User = require("../models/User");
const OAuthStateStore = require("../utils/oauthState");
const { origin } = require("../utils/origins");
const serverOrigin = origin(process.env.SERVER_URL || process.env.RENDER_EXTERNAL_URL || "http://localhost:5050", "SERVER_URL");

const handleSocialLogin = async (provider, profile, done) => {
  try {
    const verifiedEmail = profile.emails?.find(e => e.verified === true) ||
      (provider === 'google' && profile._json?.email_verified === true ? profile.emails?.[0] : undefined);
    const email = verifiedEmail?.value?.trim().toLowerCase();

    let user = await User.findOne({ [`${provider}Id`]: profile.id });
    if (user) return done(null, user);

    if (email) {
      user = await User.findOne({ email });
      if (user) {
        if (!user.isVerified || (user[`${provider}Id`] && user[`${provider}Id`] !== profile.id)) {
          return done(null, false);
        }
        user[`${provider}Id`] = profile.id;
        await user.save();
        return done(null, user);
      }
    }

    if (!email) return done(null, false);

    const firstName =
      profile.displayName?.split(" ")[0] || profile.username || "User";
    const lastName = profile.displayName?.split(" ").slice(1).join(" ") || "";

    const newUser = new User({
      [`${provider}Id`]: profile.id,
      email,
      firstName,
      lastName,
      isVerified: true,
    });
    await newUser.save();
    return done(null, newUser);
  } catch (error) {
    return done(error, null);
  }
};

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${serverOrigin}/api/auth/google/callback`,
      store: new OAuthStateStore("google"),
      proxy: true,
    },
    (accessToken, refreshToken, profile, done) =>
      handleSocialLogin("google", profile, done)
  )
);

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: `${serverOrigin}/api/auth/github/callback`,
      store: new OAuthStateStore("github"),
      proxy: true,
      scope: ["user:email"],
      allRawEmails: true,
      userAgent: "finance-manager-app",
    },
    (accessToken, refreshToken, profile, done) =>
      handleSocialLogin("github", profile, done)
  )
);

module.exports = passport;
