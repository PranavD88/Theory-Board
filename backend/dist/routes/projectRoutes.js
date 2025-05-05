"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const projectControllers_1 = require("../controllers/projectControllers");
const authMiddleware_1 = __importDefault(require("../middleware/authMiddleware"));
const router = express_1.default.Router();
router.post("/", authMiddleware_1.default, projectControllers_1.createProject);
router.get("/", authMiddleware_1.default, projectControllers_1.getProjects);
router.delete("/:projectId", authMiddleware_1.default, projectControllers_1.deleteProject);
exports.default = router;
