const { body, validationResult } = require("express-validator");

const validationRules = (method) => {
  switch (method) {
    case "register": {
      return [
        body("email", "Please include a valid email").isEmail(),
        body("password", "Password must be at least 6 characters").isLength({
          min: 6,
        }),
        body("firstName", "First name is required").not().isEmpty(),
      ];
    }
    case "login": {
      return [
        body("email", "Please include a valid email").isEmail(),
        body("password", "Password is required").exists(),
      ];
    }
    case "verifyOtp": {
      return [
        body("email", "Please include a valid email").isEmail(),
        body("otp", "OTP must be a 6-digit number")
          .isLength({ min: 6, max: 6 })
          .isNumeric(),
      ];
    }
    case "resendOtp":
    case "forgotPassword": {
      return [body("email", "Please include a valid email").isEmail()];
    }
    case "resetPassword": {
      return [
        body("email", "Please include a valid email").isEmail(),
        body("otp", "OTP must be a 6-digit number")
          .isLength({ min: 6, max: 6 })
          .isNumeric(),
        body(
          "newPassword",
          "New password must be at least 6 characters"
        ).isLength({ min: 6 }),
      ];
    }
    case "changePassword": {
      return [
        body("currentPassword", "Current password is required").exists(),
        body(
          "newPassword",
          "New password must be at least 6 characters"
        ).isLength({ min: 6 }),
      ];
    }
  }
};

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  return res
    .status(400)
    .json({ success: false, errors: errors.array(), code: "VAL_001" });
};

module.exports = {
  validationRules,
  validate,
};
