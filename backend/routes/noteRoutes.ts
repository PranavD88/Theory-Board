import express, { Request, Response } from "express";
import pool from "../db";
import authMiddleware from "../middleware/authMiddleware";
import { createNote, getNote, getAllNotes, linkNotes, getGraphData, deleteNote } from "../controllers/noteController";

const router = express.Router();

// Get user's saved note
router.get("/", authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.userId;
        const result = await pool.query("SELECT content FROM notes WHERE user_id = $1", [userId]);

        res.json({ content: result.rows.length > 0 ? result.rows[0].content : "" });
    } catch (error) {
        console.error("Error fetching note:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Save or update user's note
router.post("/", authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.userId;
        const { content } = req.body;

        const existingNote = await pool.query("SELECT * FROM notes WHERE user_id = $1", [userId]);

        if (existingNote.rows.length > 0) {
            await pool.query("UPDATE notes SET content = $1 WHERE user_id = $2", [content, userId]);
        } else {
            await pool.query("INSERT INTO notes (user_id, content) VALUES ($1, $2)", [userId, content]);
        }

        res.json({ message: "Note saved successfully" });
    } catch (error) {
        console.error("Error saving note:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Graph-based note system (New Endpoints)
router.post("/create", createNote);
router.get("/all", getAllNotes);
router.get("/graph", getGraphData);
router.post("/link", linkNotes);
router.get("/:id", getNote);
router.delete("/:id", deleteNote);

export default router;
