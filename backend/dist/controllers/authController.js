"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.getUser = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("../db"));
const JWT_SECRET = process.env.JWT_SECRET;
// Register User
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const userExists = yield db_1.default.query("SELECT * FROM users WHERE email = $1", [email]);
        console.log("Checking if user exists:", userExists.rows);
        if (userExists.rows.length > 0) {
            console.log("User already exists");
            res.status(400).json({ message: "User already exists" });
            return;
        }
        // Hash password
        console.log("Hashing password...");
        const salt = yield bcryptjs_1.default.genSalt(10);
        const hashedPassword = yield bcryptjs_1.default.hash(password, salt);
        console.log("Password hashed successfully");
        // Insert user into database
        console.log("Inserting new user into database...");
        const newUser = yield db_1.default.query("INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email", [name, email, hashedPassword]);
        console.log("User registered successfully:", newUser.rows[0]);
        res.status(201).json(newUser.rows[0]); // Return user data
    }
    catch (error) {
        console.error("Register error:", error); // Log the actual error message
        res.status(500).json({ message: "Server error" });
    }
});
exports.register = register;
// Login User
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const user = yield db_1.default.query("SELECT * FROM users WHERE email = $1", [email]);
        console.log("User found in DB:", user.rows);
        if (user.rows.length === 0) {
            console.log("Invalid credentials - user not found");
            res.status(400).json({ message: "Invalid credentials" });
            return;
        }
        // Compare password
        console.log("Comparing passwords...");
        const isMatch = yield bcryptjs_1.default.compare(password, user.rows[0].password);
        if (!isMatch) {
            console.log("Invalid credentials - incorrect password");
            res.status(400).json({ message: "Invalid credentials" });
            return;
        }
        // Generate JWT token
        console.log("Generating JWT...");
        const token = jsonwebtoken_1.default.sign({ userId: user.rows[0].id }, JWT_SECRET, { expiresIn: "1h" });
        // Send token as HTTP-only cookie
        console.log("Setting cookie...");
        res.cookie("token", token, { httpOnly: true, secure: false, sameSite: "strict" });
        console.log("Login successful");
        res.json({ message: "Login successful" });
    }
    catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Server error" });
    }
});
exports.login = login;
// Get Logged-in User
const getUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("Fetching user data for user ID:", req.userId);
        const user = yield db_1.default.query("SELECT id, name, email FROM users WHERE id = $1", [req.userId]);
        if (user.rows.length === 0) {
            console.log("User not found");
            res.status(404).json({ message: "User not found" });
            return;
        }
        console.log("User data retrieved:", user.rows[0]);
        res.json(user.rows[0]);
    }
    catch (error) {
        console.error("Get User error:", error);
        res.status(500).json({ message: "Server error" });
    }
});
exports.getUser = getUser;
// Logout User
const logout = (req, res) => {
    res.clearCookie("token", { httpOnly: true, secure: false, sameSite: "strict" });
    res.status(200).json({ message: "Logged out successfully" });
};
exports.logout = logout;
