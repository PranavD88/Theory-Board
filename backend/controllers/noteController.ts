import { Request, Response } from "express";
import pool from "../db";

// Create a new note
export const createNote = async (req: Request, res: Response) => { 
    try {
        const { title, content } = req.body;
        const userId = req.userId; // Ensure userId is available from authMiddleware

        if (!title.trim()) {
            res.status(400).json({ error: "Title is required" });
            return;
        }

        const result = await pool.query(
            "INSERT INTO notes (title, content, user_id) VALUES ($1, $2, $3) RETURNING *",
            [title, content || null, userId]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Error creating note:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Get a single note by ID
export const getNote = async (req: Request, res: Response) => {
    try {
        const noteId = parseInt(req.params.id, 10);
        const userId = req.userId;

        if (isNaN(noteId)) {
            res.status(400).json({ error: "Invalid note ID" });
            return;
        }

        const result = await pool.query("SELECT * FROM notes WHERE id = $1 AND user_id = $2", [noteId, userId]);

        if (result.rows.length === 0) {
            res.status(404).json({ error: "Note not found or unauthorized" });
            return;
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error retrieving note:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Get all notes (only the logged-in user's notes)
export const getAllNotes = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const result = await pool.query(
            "SELECT * FROM notes WHERE user_id = $1 ORDER BY created_at DESC",
            [userId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error("Error retrieving notes:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Link two notes together
export const linkNotes = async (req: Request, res: Response) => {
    try {
        const { from_note_id, to_note_id } = req.body;
        const userId = req.userId;

        if (!from_note_id || !to_note_id || from_note_id === to_note_id) {
            res.status(400).json({ error: "Invalid note IDs" });
            return;
        }

        // Ensure both notes belong to the logged-in user
        const fromNote = await pool.query("SELECT id FROM notes WHERE id = $1 AND user_id = $2", [from_note_id, userId]);
        const toNote = await pool.query("SELECT id FROM notes WHERE id = $1 AND user_id = $2", [to_note_id, userId]);

        if (fromNote.rows.length === 0 || toNote.rows.length === 0) {
            res.status(400).json({ error: "One or both notes do not exist or unauthorized" });
            return;
        }

        // Check if the link already exists
        const existingLink = await pool.query(
            "SELECT id FROM note_links WHERE from_note_id = $1 AND to_note_id = $2",
            [from_note_id, to_note_id]
        );

        if (existingLink.rows.length > 0) {
            res.status(400).json({ error: "Link already exists" });
            return;
        }

        // Insert into note_links table
        await pool.query(
            "INSERT INTO note_links (from_note_id, to_note_id) VALUES ($1, $2)",
            [from_note_id, to_note_id]
        );

        res.json({ message: "Notes linked successfully" });
    } catch (error) {
        console.error("Error linking notes:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Get all notes with their connections
export const getGraphData = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;

        const notes = await pool.query("SELECT id, title FROM notes WHERE user_id = $1", [userId]);

        const links = await pool.query(
            "SELECT from_note_id, to_note_id FROM note_links WHERE from_note_id IN (SELECT id FROM notes WHERE user_id = $1) OR to_note_id IN (SELECT id FROM notes WHERE user_id = $1)",
            [userId]
        );

        res.json({ nodes: notes.rows, links: links.rows });
    } catch (error) {
        console.error("Error retrieving graph data:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Delete a note and its connections
export const deleteNote = async (req: Request, res: Response) => {
    try {
        const noteId = parseInt(req.params.id, 10);
        const userId = req.userId;

        if (isNaN(noteId)) {
            res.status(400).json({ error: "Invalid note ID" });
            return;
        }

        // Ensure note belongs to the logged-in user
        const note = await pool.query("SELECT id FROM notes WHERE id = $1 AND user_id = $2", [noteId, userId]);

        if (note.rows.length === 0) {
            res.status(403).json({ error: "Unauthorized or note does not exist" });
            return;
        }

        // Delete note and its links
        await pool.query("DELETE FROM note_links WHERE from_note_id = $1 OR to_note_id = $1", [noteId]);
        await pool.query("DELETE FROM notes WHERE id = $1", [noteId]);

        res.json({ message: "Note deleted successfully" });
    } catch (error) {
        console.error("Error deleting note:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
