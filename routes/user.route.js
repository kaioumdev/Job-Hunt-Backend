import express from "express";
import {
  forgotPassword,
  login,
  logout,
  register,
  resendOtp,
  resetPassword,
  updateProfile,
  verifyOtp,
} from "../controllers/user.controller.js";
import authenticateToken from "../middleware/isAuthenticated.js";
import { singleUpload } from "../middleware/multer.js";

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// Swagger JSDoc annotations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/user/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     description: |
 *       Creates a new user account and sends a **6-digit OTP** to the provided
 *       email address. The account is inactive until the OTP is verified via
 *       `POST /api/user/verify-otp`.
 *
 *       > **Note:** This endpoint uses `multipart/form-data` because an optional
 *       > profile photo can be attached.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - fullname
 *               - email
 *               - phoneNumber
 *               - password
 *               - role
 *             properties:
 *               fullname:
 *                 type: string
 *                 example: Jane Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: jane.doe@example.com
 *               phoneNumber:
 *                 type: string
 *                 example: "+15550100"
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: Secret@123
 *               role:
 *                 type: string
 *                 enum: [Student, Recruiter]
 *                 example: Student
 *               termsAcceptedAt:
 *                 type: string
 *                 format: date-time
 *                 description: ISO timestamp when the user accepted the Terms of Service
 *                 example: "2024-01-15T10:30:00.000Z"
 *               profilePhoto:
 *                 type: string
 *                 format: binary
 *                 description: Optional profile photo (JPEG / PNG, max 5 MB)
 *     responses:
 *       200:
 *         description: OTP sent — user must verify email to activate account
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: OTP sent to your email. Please verify to continue.
 *                 email:
 *                   type: string
 *                   example: jane.doe@example.com
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Email already registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Email already exists
 *               success: false
 *       404:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error or failed to send OTP email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.route("/register").post(singleUpload, register);

/**
 * @swagger
 * /api/user/verify-otp:
 *   post:
 *     tags: [Auth]
 *     summary: Verify email OTP after registration
 *     description: |
 *       Validates the 6-digit OTP sent during registration. On success the
 *       account is activated, a JWT cookie is set, and the user object is
 *       returned — no separate login step needed.
 *
 *       The OTP expires after **10 minutes**.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: jane.doe@example.com
 *               otp:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 6
 *                 example: "483920"
 *     responses:
 *       200:
 *         description: Email verified — JWT cookie set, user logged in
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: token=eyJhbGci...; Path=/; HttpOnly; SameSite=Strict
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Email verified successfully.
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Invalid OTP, expired OTP, or email already verified
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.route("/verify-otp").post(verifyOtp);

/**
 * @swagger
 * /api/user/resend-otp:
 *   post:
 *     tags: [Auth]
 *     summary: Resend OTP for email verification
 *     description: |
 *       Issues a fresh OTP (valid 10 minutes) to the given email address.
 *       Only works for accounts that are **not yet verified**.
 *
 *       Use this when the user's previous OTP expired or was not received.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: jane.doe@example.com
 *     responses:
 *       200:
 *         description: New OTP sent to email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               message: A new OTP has been sent to your email.
 *               success: true
 *       400:
 *         description: Email already verified
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.route("/resend-otp").post(resendOtp);

/**
 * @swagger
 * /api/user/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request a password-reset OTP
 *     description: |
 *       Sends a 6-digit OTP to the account's registered email address.
 *       Use the OTP with `POST /api/user/reset-password` to set a new password.
 *
 *       The OTP expires after **10 minutes**.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: jane.doe@example.com
 *     responses:
 *       200:
 *         description: OTP sent to email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               message: OTP sent to your email.
 *               success: true
 *       404:
 *         description: No account found with this email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.route("/forgot-password").post(forgotPassword);

/**
 * @swagger
 * /api/user/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password using OTP
 *     description: |
 *       Verifies the OTP issued by `POST /api/user/forgot-password` and sets
 *       the new password. A successful reset also marks the account as verified.
 *
 *       Password must be **at least 6 characters**.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp, newPassword]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: jane.doe@example.com
 *               otp:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 6
 *                 example: "738291"
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: NewSecret@456
 *     responses:
 *       200:
 *         description: Password changed — user must log in with new credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               message: Password changed successfully. Please login.
 *               success: true
 *       400:
 *         description: Invalid OTP, expired OTP, or password too short
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.route("/reset-password").post(resetPassword);

/**
 * @swagger
 * /api/user/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in with email and password
 *     description: |
 *       Authenticates a verified user and sets an **HTTP-only JWT cookie** (`token`)
 *       valid for **24 hours**.
 *
 *       - The `role` field must match what was used at registration.
 *       - Unverified accounts (OTP not completed) are blocked with `403`.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, role]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: jane.doe@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Secret@123
 *               role:
 *                 type: string
 *                 enum: [Student, Recruiter]
 *                 example: Student
 *     responses:
 *       200:
 *         description: Login successful — JWT cookie set
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: token=eyJhbGci...; Path=/; HttpOnly; SameSite=Strict
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Welcome back Jane Doe
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 success:
 *                   type: boolean
 *                   example: true
 *       403:
 *         description: Email not verified, or role mismatch
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Please verify your email before logging in.
 *                 needVerification:
 *                   type: boolean
 *                   example: true
 *                 success:
 *                   type: boolean
 *                   example: false
 *       404:
 *         description: Incorrect email / password, or missing fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.route("/login").post(login);

/**
 * @swagger
 * /api/user/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Log out the current user
 *     description: |
 *       Clears the `token` cookie, effectively ending the session.
 *       No request body required.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: token=; Max-Age=0; Path=/
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               message: Logged out successfully.
 *               success: true
 */
router.route("/logout").post(logout);

/**
 * @swagger
 * /api/user/profile/update:
 *   post:
 *     tags: [Profile]
 *     summary: Update the authenticated user's profile
 *     description: |
 *       All fields are **optional** — send only what you want to change.
 *
 *       | Field | Notes |
 *       |-------|-------|
 *       | `fullname` | Display name |
 *       | `email` | New email address |
 *       | `phoneNumber` | New phone number |
 *       | `bio` | Short bio / tagline |
 *       | `skills` | Comma-separated string, e.g. `"React,Node.js,MongoDB"` |
 *       | `resume` | Direct URL to an existing hosted PDF |
 *       | `profilePhoto` | Upload a new photo (binary) |
 *
 *       > **Auth required** — include the `token` cookie.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               fullname:
 *                 type: string
 *                 example: Jane M. Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: jane.updated@example.com
 *               phoneNumber:
 *                 type: string
 *                 example: "+15550200"
 *               bio:
 *                 type: string
 *                 example: Passionate React developer seeking remote opportunities.
 *               skills:
 *                 type: string
 *                 description: Comma-separated list of skills
 *                 example: "React,TypeScript,Node.js,PostgreSQL"
 *               resume:
 *                 type: string
 *                 format: uri
 *                 description: Direct URL to an existing hosted resume PDF
 *                 example: "https://res.cloudinary.com/demo/raw/upload/my_resume.pdf"
 *               profilePhoto:
 *                 type: string
 *                 format: binary
 *                 description: New profile photo file (JPEG / PNG)
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Profile updated successfully
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 success:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: Not authenticated (missing or invalid token cookie)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router
  .route("/profile/update")
  .post(authenticateToken, singleUpload, updateProfile);

export default router;
