import { Request, Response } from "express";
import pool from "../db";
import fs from "fs";
import pdfParse from "pdf-parse";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import * as mammoth from "mammoth";
import PDFDocument from "pdfkit";


// Create a new note
export const createNote = async (req: Request, res: Response) => { 
    try {
        const { title, content, tags } = req.body;
        console.log("CREATING NOTE WITH TAGS:", tags);
        const userId = req.userId;

        if (!title.trim()) {
            res.status(400).json({ error: "Title is required" });
            return;
        }

        const result = await pool.query(
            "INSERT INTO notes (title, content, user_id, tags) VALUES ($1, $2, $3, $4) RETURNING *",
            [title, content || null, userId, Array.isArray(tags) ? tags : []]
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

        const result = await pool.query(
            "SELECT id, title, content, tags FROM notes WHERE id = $1 AND user_id = $2",
            [noteId, userId]
          );

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

// Get all notes
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

// Update an existing note
export const updateNote = async (req: Request, res: Response) => {
    try {
        const noteId = parseInt(req.params.id, 10);
        const userId = req.userId;
        const { title, content, tags } = req.body;

        if (isNaN(noteId)) {
            res.status(400).json({ error: "Invalid note ID" });
            return;
        }

        const existingNote = await pool.query("SELECT * FROM notes WHERE id = $1 AND user_id = $2", [noteId, userId]);

        if (existingNote.rows.length === 0) {
            res.status(404).json({ error: "Note not found or unauthorized" });
            return;
        }

        // Update the note including the tags column
        await pool.query(
            "UPDATE notes SET title = $1, content = $2, tags = $3 WHERE id = $4 AND user_id = $5",
            [title, content, tags || [], noteId, userId]
        );

        res.json({ message: "Note updated successfully" });
    } catch (error) {
        console.error("Error updating note:", error);
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

// Unlink two notes
export const unlinkNotes = async (req: Request, res: Response) => {
    try {
        const fromNoteId = parseInt(req.query.from_note_id as string, 10);
        const toNoteId = parseInt(req.query.to_note_id as string, 10);
        const userId = req.userId;

        if (isNaN(fromNoteId) || isNaN(toNoteId)) {
            res.status(400).json({ error: "Invalid note IDs" });
            return;
        }

        // Ensure both notes belong to the logged-in user
        const fromNote = await pool.query("SELECT id FROM notes WHERE id = $1 AND user_id = $2", [fromNoteId, userId]);
        const toNote = await pool.query("SELECT id FROM notes WHERE id = $1 AND user_id = $2", [toNoteId, userId]);

        if (fromNote.rows.length === 0 || toNote.rows.length === 0) {
            res.status(400).json({ error: "One or both notes do not exist or unauthorized" });
            return;
        }

        // Delete the link
        const deleteResult = await pool.query(
            "DELETE FROM note_links WHERE from_note_id = $1 AND to_note_id = $2",
            [fromNoteId, toNoteId]
        );

        if (deleteResult.rowCount === 0) {
            res.status(404).json({ error: "Link not found" });
            return;
        }

        res.json({ message: "Link deleted successfully" });
    } catch (error) {
        console.error("Error deleting link:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Get all notes with their connections
export const getGraphData = async (req: Request, res: Response) => {
    try {
      const userId = req.userId;
  
      const notes = await pool.query(
        "SELECT id, title, x, y FROM notes WHERE user_id = $1",
        [userId]
      );
  
      const links = await pool.query(
        `SELECT from_note_id, to_note_id 
         FROM note_links 
         WHERE from_note_id IN (
           SELECT id FROM notes WHERE user_id = $1
         ) 
         OR to_note_id IN (
           SELECT id FROM notes WHERE user_id = $1
         )`,
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

        const note = await pool.query("SELECT id FROM notes WHERE id = $1 AND user_id = $2", [noteId, userId]);

        if (note.rows.length === 0) {
            res.status(403).json({ error: "Unauthorized or note does not exist" });
            return;
        }

        await pool.query("DELETE FROM note_links WHERE from_note_id = $1 OR to_note_id = $1", [noteId]);
        await pool.query("DELETE FROM notes WHERE id = $1", [noteId]);

        res.json({ message: "Note deleted successfully" });
    } catch (error) {
        console.error("Error deleting note:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Import Pdf
export const importPdf = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No file uploaded" });
        return;
      }
  
      const userId = req.userId;
      console.log("Importing PDF for user ID:", userId);
  
      const dataBuffer = fs.readFileSync(req.file.path);
      const pdfData = await pdfParse(dataBuffer);
      const text = pdfData.text.trim();
  
      if (!text) {
        res.status(400).json({ error: "PDF contains no readable text" });
        return;
      }
  
      const title = req.file.originalname.replace(/\.pdf$/, "") || "Untitled Note";
  
      const result = await pool.query(
        "INSERT INTO notes (title, content, user_id, tags) VALUES ($1, $2, $3, $4) RETURNING *",
        [title, text, userId, []]
      );
  
      fs.unlinkSync(req.file.path);
  
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error("Error importing PDF:", error);
      res.status(500).json({ error: "Failed to import PDF" });
    }
};

// Import DOCX file
export const importDocx = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No file uploaded" });
        return;
      }
  
      const userId = req.userId;
      const buffer = fs.readFileSync(req.file.path);
  
      const resultText = await mammoth.extractRawText({ buffer });
      const text = resultText.value.trim();
  
      if (!text) {
        res.status(400).json({ error: "DOCX contains no readable text" });
        return;
      }
  
      const title = req.file.originalname.replace(/\.docx$/, "") || "Untitled Note";
  
      const result = await pool.query(
        "INSERT INTO notes (title, content, user_id, tags) VALUES ($1, $2, $3, $4) RETURNING *",
        [title, text, userId, []]
      );
  
      fs.unlinkSync(req.file.path);
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error("Error importing DOCX:", error);
      res.status(500).json({ error: "Failed to import DOCX" });
    }
};
  
// Export PDF File
export const exportNoteAsPDF = async (req: Request, res: Response) => {
  try {
    const noteId = parseInt(req.params.id);
    const userId = req.userId;

    const result = await pool.query(
      "SELECT title, content FROM notes WHERE id = $1 AND user_id = $2",
      [noteId, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Note not found" });
    }

    const { title, content } = result.rows[0];

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${title}.pdf"`);

    doc.pipe(res);
    doc.fontSize(18).text(title, { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(content);
    doc.end();
  } catch (error) {
    console.error("PDF export error:", error);
    res.status(500).json({ error: "Failed to export PDF" });
  }
};

// Export DOCX File
export const exportNoteAsDOCX = async (req: Request, res: Response): Promise<void> => {
  try {
    const noteId = parseInt(req.params.id);
    const userId = req.userId;

    const result = await pool.query(
      "SELECT title, content, tags FROM notes WHERE id = $1 AND user_id = $2",
      [noteId, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Note not found or unauthorized" });
      return;
    }

    const { title, content, tags } = result.rows[0];

    const paragraphs = [];

    paragraphs.push(new Paragraph({ text: title || "Untitled", heading: HeadingLevel.HEADING_1 }));

    paragraphs.push(new Paragraph(content || ""));

    if (Array.isArray(tags) && tags.length > 0) {
      paragraphs.push(new Paragraph({ text: "Tags:", heading: HeadingLevel.HEADING_2 }));
      for (const tag of tags) {
        paragraphs.push(new Paragraph(`#${tag}`));
      }
    }

    const doc = new Document({ sections: [{ children: paragraphs }] });
    const buffer = await Packer.toBuffer(doc);

    res.setHeader("Content-Disposition", `attachment; filename="${title}.docx"`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.send(buffer);
  } catch (error) {
    console.error("DOCX export error:", error);
    res.status(500).json({ error: "Failed to export DOCX" });
  }
};
