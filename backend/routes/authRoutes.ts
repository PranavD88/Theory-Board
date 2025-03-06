import express from "express";
import { register, login, logout, getUser } from "../controllers/authController";
import authMiddleware from "../middleware/authMiddleware";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/user", authMiddleware, getUser);

export default router;