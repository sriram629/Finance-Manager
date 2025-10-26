const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { validationRules, validate } = require("../utils/validation");
const User = require("../models/User"); // --- ADD THIS ---
const bcrypt = require("bcryptjs"); // --- ADD THIS ---

// 21. GET /api/user/profile (This route should already exist and be correct)
router.get("/profile", protect, async (req, res, next) => {
  try {
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

// --- REPLACE 'PUT /api/user/profile' WITH THIS ---
// 22. PUT /api/user/profile
router.put(
  "/profile",
  protect,
  validationRules("updateProfile"),
  validate,
  async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);

      if (user) {
        user.firstName = req.body.firstName || user.firstName;
        user.lastName = req.body.lastName || user.lastName;

        // Check if email is being changed and if it's already taken
        if (req.body.email && req.body.email.toLowerCase() !== user.email) {
          const emailExists = await User.findOne({
            email: req.body.email.toLowerCase(),
          });
          if (emailExists) {
            return res
              .status(409)
              .json({
                success: false,
                error: "Email already exists",
                code: "AUTH_002",
              });
          }
          user.email = req.body.email.toLowerCase();
          // Note: A full implementation might force email re-verification here
        }

        const updatedUser = await user.save();

        res.status(200).json({
          success: true,
          user: {
            id: updatedUser._id,
            email: updatedUser.email,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
          },
        });
      } else {
        res.status(404).json({ success: false, error: "User not found" });
      }
    } catch (error) {
      next(error);
    }
  }
);

// --- REPLACE 'POST /api/user/change-password' WITH THIS ---
// 23. POST /api/user/change-password
router.post(
  "/change-password",
  protect,
  validationRules("changePassword"),
  validate,
  async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user.id);

      // Check if user exists and current password is correct
      if (user && (await user.comparePassword(currentPassword))) {
        user.password = newPassword; // Pre-save hook in User.js will hash this
        await user.save();
        res
          .status(200)
          .json({ success: true, message: "Password updated successfully" });
      } else {
        res
          .status(401)
          .json({
            success: false,
            error: "Invalid current password",
            code: "AUTH_001",
          });
      }
    } catch (error) {
      next(error);
    }
  }
);

// 24. GET /api/user/export-data (Keep your placeholder)
router.get("/export-data", protect, (req, res) => {
  res.json({ success: true, message: "GET /user/export-data not implemented" });
});

module.exports = router;
