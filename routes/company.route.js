import express from "express";

import authenticateToken from "../middleware/isAuthenticated.js";
import {
  getAllCompanies,
  getCompanyById,
  registerCompany,
  updateCompany,
} from "../controllers/company.controller.js";
import { singleUpload } from "../middleware/multer.js";

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// Swagger JSDoc annotations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/company/register:
 *   post:
 *     tags: [Company]
 *     summary: Register a new company (Recruiter only)
 *     description: |
 *       Creates a new company record owned by the authenticated recruiter.
 *       Company names must be **unique** across the platform.
 *
 *       > **Auth required** — Recruiter role.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [companyName]
 *             properties:
 *               companyName:
 *                 type: string
 *                 example: Acme Corp
 *     responses:
 *       201:
 *         description: Company registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Company registered successfully.
 *                 company:
 *                   $ref: '#/components/schemas/Company'
 *                 success:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: Not authenticated, or company name missing / already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               not_authenticated:
 *                 value:
 *                   message: No token provided
 *                   success: false
 *               duplicate_name:
 *                 value:
 *                   message: Company already exists
 *                   success: false
 */
router.route("/register").post(authenticateToken, registerCompany);

/**
 * @swagger
 * /api/company/get:
 *   get:
 *     tags: [Company]
 *     summary: Get all companies owned by the authenticated recruiter
 *     description: |
 *       Returns every company that was registered by the currently
 *       authenticated user. Results are **not** paginated.
 *
 *       > **Auth required** — Recruiter role.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of companies
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 companies:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Company'
 *                 success:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: No companies found for this user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.route("/get").get(authenticateToken, getAllCompanies);

/**
 * @swagger
 * /api/company/get/{id}:
 *   get:
 *     tags: [Company]
 *     summary: Get a single company by ID
 *     description: |
 *       Fetches a company document by its MongoDB ObjectId.
 *
 *       > **Auth required.**
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the company
 *         example: 64f1a2b3c4d5e6f7a8b9c0d2
 *     responses:
 *       200:
 *         description: Company found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 company:
 *                   $ref: '#/components/schemas/Company'
 *                 success:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Company not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.route("/get/:id").get(authenticateToken, getCompanyById);

/**
 * @swagger
 * /api/company/update/{id}:
 *   put:
 *     tags: [Company]
 *     summary: Update company details and logo (Recruiter only)
 *     description: |
 *       Updates the company's profile fields.  A **logo image file is required**
 *       in every update request — it is uploaded to Cloudinary and the resulting
 *       URL is stored.
 *
 *       | Field | Notes |
 *       |-------|-------|
 *       | `name` | New display name |
 *       | `description` | Company description |
 *       | `website` | Company website URL |
 *       | `location` | Office location / headquarters |
 *       | `logo` | Logo image file (JPEG / PNG) — **required** |
 *
 *       > **Auth required** — Recruiter role.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the company to update
 *         example: 64f1a2b3c4d5e6f7a8b9c0d2
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [logo]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Acme Corporation
 *               description:
 *                 type: string
 *                 example: Building the future of enterprise software.
 *               website:
 *                 type: string
 *                 format: uri
 *                 example: https://acme.example.com
 *               location:
 *                 type: string
 *                 example: San Francisco, CA
 *               logo:
 *                 type: string
 *                 format: binary
 *                 description: Company logo image (JPEG / PNG, max 5 MB)
 *     responses:
 *       200:
 *         description: Company updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Company updated
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Company not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.route("/update/:id").put(authenticateToken, singleUpload, updateCompany);

export default router;
