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
        url: "https://job-hunt-backend-phi.vercel.app",
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
            email: { type: "string", format: "email", example: "jane.doe@example.com" },
            phoneNumber: { type: "string", example: "+1-555-0100" },
            role: { type: "string", enum: ["Student", "Recruiter"], example: "Student" },
            profile: { $ref: "#/components/schemas/UserProfile" },
          },
        },
        Company: {
          type: "object",
          properties: {
            _id: { type: "string", example: "64f1a2b3c4d5e6f7a8b9c0d2" },
            name: { type: "string", example: "Acme Corp" },
            description: { type: "string", example: "A leading technology company." },
            website: { type: "string", format: "uri", example: "https://acme.example.com" },
            location: { type: "string", example: "San Francisco, CA" },
            logo: { type: "string", format: "uri", example: "https://res.cloudinary.com/demo/image/upload/logo.png" },
            userId: { type: "string", example: "64f1a2b3c4d5e6f7a8b9c0d1" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Job: {
          type: "object",
          properties: {
            _id: { type: "string", example: "64f1a2b3c4d5e6f7a8b9c0d3" },
            title: { type: "string", example: "Senior React Developer" },
            description: { type: "string", example: "Build and maintain React applications." },
            requirements: { type: "array", items: { type: "string" }, example: ["React", "TypeScript"] },
            salary: { type: "string", example: "120000" },
            experienceLevel: { type: "number", example: 3 },
            location: { type: "string", example: "New York, NY" },
            jobType: { type: "string", example: "Full-time" },
            position: { type: "number", example: 2 },
            company: { $ref: "#/components/schemas/Company" },
            created_by: { type: "string", example: "64f1a2b3c4d5e6f7a8b9c0d1" },
            applications: { type: "array", items: { type: "string" } },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Application: {
          type: "object",
          properties: {
            _id: { type: "string", example: "64f1a2b3c4d5e6f7a8b9c0d4" },
            job: { $ref: "#/components/schemas/Job" },
            applicant: { $ref: "#/components/schemas/User" },
            status: { type: "string", enum: ["pending", "accepted", "rejected"], example: "pending" },
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

// CDN version — must match swagger-ui-dist latest stable
const SWAGGER_UI_VERSION = "5.18.2";
const CDN_BASE = `https://cdn.jsdelivr.net/npm/swagger-ui-dist@${SWAGGER_UI_VERSION}`;

/**
 * Builds a self-contained HTML page that loads Swagger UI entirely from CDN.
 * This avoids the static-file serving problem on Vercel serverless.
 */
function buildSwaggerHtml(specUrl) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Job Hunt API Docs</title>
  <link rel="stylesheet" href="${CDN_BASE}/swagger-ui.css" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #fafafa; }
    html { overflow-y: scroll; }
    .swagger-ui .topbar { background-color: #1e293b !important; }
    .swagger-ui .info .title { color: #1e293b; font-size: 2rem; }
    .swagger-ui .scheme-container { background: #f8fafc; padding: 12px 20px; }
    .swagger-ui .opblock.opblock-get    .opblock-summary-method { background: #3b82f6; }
    .swagger-ui .opblock.opblock-post   .opblock-summary-method { background: #22c55e; }
    .swagger-ui .opblock.opblock-put    .opblock-summary-method { background: #f59e0b; }
    .swagger-ui .opblock.opblock-delete .opblock-summary-method { background: #ef4444; }
    .swagger-ui .topbar .download-url-wrapper { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>

  <script src="${CDN_BASE}/swagger-ui-bundle.js"></script>
  <script src="${CDN_BASE}/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function () {
      SwaggerUIBundle({
        url: "${specUrl}",
        dom_id: '#swagger-ui',
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        layout: "StandaloneLayout",
        persistAuthorization: true,
        displayRequestDuration: true,
        docExpansion: "none",
        filter: true,
        tagsSorter: "alpha",
        withCredentials: true,
      });
    };
  </script>
</body>
</html>`;
}

/**
 * Registers Swagger UI and the raw JSON spec endpoint onto the Express app.
 * @param {import('express').Application} app
 */
export function setupSwagger(app) {
  // ── Raw JSON spec (Postman, code-gen, and the UI itself use this) ────────
  app.get("/api-docs.json", (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  // ── Interactive UI served as a CDN-based standalone HTML page ────────────
  // This bypasses swagger-ui-express static file serving which breaks on Vercel.
  app.get("/api-docs", (_req, res) => {
    const specUrl = "/api-docs.json";
    res.setHeader("Content-Type", "text/html");
    res.send(buildSwaggerHtml(specUrl));
  });

  // Also serve /api-docs/ (trailing slash) to avoid 404 on direct navigation
  app.get("/api-docs/", (_req, res) => res.redirect("/api-docs"));

  console.log("📚 Swagger UI  →  http://localhost:5001/api-docs");
  console.log("📄 OpenAPI JSON →  http://localhost:5001/api-docs.json");
}
