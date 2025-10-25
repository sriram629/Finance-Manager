const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { validationRules, validate } = require("../utils/validation");

// 21. GET /api/user/profile
router.get("/profile", protect, async (req, res, next) => {
  try {
    // req.user is attached by the 'protect' middleware
    res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        createdAt: req.user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

// 22. PUT /api/user/profile
router.put("/profile", protect, (req, res) => {
  // TODO: Implement PUT /api/user/profile logic
  res.json({ success: true, message: "PUT /user/profile not implemented" });
});

// 23. POST /api/user/change-password
router.post(
  "/change-password",
  protect,
  validationRules("changePassword"),
  validate,
  (req, res) => {
    // TODO: Implement POST /api/user/change-password logic
    res.json({
      success: true,
      message: "POST /user/change-password not implemented",
    });
  }
);

// 24. GET /api/user/export-data
router.get("/export-data", protect, (req, res) => {
  // TODO: Implement GET /api/user/export-data logic
  res.json({ success: true, message: "GET /user/export-data not implemented" });
});

module.exports = router;
