import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../db";

const JWT_SECRET = process.env.JWT_SECRET as string;

// Register User
const register = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("Register endpoint hit");

    const { name, email, password } = req.body;
    console.log("Received Data:", { name, email, password });

    // Validate input
    if (!name || !email || !password) {
      console.log("Missing fields");
      res.status(400).json({ message: "All fields are required" });
      return;
    }

    // Check if user already exists
    const userExists = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    console.log("Checking if user exists:", userExists.rows);

    if (userExists.rows.length > 0) {
      console.log("User already exists");
      res.status(400).json({ message: "User already exists" });
      return;
    }

    // Hash password
    console.log("Hashing password...");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log("Password hashed successfully");

    // Insert user into database
    console.log("Inserting new user into database...");
    const newUser = await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email",
      [name, email, hashedPassword]
    );

    console.log("User registered successfully:", newUser.rows[0]);
    res.status(201).json(newUser.rows[0]); // Return user data
  } catch (error) {
    console.error("Register error:", error);  // Log the actual error message
    res.status(500).json({ message: "Server error" });
  }
};

// Login User
const login = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("Login endpoint hit");

    const { email, password } = req.body;
    console.log("Received Data:", { email });

    // Validate input
    if (!email || !password) {
      console.log("Missing fields");
      res.status(400).json({ message: "All fields are required" });
      return;
    }

    // Find user in database
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    console.log("User found in DB:", user.rows);

    if (user.rows.length === 0) {
      console.log("Invalid credentials - user not found");
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }

    // Compare password
    console.log("Comparing passwords...");
    const isMatch = await bcrypt.compare(password, user.rows[0].password);
    if (!isMatch) {
      console.log("Invalid credentials - incorrect password");
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }

    // Generate JWT token
    console.log("Generating JWT...");
    const token = jwt.sign({ userId: user.rows[0].id }, JWT_SECRET, { expiresIn: "1h" });

    // Send token as HTTP-only cookie
    console.log("Setting cookie...");
    res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "none" });
    console.log("Login successful");
    res.json({ message: "Login successful" });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get Logged-in User
const getUser = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("Fetching user data for user ID:", req.userId);
    const user = await pool.query("SELECT id, name, email FROM users WHERE id = $1", [req.userId]);

    if (user.rows.length === 0) {
      console.log("User not found");
      res.status(404).json({ message: "User not found" });
      return;
    }

    console.log("User data retrieved:", user.rows[0]);
    res.json(user.rows[0]);
  } catch (error) {
    console.error("Get User error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Logout User
const logout = (req: Request, res: Response): void => {
  res.clearCookie("token", { httpOnly: true, secure: true, sameSite: "none" });
  res.status(200).json({ message: "Logged out successfully" });
};
export { register, login, getUser, logout };
