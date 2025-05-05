"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const authMiddleware_1 = __importDefault(require("../middleware/authMiddleware"));
console.log("authRoutes loaded");
const router = express_1.default.Router();
router.get("/test", (req, res) => {
    console.log("Test route was hit!");
    res.json({ message: "Test route works!" });
});
router.post("/register", (req, res) => (0, authController_1.register)(req, res));
router.post("/login", (req, res) => (0, authController_1.login)(req, res));
router.post("/logout", (req, res) => (0, authController_1.logout)(req, res));
router.get("/user", authMiddleware_1.default, (req, res) => (0, authController_1.getUser)(req, res));
exports.default = router;
