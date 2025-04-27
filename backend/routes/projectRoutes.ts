import express from "express";
import {
  createProject,
  getProjects,
  deleteProject,
} from "../controllers/projectControllers";
import authMiddleware from "../middleware/authMiddleware";

const router = express.Router();

router.post("/", authMiddleware, createProject);
router.get("/", authMiddleware, getProjects);
router.delete("/:projectId", authMiddleware, deleteProject);

export default router;