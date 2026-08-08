import express from "express";

import authenticateToken from "../middleware/isAuthenticated.js";
import {
  getAdminJobs,
  getAllJobs,
  getJobById,
  getRecommendedJobs,
  postJob,
} from "../controllers/job.controller.js";

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// Swagger JSDoc annotations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/job/post:
 *   post:
 *     tags: [Jobs]
 *     summary: Post a new job listing (Recruiter only)
 *     description: |
 *       Creates a new job listing associated with one of the recruiter's
 *       registered companies.
 *
 *       - `requirements` is a **comma-separated string** that gets split into
 *         an array on save. Example: `"React,Node.js,MongoDB"`.
 *       - `salary` is stored as a number (annual, in your local currency).
 *       - `experience` is the minimum years of experience required.
 *       - `position` is the number of open seats for this role.
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
 *             required:
 *               - title
 *               - description
 *               - requirements
 *               - salary
 *               - location
 *               - jobType
 *               - experience
 *               - position
 *               - companyId
 *             properties:
 *               title:
 *                 type: string
 *                 example: Senior React Developer
 *               description:
 *                 type: string
 *                 example: >-
 *                   Build and maintain high-performance, scalable React
 *                   applications for our SaaS platform.
 *               requirements:
 *                 type: string
 *                 description: Comma-separated list of required skills / technologies
 *                 example: "React,TypeScript,Redux,REST APIs,Git"
 *               salary:
 *                 type: string
 *                 description: Annual salary in local currency (stored as number)
 *                 example: "120000"
 *               location:
 *                 type: string
 *                 example: New York, NY
 *               jobType:
 *                 type: string
 *                 example: Full-time
 *               experience:
 *                 type: number
 *                 description: Minimum years of experience
 *                 example: 3
 *               position:
 *                 type: number
 *                 description: Number of open positions
 *                 example: 2
 *               companyId:
 *                 type: string
 *                 description: MongoDB ObjectId of the recruiter's company
 *                 example: 64f1a2b3c4d5e6f7a8b9c0d2
 *     responses:
 *       201:
 *         description: Job posted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Job posted successfully.
 *                 job:
 *                   $ref: '#/components/schemas/Job'
 *                 status:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: One or more required fields are missing
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Not authenticated
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
router.route("/post").post(authenticateToken, postJob);

/**
 * @swagger
 * /api/job/get:
 *   get:
 *     tags: [Jobs]
 *     summary: Browse and search all job listings (public)
 *     description: |
 *       Returns all published jobs, **newest first**. No authentication required —
 *       anonymous visitors can browse jobs.
 *
 *       ### Search / Filtering
 *       Pass a `keyword` query parameter to perform a **case-insensitive**
 *       full-text search across `title` and `description` fields.
 *
 *       Each job object includes the nested **company** document.
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         required: false
 *         description: Search term (matches job title or description)
 *         example: React Developer
 *     responses:
 *       200:
 *         description: List of matching jobs (empty array if none)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 jobs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Job'
 *                 status:
 *                   type: boolean
 *                   example: true
 *       404:
 *         description: No jobs found
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
router.route("/get").get(getAllJobs);

/**
 * @swagger
 * /api/job/getadminjobs:
 *   get:
 *     tags: [Jobs]
 *     summary: Get all jobs posted by the authenticated recruiter
 *     description: |
 *       Returns only the jobs that were created by the currently authenticated
 *       recruiter, along with their associated company. Used in the admin
 *       dashboard to manage posted listings.
 *
 *       > **Auth required** — Recruiter role.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of recruiter's posted jobs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 jobs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Job'
 *                 status:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: No jobs found for this recruiter
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
router.route("/getadminjobs").get(authenticateToken, getAdminJobs);

/**
 * @swagger
 * /api/job/get/{id}:
 *   get:
 *     tags: [Jobs]
 *     summary: Get a single job by ID (public)
 *     description: |
 *       Returns the full job document including all populated application
 *       references. No authentication required.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the job
 *         example: 64f1a2b3c4d5e6f7a8b9c0d3
 *     responses:
 *       200:
 *         description: Job found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 job:
 *                   $ref: '#/components/schemas/Job'
 *                 status:
 *                   type: boolean
 *                   example: true
 *       404:
 *         description: Job not found
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
router.route("/get/:id").get(getJobById);

/**
 * @swagger
 * /api/job/recommendations/{id}:
 *   get:
 *     tags: [Jobs]
 *     summary: Get AI-powered recommended jobs for a given job (public)
 *     description: |
 *       Uses an AI model to pick the most relevant jobs from the database
 *       that are similar to the target job (by role, skills, location, or type).
 *
 *       **Algorithm:**
 *       1. Fetch the target job and up to 12 candidate jobs.
 *       2. Send both to an AI recommendation engine.
 *       3. If the AI returns valid IDs, return those jobs ordered by relevance.
 *       4. **Fallback:** if the AI fails or returns nothing, filter by `jobType`
 *          or `location`. If still empty, return the latest candidates.
 *
 *       Returns a maximum of **6 recommended jobs**.
 *
 *       > No authentication required.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the reference job
 *         example: 64f1a2b3c4d5e6f7a8b9c0d3
 *     responses:
 *       200:
 *         description: Up to 6 recommended jobs (may be empty if no candidates exist)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 jobs:
 *                   type: array
 *                   maxItems: 6
 *                   items:
 *                     $ref: '#/components/schemas/Job'
 *                 status:
 *                   type: boolean
 *                   example: true
 *       404:
 *         description: Reference job not found
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
router.route("/recommendations/:id").get(getRecommendedJobs);

export default router;
