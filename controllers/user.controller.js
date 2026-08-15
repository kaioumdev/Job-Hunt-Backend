import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloud.js";
import { sendOtpEmail } from "../utils/mailer.js";

// make a random 6 digit OTP as a string
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

export const register = async (req, res) => {
  try {
    const { fullname, email, phoneNumber, password, role, termsAcceptedAt } = req.body;

    if (!fullname || !email || !phoneNumber || !password || !role) {
      return res.status(400).json({
        message: "Missing required fields",
        success: false,
      });
    }

    // ── profile photo upload (optional) ──────────────────────────────────
    const file = req.file;
    let cloudResponse;
    if (file) {
      try {
        const fileUri = getDataUri(file);
        cloudResponse = await cloudinary.uploader.upload(fileUri.content);
      } catch (uploadError) {
        console.error("Cloudinary upload failed:", uploadError.message);
        // photo upload failure should not block registration
      }
    }

    // ── duplicate email check ─────────────────────────────────────────────
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "Email already exists",
        success: false,
      });
    }

    // ── duplicate phone check ─────────────────────────────────────────────
    const existingPhone = await User.findOne({ phoneNumber });
    if (existingPhone) {
      return res.status(400).json({
        message: "Phone number already registered",
        success: false,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    const newUser = new User({
      fullname,
      email,
      phoneNumber,
      password: hashedPassword,
      role,
      termsAcceptedAt: termsAcceptedAt || null,
      isVerified: false,
      otp,
      otpExpiry,
      profile: {
        profilePhoto: cloudResponse?.secure_url || "",
      },
    });

    await newUser.save();

    // ── send OTP — rollback user if email fails ───────────────────────────
    try {
      await sendOtpEmail(email, otp);
    } catch (mailError) {
      console.error("OTP email failed:", mailError.message);
      await User.deleteOne({ _id: newUser._id });
      return res.status(500).json({
        message: "Could not send verification email. Please check your email address and try again.",
        success: false,
      });
    }

    return res.status(200).json({
      message: "OTP sent to your email. Please verify to continue.",
      email,
      success: true,
    });
  } catch (error) {
    console.error("Register error:", error.message, error.stack);
    return res.status(500).json({
      message: "Server Error registering user",
      success: false,
    });
  }
};

// Verify the OTP the user received on email
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: "Email and OTP are required",
        success: false,
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found", success: false });
    }

    if (user.isVerified) {
      return res.status(400).json({
        message: "Email is already verified. Please login.",
        success: false,
      });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP", success: false });
    }

    if (!user.otpExpiry || user.otpExpiry < new Date()) {
      return res.status(400).json({
        message: "OTP has expired. Please request a new one.",
        success: false,
      });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    // log the user in right away so they don't have to login again
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    const safeUser = {
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      profile: user.profile,
    };

    return res
      .status(200)
      .cookie("token", token, {
        maxAge: 1 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "Strict",
      })
      .json({
        message: "Email verified successfully.",
        user: safeUser,
        success: true,
      });
  } catch (error) {
    console.error("VerifyOTP error:", error.message);
    return res.status(500).json({ message: "Server Error verifying OTP", success: false });
  }
};

// Send an OTP to reset the password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required", success: false });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        message: "No account found with this email",
        success: false,
      });
    }

    const otp = generateOtp();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendOtpEmail(email, otp);

    return res.status(200).json({
      message: "OTP sent to your email.",
      success: true,
    });
  } catch (error) {
    console.error("ForgotPassword error:", error.message);
    return res.status(500).json({ message: "Server Error sending OTP", success: false });
  }
};

// Verify the OTP and set the new password
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "All fields are required", success: false });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
        success: false,
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found", success: false });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP", success: false });
    }

    if (!user.otpExpiry || user.otpExpiry < new Date()) {
      return res.status(400).json({
        message: "OTP has expired. Please request a new one.",
        success: false,
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.otp = undefined;
    user.otpExpiry = undefined;
    user.isVerified = true;
    await user.save();

    return res.status(200).json({
      message: "Password changed successfully. Please login.",
      success: true,
    });
  } catch (error) {
    console.error("ResetPassword error:", error.message);
    return res.status(500).json({ message: "Server Error resetting password", success: false });
  }
};

// Resend a fresh OTP if the old one expired or got lost
export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required", success: false });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found", success: false });
    }

    if (user.isVerified) {
      return res.status(400).json({
        message: "Email is already verified. Please login.",
        success: false,
      });
    }

    const otp = generateOtp();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendOtpEmail(email, otp);

    return res.status(200).json({
      message: "A new OTP has been sent to your email.",
      success: true,
    });
  } catch (error) {
    console.error("ResendOTP error:", error.message);
    return res.status(500).json({ message: "Server Error resending OTP", success: false });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        message: "Missing required fields",
        success: false,
      });
    }

    let user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        message: "Incorrect email or password",
        success: false,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        message: "Incorrect email or password",
        success: false,
      });
    }

    // block login until the email is verified via OTP
    if (!user.isVerified) {
      return res.status(403).json({
        message: "Please verify your email before logging in.",
        needVerification: true,
        email: user.email,
        success: false,
      });
    }

    if (user.role !== role) {
      return res.status(403).json({
        message: "You don't have the necessary role to access this resource",
        success: false,
      });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    const safeUser = {
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      profile: user.profile,
    };

    return res
      .status(200)
      .cookie("token", token, {
        maxAge: 1 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "Strict",
      })
      .json({
        message: `Welcome back ${safeUser.fullname}`,
        user: safeUser,
        success: true,
      });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({
      message: "Server Error login failed",
      success: false,
    });
  }
};

export const logout = async (req, res) => {
  try {
    return res.status(200).cookie("token", "", { maxAge: 0 }).json({
      message: "Logged out successfully.",
      success: true,
    });
  } catch (error) {
    console.error("Logout error:", error.message);
    return res.status(500).json({ message: "Server Error", success: false });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { fullname, email, phoneNumber, bio, skills, resume } = req.body;
    const file = req.file;

    let cloudResponse;
    if (file) {
      try {
        const fileUri = getDataUri(file);
        cloudResponse = await cloudinary.uploader.upload(fileUri.content);
      } catch (uploadError) {
        console.error("Cloudinary upload failed:", uploadError.message);
        return res.status(500).json({
          message: "Failed to upload profile photo. Please try again.",
          success: false,
        });
      }
    }

    const userId = req.id;
    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    if (fullname)     user.fullname          = fullname;
    if (email)        user.email             = email;
    if (phoneNumber)  user.phoneNumber       = phoneNumber;
    if (bio)          user.profile.bio       = bio;
    if (skills)       user.profile.skills    = skills.split(",").map((s) => s.trim());
    if (resume)       user.profile.resume    = resume;
    if (cloudResponse) user.profile.profilePhoto = cloudResponse.secure_url;

    await user.save();

    const safeUser = {
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      profile: user.profile,
    };

    return res.status(200).json({
      message: "Profile updated successfully",
      user: safeUser,
      success: true,
    });
  } catch (error) {
    console.error("UpdateProfile error:", error.message);
    return res.status(500).json({
      message: "Server Error updating profile",
      success: false,
    });
  }
};
