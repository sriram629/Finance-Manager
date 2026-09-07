const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Not authorized, token missing",
        code: "AUTH_006",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password -otpCode -otpExpiresAt -otpPurpose -pendingEmail -emailChangeHash -emailChangeExpiresAt -emailChangeAttempts");

    if (!user || (decoded.version || 0) !== (user.tokenVersion || 0)) {
      return res.status(401).json({
        success: false,
        error: "Not authorized, user not found",
        code: "AUTH_006",
      });
    }
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        error: "Account not verified",
        code: "AUTH_005",
      });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error:
        error.name === "TokenExpiredError"
          ? "Token expired"
          : "Not authorized, invalid token",
      code: "AUTH_006",
    });
  }
};

module.exports = { protect };
