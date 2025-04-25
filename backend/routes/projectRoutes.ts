import express from "express";
import {
  createProject,
  getProjects,
  deleteProject,
} from "../controllers/projectControllers";
import authenticateToken from "../middleware/authMiddleware";

const router = express.Router();

router.post("/", authenticateToken, createProject);
router.get("/", authenticateToken, getProjects);
router.delete("/:projectId", authenticateToken, deleteProject);

export default router;