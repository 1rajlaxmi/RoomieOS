import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/User";

// 1. Extend the Express Request interface
export interface AuthRequest extends Request {
  user?: IUser | null;
}

// 2. The Protection Middleware
export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  let token;

  // Check if the authorization header exists and starts with "Bearer"
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Extract the token (Format: "Bearer eyJhbGci...")
      token = req.headers.authorization.split(" ")[1];

      // Verify the token using your secret key
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      ) as { id: string };

      // Find the user in the database by the ID inside the token
      req.user = await User.findById(decoded.id).select("-password");

      // ✅ FIXED: Add 'return' to immediately stop execution here so it never falls through!
      return next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: "Not authorized, token failed" });
      return; // ✅ FIXED: Stop execution after sending an error response
    }
  }

  // If no token was found in the headers at all
  if (!token) {
    res.status(401).json({ message: "Not authorized, no token provided" });
    return; // ✅ FIXED: Guardrail return for safety uniformity
  }
};