import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullname:    { type: String, required: true },
    email:       { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: true, unique: true },
    password:    { type: String, required: true },
    role: {
      type: String,
      enum: ["Student", "Recruiter"],
      default: "Student",
      required: true,
    },
    isVerified:  { type: Boolean, default: false },
    otp:         { type: String },
    otpExpiry:   { type: Date },
    termsAcceptedAt: { type: Date },   // root-level field, not inside profile
    profile: {
      bio:          { type: String },
      skills:       [{ type: String }],
      resume:       { type: String },  // Cloudinary URL
      profilePhoto: { type: String, default: "" },
      company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
      },
    },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
