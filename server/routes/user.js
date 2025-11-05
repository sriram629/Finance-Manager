const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { validationRules, validate } = require("../utils/validation");
const User = require("../models/User");
const Schedule = require("../models/Schedule");
const Expense = require("../models/Expense");
const bcrypt = require("bcryptjs");

/**
 * @swagger
 * tags:
 *   - name: User
 *     description: User profile and data management
 */

/**
 * @swagger
 * /api/user/profile:
 *   get:
 *     summary: Get the logged-in user's profile
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       '200':
 *         description: User profile data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "60d123abc45"
 *                     email:
 *                       type: string
 *                       example: "user@example.com"
 *                     firstName:
 *                       type: string
 *                       example: "John"
 *                     lastName:
 *                       type: string
 *                       example: "Doe"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       '401':
 *         description: Not authorized
 */
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

/**
 * @swagger
 * /api/user/profile:
 *   put:
 *     summary: Update the logged-in user's profile
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 example: "Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@example.com"
 *     responses:
 *       '200':
 *         description: User profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *       '400':
 *         description: Validation error
 *       '401':
 *         description: Not authorized
 *       '409':
 *         description: Email already exists
 */
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

        if (req.body.email && req.body.email.toLowerCase() !== user.email) {
          const emailExists = await User.findOne({
            email: req.body.email.toLowerCase(),
          });
          if (emailExists) {
            return res.status(409).json({
              success: false,
              error: "Email already exists",
              code: "AUTH_002",
            });
          }
          user.email = req.body.email.toLowerCase();
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

/**
 * @swagger
 * /api/user/change-password:
 *   post:
 *     summary: Change the logged-in user's password
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 example: "OldPass123!"
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: "NewSecurePass123!"
 *     responses:
 *       '200':
 *         description: Password updated successfully
 *       '400':
 *         description: Validation error
 *       '401':
 *         description: Invalid current password
 */
router.post(
  "/change-password",
  protect,
  validationRules("changePassword"),
  validate,
  async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user.id);

      if (user && (await user.comparePassword(currentPassword))) {
        user.password = newPassword;
        await user.save();
        res
          .status(200)
          .json({ success: true, message: "Password updated successfully" });
      } else {
        res.status(401).json({
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

/**
 * @swagger
 * /api/user/export-data:
 *   get:
 *     summary: Export all data for the logged-in user
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       '200':
 *         description: A JSON file containing all user data
 *       '401':
 *         description: Not authorized
 */
router.get("/export-data", protect, async (req, res, next) => {
  try {
    const userId = req.user.id;

    const userProfile = await User.findById(userId)
      .select("-password -otpCode -otpExpiresAt")
      .lean();
    const schedules = await Schedule.find({ user: userId }).lean();
    const expenses = await Expense.find({ user: userId }).lean();

    const allData = {
      profile: userProfile,
      schedules,
      expenses,
    };

    const filename = `finance_manager_export_${userProfile.email}_${
      new Date().toISOString().split("T")[0]
    }.json`;

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(JSON.stringify(allData, null, 2));
  } catch (error) {
    next(error);
  }
});

module.exports = router;
