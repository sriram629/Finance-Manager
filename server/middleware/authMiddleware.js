// import jwt from "jsonwebtoken";

// export const protect = (req, res, next) => {
//   const token = req.headers.authorization?.split(" ")[1];

//   if (!token)
//     return res.status(401).json({ message: "Not authorized, token missing" });

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded;
//     next();
//   } catch (error) {
//     res.status(401).json({ message: "Invalid or expired token" });
//   }
// };

const jwt = require("jsonwebtoken");
const User = require("../models/User.js");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: "Not authorized, user not found",
          code: "AUTH_006",
        });
      }

      if (!req.user.isVerified) {
        return res.status(403).json({
          success: false,
          error: "Account not verified",
          code: "AUTH_005",
        });
      }

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({
        success: false,
        error: "Not authorized, token failed",
        code: "AUTH_006",
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Not authorized, no token",
      code: "AUTH_006",
    });
  }
};

module.exports = { protect };
