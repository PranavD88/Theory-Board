import express, { Request, Response } from "express";
import pool from "../db";
import authMiddleware from "../middleware/authMiddleware";
import { 
  createNote, 
  getNote, 
  getAllNotes, 
  linkNotes, 
  getGraphData, 
  deleteNote, 
  updateNote, 
  unlinkNotes, 
  importPdf,
  importDocx,
  exportNoteAsPDF,
  exportNoteAsDOCX
} from "../controllers/noteController";
import multer from "multer";

const upload = multer({ dest: "uploads/" });
const router = express.Router();

router.get("/", authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.userId;
        const result = await pool.query("SELECT id, title, content FROM notes WHERE user_id = $1", [userId]);
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching user's notes:", error);
        res.status(500).json({ message: "Server error" });
    }
});

router.post("/", authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.userId;
        const { title, content } = req.body;

        if (!title.trim()) {
            res.status(400).json({ message: "Title is required" });
            return;
        }

        const existingNote = await pool.query("SELECT * FROM notes WHERE user_id = $1 AND title = $2", [userId, title]);

        if (existingNote.rows.length > 0) {
            await pool.query("UPDATE notes SET content = $1 WHERE user_id = $2 AND title = $3", [content, userId, title]);
            res.json({ message: "Note updated successfully" });
        } else {
            await pool.query("INSERT INTO notes (user_id, title, content) VALUES ($1, $2, $3)", [userId, title, content]);
            res.json({ message: "Note created successfully" });
        }
    } catch (error) {
        console.error("Error saving note:", error);
        res.status(500).json({ message: "Server error" });
    }
});

router.post("/import/pdf", authMiddleware, upload.single("file"), importPdf);
router.post("/import/docx", authMiddleware, upload.single("file"), importDocx);
router.get("/export/pdf/:id", authMiddleware, exportNoteAsPDF);
router.get("/export/docx/:id", authMiddleware, exportNoteAsDOCX);
router.put("/:id", authMiddleware, updateNote);
router.get("/graph", authMiddleware, getGraphData);
router.post("/create", authMiddleware, createNote);
router.get("/all", authMiddleware, getAllNotes);
router.post("/link", authMiddleware, linkNotes);
router.delete("/unlink", authMiddleware, unlinkNotes);
router.get("/:id", authMiddleware, getNote);
router.delete("/:id", authMiddleware, deleteNote);

export default router;
