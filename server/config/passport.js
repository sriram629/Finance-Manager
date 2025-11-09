const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const User = require("../models/User");

const handleSocialLogin = async (provider, profile, done) => {
  try {
    // Try to get the best email available
    let email = null;
    if (profile.emails && profile.emails.length > 0) {
      // Look for a primary verified email first
      const primaryEmail = profile.emails.find((e) => e.primary && e.verified);
      if (primaryEmail) {
        email = primaryEmail.value.toLowerCase();
      } else {
        // Fallback to the first email
        email = profile.emails[0].value.toLowerCase();
      }
    }

    // 1. Try to find by social ID
    let user = await User.findOne({ [`${provider}Id`]: profile.id });
    if (user) return done(null, user);

    // 2. Try to find by email (link accounts)
    if (email) {
      user = await User.findOne({ email });
      if (user) {
        user[`${provider}Id`] = profile.id;
        await user.save();
        return done(null, user);
      }
    }

    // 3. Create new user
    const firstName =
      profile.displayName?.split(" ")[0] || profile.username || "User";
    const lastName = profile.displayName?.split(" ").slice(1).join(" ") || "";

    const newUser = new User({
      [`${provider}Id`]: profile.id,
      // Fallback if absolutely NO email is returned (rare but possible with strict privacy settings)
      email: email || `${profile.username || profile.id}@github.no-email.com`,
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
      callbackURL: "/api/auth/google/callback",
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
      callbackURL: "/api/auth/github/callback",
      proxy: true,
      scope: ["user:email"],
      userAgent: "finance-manager-app",
    },
    (accessToken, refreshToken, profile, done) =>
      handleSocialLogin("github", profile, done)
  )
);

module.exports = passport;
