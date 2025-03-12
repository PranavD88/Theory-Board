import express, { Request, Response } from "express";
import pool from "../db";
import authMiddleware from "../middleware/authMiddleware";
import { createNote, getNote, getAllNotes, linkNotes, getGraphData, deleteNote, updateNote } from "../controllers/noteController";

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

router.put("/:id", authMiddleware, updateNote);

router.get("/graph", authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.userId;

        const nodesQuery = await pool.query("SELECT id, title FROM notes WHERE user_id = $1", [userId]);

        const linksQuery = await pool.query(
            `SELECT from_note_id, to_note_id 
             FROM note_links 
             WHERE from_note_id IN (SELECT id FROM notes WHERE user_id = $1) 
             OR to_note_id IN (SELECT id FROM notes WHERE user_id = $1)`,
            [userId]
        );

        res.json({
            nodes: nodesQuery.rows,
            links: linksQuery.rows,
        });
    } catch (error) {
        console.error("Error fetching graph data:", error);
        res.status(500).json({ message: "Server error" });
    }
});

router.post("/create", authMiddleware, createNote);
router.get("/all", authMiddleware, getAllNotes);
router.get("/graph", authMiddleware, getGraphData);
router.post("/link", authMiddleware, linkNotes);
router.get("/:id", authMiddleware, getNote);
router.delete("/:id", authMiddleware, deleteNote);

export default router;
