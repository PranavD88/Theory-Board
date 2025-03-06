import express from "express";
import { register, login, logout, getUser } from "../controllers/authController";
import authMiddleware from "../middleware/authMiddleware";

console.log("authRoutes loaded");

const router = express.Router();

router.get("/test", (req, res) => {
  console.log("Test route was hit!");
  res.json({ message: "Test route works!" });
});

router.post("/register", (req, res) => register(req, res));
router.post("/login", (req, res) => login(req, res));
router.post("/logout", (req, res) => logout(req, res));
router.get("/user", authMiddleware, (req, res) => getUser(req, res));

export default router;
