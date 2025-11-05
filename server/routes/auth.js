const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { sendOtpEmail } = require("../services/emailService");
const generateToken = require("../utils/generateToken");
const { validationRules, validate } = require("../utils/validation");
const jwt = require("jsonwebtoken");
const { protect: verifyToken } = require("../middleware/authMiddleware");

/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: User registration, login, verification, and password management
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 *   schemas:
 *     ErrorAuth001:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           example: Invalid credentials
 *         code:
 *           type: string
 *           example: AUTH_001
 *     ErrorAuth002:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           example: Email already exists
 *         code:
 *           type: string
 *           example: AUTH_002
 *     ErrorAuth003:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           example: Invalid OTP
 *         code:
 *           type: string
 *           example: AUTH_003
 *     ErrorAuth004:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           example: OTP expired
 *         code:
 *           type: string
 *           example: AUTH_004
 *     ErrorAuth005:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           example: Account not verified
 *         code:
 *           type: string
 *           example: AUTH_005
 *     ErrorAuth006:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           example: Access denied. No token provided.
 *         code:
 *           type: string
 *           example: AUTH_006
 *     ErrorAuth007:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           example: Invalid or expired token
 *         code:
 *           type: string
 *           example: AUTH_007
 *     ValidationError:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         errors:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               msg:
 *                 type: string
 *                 example: Please include a valid email
 *               param:
 *                 type: string
 *                 example: email
 *               location:
 *                 type: string
 *                 example: body
 *         code:
 *           type: string
 *           example: VAL_001
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP sent to email
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       409:
 *         description: Email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorAuth002'
 */
router.post(
  "/register",
  validationRules("register"),
  validate,
  async (req, res, next) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      let user = await User.findOne({ email });
      if (user) {
        return res.status(409).json({
          success: false,
          error: "Email already exists",
          code: "AUTH_002",
        });
      }

      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

      user = new User({
        email,
        password,
        firstName,
        lastName,
        otpCode,
        otpExpiresAt,
      });
      await user.save();

      await sendOtpEmail(email, firstName, otpCode);

      res.status(200).json({
        success: true,
        message: "OTP sent to email",
        userId: user._id,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify user's email with OTP
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: Account verified
 *       400:
 *         description: Invalid OTP
 *       410:
 *         description: OTP expired
 */
router.post(
  "/verify-otp",
  validationRules("verifyOtp"),
  validate,
  async (req, res, next) => {
    try {
      const { email, otp } = req.body;
      const user = await User.findOne({ email });

      if (!user) {
        return res
          .status(400)
          .json({ success: false, error: "Invalid user", code: "AUTH_001" });
      }
      if (user.otpCode !== otp) {
        return res
          .status(400)
          .json({ success: false, error: "Invalid OTP", code: "AUTH_003" });
      }
      if (new Date() > user.otpExpiresAt) {
        return res
          .status(410)
          .json({ success: false, error: "OTP expired", code: "AUTH_004" });
      }

      user.isVerified = true;
      user.otpCode = undefined;
      user.otpExpiresAt = undefined;
      await user.save();

      res.status(200).json({ success: true, message: "Account verified" });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login a verified user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful, returns JWT token
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Account not verified
 */
router.post(
  "/login",
  validationRules("login"),
  validate,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });

      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({
          success: false,
          error: "Invalid credentials",
          code: "AUTH_001",
        });
      }
      if (!user.isVerified) {
        return res.status(403).json({
          success: false,
          error: "Account not verified",
          code: "AUTH_005",
        });
      }

      res.status(200).json({
        success: true,
        token: generateToken(user._id),
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/auth/resend-otp:
 *   post:
 *     summary: Resend OTP for email verification
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP resent
 *       400:
 *         description: User not found or account already verified
 */
router.post(
  "/resend-otp",
  validationRules("resendOtp"),
  validate,
  async (req, res, next) => {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });

      if (!user) {
        return res
          .status(400)
          .json({ success: false, error: "User not found" });
      }
      if (user.isVerified) {
        return res
          .status(400)
          .json({ success: false, error: "Account already verified" });
      }

      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      user.otpCode = otpCode;
      user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      await sendOtpEmail(user.email, user.firstName, otpCode);

      res.status(200).json({ success: true, message: "OTP resent" });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Send password reset OTP
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset OTP sent
 *       400:
 *         description: User not found
 */
router.post(
  "/forgot-password",
  validationRules("forgotPassword"),
  validate,
  async (req, res, next) => {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });

      if (!user) {
        return res
          .status(400)
          .json({ success: false, error: "User not found" });
      }

      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      user.otpCode = otpCode;
      user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      await sendOtpEmail(user.email, user.firstName, otpCode);

      res
        .status(200)
        .json({ success: true, message: "Password reset OTP sent" });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password with OTP
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid OTP
 *       410:
 *         description: OTP expired
 */
router.post(
  "/reset-password",
  validationRules("resetPassword"),
  validate,
  async (req, res, next) => {
    try {
      const { email, otp, newPassword } = req.body;
      const user = await User.findOne({ email });

      if (!user) {
        return res
          .status(400)
          .json({ success: false, error: "Invalid user", code: "AUTH_001" });
      }
      if (user.otpCode !== otp) {
        return res
          .status(400)
          .json({ success: false, error: "Invalid OTP", code: "AUTH_003" });
      }
      if (new Date() > user.otpExpiresAt) {
        return res
          .status(410)
          .json({ success: false, error: "OTP expired", code: "AUTH_004" });
      }

      user.password = newPassword;
      user.isVerified = true;
      user.otpCode = undefined;
      user.otpExpiresAt = undefined;
      await user.save();

      res
        .status(200)
        .json({ success: true, message: "Password reset successfully" });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/auth/protected:
 *   get:
 *     summary: Example protected route
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Access granted
 *       401:
 *         description: Missing token
 *       403:
 *         description: Invalid or expired token
 */
router.get("/protected", verifyToken, (req, res) => {
  res.json({
    success: true,
    message: "Access granted to protected route",
    user: req.user,
  });
});

module.exports = router;
