import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../db";

// Load environment variables
const JWT_SECRET = process.env.JWT_SECRET as string;

// Register User
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    // Existing User Checker
    const userExists = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userExists.rows.length > 0) return res.status(400).json({ message: "User already exists" });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user into database
    const newUser = await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email",
      [name, email, hashedPassword]
    );

    res.status(201).json(newUser.rows[0]); // Return user data
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Login User
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user in database
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (user.rows.length === 0) return res.status(400).json({ message: "Invalid credentials" });

    // Compare password
    const isMatch = await bcrypt.compare(password, user.rows[0].password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // Generate JWT token
    const token = jwt.sign({ userId: user.rows[0].id }, JWT_SECRET, { expiresIn: "1h" });

    // Send token as HTTP-only cookie
    res.cookie("token", token, { httpOnly: true, secure: false, sameSite: "strict" });
    res.json({ message: "Login successful" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get Logged-in User
export const getUser = async (req: Request, res: Response) => {
  try {
    const user = await pool.query("SELECT id, name, email FROM users WHERE id = $1", [req.userId]);
    if (user.rows.length === 0) return res.status(404).json({ message: "User not found" });

    res.json(user.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Logout User
export const logout = (req: Request, res: Response) => {
  res.clearCookie("token");
  res.json({ message: "Logged out successfully" });
};
