import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./utils/db.js";
import userRoute from "./routes/user.route.js";
import companyRoute from "./routes/company.route.js";
import jobRoute from "./routes/job.route.js";
import applicationRoute from "./routes/application.route.js";
import { setupSwagger } from "./utils/swagger.js";

dotenv.config({});
const app = express();

// ── Core middleware ───────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const allowedOrigins = [
  "https://job-hunt-frontend-nu.vercel.app",
  "http://localhost:5173",
  "http://localhost:5174",
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error("CORS: origin " + origin + " not allowed"));
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// ── API Documentation ─────────────────────────────────────────────────────────
setupSwagger(app);

// ── Health check (shows SET/MISSING for env vars — never exposes values) ──────
app.get("/health", (_req, res) => {
  const required = ["MONGO_URI", "JWT_SECRET", "EMAIL_USER", "EMAIL_PASS", "CLOUD_NAME", "CLOUD_API", "API_SECRET"];
  const optional = ["AI_BASE_URL", "AI_API_KEY", "AI_MODEL", "NODE_ENV"];
  const check = (keys) =>
    Object.fromEntries(keys.map((k) => [k, process.env[k] ? "SET" : "MISSING"]));
  res.json({
    status: "ok",
    node_env: process.env.NODE_ENV || "undefined",
    required: check(required),
    optional: check(optional),
  });
});

// Root
app.get("/", (_req, res) => {
  res.json({ message: "Job-Hunt API is running.", docs: "/api-docs" });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/user", userRoute);
app.use("/api/company", companyRoute);
app.use("/api/job", jobRoute);
app.use("/api/application", applicationRoute);

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5001;

connectDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
