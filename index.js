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

const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
};

app.use(cors(corsOptions));

// ── API Documentation (available in all environments) ────────────────────────
setupSwagger(app);

app.get('/', (req, res) => {
    res.send('Job-Hunt — API docs available at /api-docs');
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/user", userRoute);
app.use("/api/company", companyRoute);
app.use("/api/job", jobRoute);
app.use("/api/application", applicationRoute);

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  connectDB();
  console.log(`Server running on port ${PORT}`);
});
