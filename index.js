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
  // Function form lets us allow requests with no Origin header (Postman, curl)
  // while still blocking unknown browser origins.
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error("CORS: origin " + origin + " not allowed"));
  },
  credentials: true,       // required for cookies to be sent cross-origin
  optionsSuccessStatus: 200, // some legacy browsers choke on 204
};

app.use(cors(corsOptions));

// ── API Documentation ─────────────────────────────────────────────────────────
setupSwagger(app);


// ── Env diagnostics (safe — shows SET/MISSING only, never values) ─────────────
app.get('/health', (_req, res) => {
  const required = ['MONGO_URI','JWT_SECRET','EMAIL_USER','EMAIL_PASS','CLOUD_NAME','CLOUD_API','API_SECRET'];
  const optional = ['AI_BASE_URL','AI_API_KEY','AI_MODEL','NODE_ENV'];
  const check = (keys) => Object.fromEntries(keys.map(k => [k, process.env[k] ? 'SET' : 'MISSING']));
  res.json({
    status: 'ok',
    node_env: process.env.NODE_ENV || 'undefined',
    required: check(required),
    optional: check(optional),
  });
});


// ── SMTP connection test (remove after debugging) ─────────────────────────────
app.get('/test-smtp', async (_req, res) => {
  try {
    const nodemailer = (await import('nodemailer')).default;
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;
    const t = nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });
    await t.verify();
    res.json({ ok: true, user, passLength: pass.length });
  } catch(e) {
    res.json({ ok: false, error: e.message, code: e.code });
  }
});


// ── Register flow debug (remove after fix confirmed) ──────────────────────────
app.post('/test-register', async (req, res) => {
  try {
    const { User } = await import('./models/user.model.js');
    const bcrypt = (await import('bcryptjs')).default;
    const { sendOtpEmail } = await import('./utils/mailer.js');

    const { fullname='Test User', email='test@devtest.dev', phoneNumber='01999000000', password='test123', role='Student' } = req.body;

    // Step-by-step with individual try/catch to pinpoint failure
    let step = 'findEmail';
    const existing = await User.findOne({ email });
    if (existing) return res.json({ ok: false, step, detail: 'email exists' });

    step = 'hashPassword';
    const hash = await bcrypt.hash(password, 10);

    step = 'createUser';
    const otp = '123456';
    const u = new User({ fullname, email, phoneNumber, password: hash, role, isVerified: false, otp, otpExpiry: new Date(Date.now() + 600000) });

    step = 'saveUser';
    await u.save();

    step = 'sendEmail';
    await sendOtpEmail(email, otp);

    // cleanup
    await User.deleteOne({ _id: u._id });
    res.json({ ok: true, message: 'All steps passed' });
  } catch(e) {
    res.json({ ok: false, step: 'unknown', error: e.message, code: e.code, kind: e.name });
  }
});

// Health check
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
