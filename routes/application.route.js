import express from "express";

import authenticateToken from "../middleware/isAuthenticated.js";
import {
  applyJob,
  getApplicants,
  getAppliedJobs,
  updateStatus,
} from "../controllers/application.controller.js";

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// Swagger JSDoc annotations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/application/apply/{id}:
 *   get:
 *     tags: [Applications]
 *     summary: Apply for a job (Student only)
 *     description: |
 *       Submits a job application for the authenticated student. Uses `GET`
 *       because no request body is needed — the job ID comes from the path and
 *       the applicant ID from the session cookie.
 *
 *       **Rules:**
 *       - A student can only apply **once** per job.
 *       - The job must exist.
 *
 *       On success the application is linked to the job's `applications` array.
 *
 *       > **Auth required** — Student role.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the job to apply for
 *         example: 64f1a2b3c4d5e6f7a8b9c0d3
 *     responses:
 *       201:
 *         description: Application submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Application submitted
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Already applied for this job, or invalid job ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               already_applied:
 *                 value:
 *                   message: You have already applied for this job
 *                   success: false
 *               invalid_id:
 *                 value:
 *                   message: Invalid job id
 *                   success: false
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
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
router.route("/apply/:id").get(authenticateToken, applyJob);

/**
 * @swagger
 * /api/application/get:
 *   get:
 *     tags: [Applications]
 *     summary: Get all jobs the authenticated student has applied to
 *     description: |
 *       Returns every application belonging to the currently authenticated
 *       student, sorted newest first. Each application includes the nested
 *       **job** and **company** documents for rich display.
 *
 *       > **Auth required** — Student role.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of the student's applications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 application:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Application'
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
 *         description: No applications found
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
router.route("/get").get(authenticateToken, getAppliedJobs);

/**
 * @swagger
 * /api/application/{id}/applicants:
 *   get:
 *     tags: [Applications]
 *     summary: Get all applicants for a specific job (Recruiter only)
 *     description: |
 *       Returns the job document with all applications populated, including
 *       the **applicant** (user) details inside each application object.
 *       Sorted newest first.
 *
 *       Used in the recruiter's admin panel to review candidates.
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
 *         description: MongoDB ObjectId of the job
 *         example: 64f1a2b3c4d5e6f7a8b9c0d3
 *     responses:
 *       200:
 *         description: Job with populated applicant list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 job:
 *                   allOf:
 *                     - $ref: '#/components/schemas/Job'
 *                     - type: object
 *                       properties:
 *                         applications:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Application'
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
router.route("/:id/applicants").get(authenticateToken, getApplicants);

/**
 * @swagger
 * /api/application/status/{id}/update:
 *   post:
 *     tags: [Applications]
 *     summary: Update an application's status (Recruiter only)
 *     description: |
 *       Changes the decision status of a specific application.
 *
 *       | Status | Meaning |
 *       |--------|---------|
 *       | `pending` | Default — awaiting review |
 *       | `accepted` | Candidate is accepted |
 *       | `rejected` | Candidate is rejected |
 *
 *       The value is **lowercased** before saving, so `Accepted` and `ACCEPTED`
 *       are both valid inputs.
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
 *         description: MongoDB ObjectId of the application to update
 *         example: 64f1a2b3c4d5e6f7a8b9c0d4
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, accepted, rejected]
 *                 example: accepted
 *     responses:
 *       200:
 *         description: Application status updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Application status updated
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Status field is missing
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
 *       404:
 *         description: Application not found
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
router.route("/status/:id/update").post(authenticateToken, updateStatus);

export default router;
