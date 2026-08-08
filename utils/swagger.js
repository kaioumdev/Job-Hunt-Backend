import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Job Hunt API",
      version: "1.0.0",
      description: `
## Job Hunt — REST API Documentation

A full-stack job portal that connects **Students / Job Seekers** with **Recruiters**.

### Authentication
All protected routes require a valid JWT token stored in an **HTTP-only cookie** named \`token\`.  
Set it by calling **POST /api/user/login** or **POST /api/user/verify-otp**. The cookie is automatically
included in subsequent requests when the client sends \`credentials: 'include'\` (fetch) or \`withCredentials: true\` (axios).

### Roles
| Role | Description |
|------|-------------|
| \`Student\` | Browse jobs, apply, manage profile |
| \`Recruiter\` | Post jobs, manage companies, review applicants |

### Base URL
- **Development**: \`http://localhost:5001\`
- **Production**: your deployed domain
      `,
      contact: {
        name: "Job Hunt Support",
        email: "support@jobhunt.dev",
      },
      license: {
        name: "ISC",
      },
    },
    servers: [
      {
        url: "http://localhost:5001",
        description: "Local Development Server",
      },
      {
        url: "https://your-production-domain.com",
        description: "Production Server",
      },
    ],
    tags: [
      {
        name: "Auth",
        description:
          "User registration, OTP verification, login, logout, and password management",
      },
      {
        name: "Profile",
        description: "Authenticated user profile updates",
      },
      {
        name: "Company",
        description:
          "Recruiter-only company registration, retrieval, and updates",
      },
      {
        name: "Jobs",
        description: "Job posting (Recruiter) and browsing/search (Student)",
      },
      {
        name: "Applications",
        description:
          "Job application flow — apply, view applied jobs, review applicants, update status",
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "token",
          description:
            "JWT token stored in an HTTP-only cookie. Obtained via `/api/user/login` or `/api/user/verify-otp`.",
        },
      },
      schemas: {
        // ─── Common ──────────────────────────────────────────────
        SuccessResponse: {
          type: "object",
          properties: {
            message: { type: "string", example: "Operation completed successfully" },
            success: { type: "boolean", example: true },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            message: { type: "string", example: "An error occurred" },
            success: { type: "boolean", example: false },
          },
        },

        // ─── User ─────────────────────────────────────────────────
        UserProfile: {
          type: "object",
          properties: {
            bio: { type: "string", example: "Full-stack developer with 3 years of experience" },
            skills: {
              type: "array",
              items: { type: "string" },
              example: ["React", "Node.js", "MongoDB"],
            },
            resume: {
              type: "string",
              format: "uri",
              example: "https://res.cloudinary.com/demo/raw/upload/resume.pdf",
            },
            profilePhoto: {
              type: "string",
              format: "uri",
              example: "https://res.cloudinary.com/demo/image/upload/avatar.jpg",
            },
          },
        },
        User: {
          type: "object",
          properties: {
            _id: { type: "string", example: "64f1a2b3c4d5e6f7a8b9c0d1" },
            fullname: { type: "string", example: "Jane Doe" },
            email: {
              type: "string",
              format: "email",
              example: "jane.doe@example.com",
            },
            phoneNumber: { type: "string", example: "+1-555-0100" },
            role: {
              type: "string",
              enum: ["Student", "Recruiter"],
              example: "Student",
            },
            profile: { $ref: "#/components/schemas/UserProfile" },
          },
        },

        // ─── Company ──────────────────────────────────────────────
        Company: {
          type: "object",
          properties: {
            _id: { type: "string", example: "64f1a2b3c4d5e6f7a8b9c0d2" },
            name: { type: "string", example: "Acme Corp" },
            description: {
              type: "string",
              example: "A leading technology company building innovative solutions.",
            },
            website: {
              type: "string",
              format: "uri",
              example: "https://acme.example.com",
            },
            location: { type: "string", example: "San Francisco, CA" },
            logo: {
              type: "string",
              format: "uri",
              example: "https://res.cloudinary.com/demo/image/upload/logo.png",
            },
            userId: { type: "string", example: "64f1a2b3c4d5e6f7a8b9c0d1" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },

        // ─── Job ──────────────────────────────────────────────────
        Job: {
          type: "object",
          properties: {
            _id: { type: "string", example: "64f1a2b3c4d5e6f7a8b9c0d3" },
            title: { type: "string", example: "Senior React Developer" },
            description: {
              type: "string",
              example: "Build and maintain high-performance React applications.",
            },
            requirements: {
              type: "array",
              items: { type: "string" },
              example: ["React", "TypeScript", "Redux", "REST APIs"],
            },
            salary: { type: "string", example: "120000" },
            experienceLevel: { type: "number", example: 3 },
            location: { type: "string", example: "New York, NY" },
            jobType: { type: "string", example: "Full-time" },
            position: {
              type: "number",
              description: "Number of open positions",
              example: 2,
            },
            company: { $ref: "#/components/schemas/Company" },
            created_by: { type: "string", example: "64f1a2b3c4d5e6f7a8b9c0d1" },
            applications: {
              type: "array",
              items: { type: "string" },
              description: "Array of Application ObjectIds",
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },

        // ─── Application ──────────────────────────────────────────
        Application: {
          type: "object",
          properties: {
            _id: { type: "string", example: "64f1a2b3c4d5e6f7a8b9c0d4" },
            job: { $ref: "#/components/schemas/Job" },
            applicant: { $ref: "#/components/schemas/User" },
            status: {
              type: "string",
              enum: ["pending", "accepted", "rejected"],
              example: "pending",
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
      },
    },
  },
  apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

/**
 * Registers Swagger UI and the raw JSON spec endpoint onto the Express app.
 * @param {import('express').Application} app
 */
export function setupSwagger(app) {
  // ── Interactive UI ──────────────────────────────────────────────────────
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: "Job Hunt API Docs",
      customCss: `
        .swagger-ui .topbar { background-color: #1e293b; }
        .swagger-ui .topbar-wrapper img { content: url('data:image/svg+xml;base64,'); }
        .swagger-ui .info .title { color: #1e293b; font-size: 2rem; }
        .swagger-ui .scheme-container { background: #f8fafc; padding: 12px 20px; }
        .swagger-ui .opblock.opblock-get .opblock-summary-method { background: #3b82f6; }
        .swagger-ui .opblock.opblock-post .opblock-summary-method { background: #22c55e; }
        .swagger-ui .opblock.opblock-put .opblock-summary-method { background: #f59e0b; }
        .swagger-ui .opblock.opblock-delete .opblock-summary-method { background: #ef4444; }
      `,
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        docExpansion: "none",
        filter: true,
        tagsSorter: "alpha",
      },
    })
  );

  // ── Raw JSON spec (useful for code-gen tools, Postman import, etc.) ────
  app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  console.log("📚 Swagger UI  →  http://localhost:5001/api-docs");
  console.log("📄 OpenAPI JSON →  http://localhost:5001/api-docs.json");
}
