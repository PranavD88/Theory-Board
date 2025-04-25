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
    const { projectId } = req.query;

    let query = "SELECT id, title, content, project_id, x, y, tags FROM notes WHERE user_id = $1";
    const values: any[] = [userId];

    if (projectId) {
      query += " AND project_id = $2";
      values.push(projectId);
    }

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching user's notes:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId;
      const { title, content, projectId, tags } = req.body;
  
      if (!title.trim()) {
        res.status(400).json({ message: "Title is required" });
        return;
      }
  
      const existingNote = await pool.query(
        "SELECT * FROM notes WHERE user_id = $1 AND title = $2 AND project_id = $3",
        [userId, title, projectId]
      );
  
      if (existingNote.rows.length > 0) {
        const updatedNote = await pool.query(
          "UPDATE notes SET content = $1 WHERE user_id = $2 AND title = $3 AND project_id = $4 RETURNING *",
          [content, userId, title, projectId]
        );
        res.json(updatedNote.rows[0]);
      } else {
        const newNote = await pool.query(
          "INSERT INTO notes (user_id, title, content, project_id, tags) VALUES ($1, $2, $3, $4, $5) RETURNING *",
          [userId, title, content, projectId, tags ?? []]
        );
        res.status(201).json(newNote.rows[0]);
      }
    } catch (error) {
      console.error("Error saving note:", error);
      res.status(500).json({ message: "Server error" });
    }
});

router.put("/position/:id", authMiddleware, async (req, res): Promise<void> => {
  const noteId = parseInt(req.params.id);
  const { x, y } = req.body;

  if (isNaN(noteId) || typeof x !== "number" || typeof y !== "number") {
    res.status(400).json({ error: "Invalid data" });
    return;
  }

  try {
    await pool.query("UPDATE notes SET x = $1, y = $2 WHERE id = $3", [x, y, noteId]);
    res.end();
  } catch (err) {
    console.error("Error updating position:", err);
    res.status(500).json({ error: "Database error" });
  }
});

router.get("/graph", authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId;
      const { projectId } = req.query;
  
      if (!projectId) {
        res.status(400).json({ error: "Missing projectId" });
        return;
      }
  
      const notes = await pool.query(
        "SELECT id, title, x, y FROM notes WHERE user_id = $1 AND project_id = $2",
        [userId, projectId]
      );
  
      const links = await pool.query(
        `SELECT from_note_id, to_note_id 
         FROM note_links 
         WHERE from_note_id IN (
           SELECT id FROM notes WHERE user_id = $1 AND project_id = $2
         ) 
         OR to_note_id IN (
           SELECT id FROM notes WHERE user_id = $1 AND project_id = $2
         )`,
        [userId, projectId]
      );
  
      res.json({ nodes: notes.rows, links: links.rows });
      return;
    } catch (error) {
      console.error("Error retrieving project-scoped graph:", error);
      res.status(500).json({ error: "Internal Server Error" });
      return;
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
