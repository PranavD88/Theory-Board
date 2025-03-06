import express from "express";
import pool from "../db";
import authMiddleware from "../middleware/authMiddleware";

const router = express.Router();

// Get the user's saved note
router.get("/", authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const result = await pool.query("SELECT content FROM notes WHERE user_id = $1", [userId]);
        res.json({ content: result.rows[0]?.content || "" });
    } catch (error) {
        console.error("Error fetching note:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Save or update the user's note
router.post("/", authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const { content } = req.body;

        // Check if note exists
        const existingNote = await pool.query("SELECT * FROM notes WHERE user_id = $1", [userId]);

        if (existingNote.rows.length > 0) {
            // Update existing note
            await pool.query("UPDATE notes SET content = $1 WHERE user_id = $2", [content, userId]);
        } else {
            // Insert new note
            await pool.query("INSERT INTO notes (user_id, content) VALUES ($1, $2)", [userId, content]);
        }

        res.json({ message: "Note saved successfully" });
    } catch (error) {
        console.error("Error saving note:", error);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;
