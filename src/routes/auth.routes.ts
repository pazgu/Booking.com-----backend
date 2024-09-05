import express from "express";
import {
  checkEmail,
  login,
  register,
  getLoggedInUser,
} from "../controllers/auth.controller";
import { verifyToken } from "../middleware/auth.middleware"; // Assuming you have an auth middleware
import { verifyGoogle, signWithGoogle } from "../controllers/google.controller"; // Import the Google controllers

const router = express.Router();

// Check if email exists
router.post("/check-email", checkEmail);

// Login route
router.post("/login", login);

// Register route
router.post("/register", register);

// Get the logged-in user's information
router.get("/me", verifyToken, getLoggedInUser);

// Google Login route (handles both login and registration with Google credentials)
router.post("/google", verifyGoogle, signWithGoogle);

export default router;
