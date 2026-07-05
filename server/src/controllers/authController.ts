import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";
import crypto from "crypto";
import nodemailer from "nodemailer";
import bcrypt from "bcrypt"; // ✅ FIXED: Changed "bcrypt.js" to "bcrypt"

// Helper function to generate JWT
const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET as string, {
    expiresIn: "30d", // Token expires in 30 days
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    // --- NEW: PASSWORD RESTRICTION RULES ---
    if (password.length < 8) {
      res.status(400).json({ message: "Password must be at least 8 characters long." });
      return;
    }

    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);

    if (!hasLetter || !hasNumber) {
      res.status(400).json({ message: "Password must contain both letters and numbers." });
      return;
    }
    // ----------------------------------------

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    // Create user
    const user = await User.create({ name, email, password });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id.toString()),
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error during registration", error });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });

    // Check if user exists AND password matches
    if (user && (await user.comparePassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id.toString()),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error during login", error });
  }
};

// @desc    Send Reset Link Email
// @route   POST /api/auth/forgot-password
// ✅ FIXED: Changed to ES Modules named export and added explicit TypeScript types
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      res.status(200).json({ message: "If that email exists, a reset link has been sent." });
      return;
    }

    // Generate temporary token
    const rawToken = crypto.randomBytes(32).toString('hex');

    // Hash token and save to database with 1-hour expiration
    user.resetPasswordToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour from now
    await user.save();

    // Configure your email transporter
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${rawToken}`;

    const mailOptions = {
      to: user.email,
      from: process.env.EMAIL_USER,
      subject: 'RoomieOS - Password Reset Request',
      text: `You are receiving this because you (or someone else) requested a password reset for your account.\n\n
             Please click on the following link, or paste it into your browser to complete the process within one hour:\n\n
             ${resetUrl}\n\n
             If you did not request this, please ignore this email and your password will remain unchanged.\n`
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "If that email exists, a reset link has been sent." });

  } catch (err: any) { // ✅ FIXED: Added explicit 'any' catch type definition
    res.status(500).json({ message: "Error processing forgot password request.", error: err.message });
  }
};

// @desc    Process Password Reset
// @route   PUT /api/auth/reset-password/:token
// ✅ FIXED: Changed to ES Modules named export and added explicit TypeScript types
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.params.token as string;
    const { password } = req.body;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find valid user where token matches and has NOT expired
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      res.status(400).json({ message: "Password reset token is invalid or has expired." });
      return;
    }

    // Set and encrypt the new password (uses your pre-save salt hook natively)
    user.password = password;

    // Clear out the token fields so they can't be reused
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.status(200).json({ message: "Password has been successfully updated! You can now log in." });

  } catch (err: any) { // ✅ FIXED: Added explicit 'any' catch type definition
    res.status(500).json({ message: "Error resetting password.", error: err.message });
  }
};