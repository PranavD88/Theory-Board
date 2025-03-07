import express, { Request, Response } from "express";
import pool from "../db";
import authMiddleware from "../middleware/authMiddleware";
import fs from "fs";
import path from "path";
import { jsPDF } from "jspdf";
import mammoth from "mammoth";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { Document, Packer, Paragraph, TextRun } from "docx";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

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

router.get("/export/:format", authMiddleware, async (req: express.Request, res: express.Response): Promise<void> => {
    try {
        const { format } = req.params;
        const userId = req.userId;
        const notes = await pool.query("SELECT content FROM notes WHERE user_id = $1", [userId]);

        if (notes.rows.length === 0) {
            res.status(404).json({ message: "No notes found for export" });
            return;
        }

        const content = notes.rows[0].content;

        // Ensure the exports folder exists
        const exportsDir = path.join(__dirname, "../../exports");
        if (!fs.existsSync(exportsDir)) {
            fs.mkdirSync(exportsDir, { recursive: true });
        }

        let filePath = "";

        if (format === "json") {
            filePath = path.join(exportsDir, `note_${userId}.json`);
            fs.writeFileSync(filePath, JSON.stringify({ notes: content }, null, 2));
            res.download(filePath, "note.json", () => fs.unlinkSync(filePath));
            return;
        } 

        if (format === "docx") {
            const doc = new Document({
                sections: [{ properties: {}, children: [new Paragraph(content)] }],
            });

            filePath = path.join(exportsDir, `note_${userId}.docx`);
            const buffer = await Packer.toBuffer(doc);
            fs.writeFileSync(filePath, buffer);

            res.download(filePath, "note.docx", () => fs.unlinkSync(filePath));
            return;
        } 

        if (format === "pdf") {
            const pdf = new jsPDF();
            pdf.text(content, 10, 10);

            filePath = path.join(exportsDir, `note_${userId}.pdf`);
            pdf.save(filePath);

            res.download(filePath, "note.pdf", () => fs.unlinkSync(filePath));
            return;
        }

        res.status(400).json({ message: "Invalid format. Use json, docx, or pdf" });

    } catch (error) {
        console.error("Export error:", error);
        res.status(500).json({ message: "Server error" });
    }
});


router.post("/import", authMiddleware, upload.single("file"), async (req: express.Request, res: express.Response): Promise<void> => {
    try {
        const userId = req.userId;
        const file = req.file;

        if (!file) {
            res.status(400).json({ message: "No file uploaded" });
            return;
        }

        let content = "";

        // JSON Import
        if (file.mimetype === "application/json" || file.originalname.endsWith(".json")) {
            try {
                const jsonData = JSON.parse(fs.readFileSync(file.path, "utf-8"));
                if (!jsonData.notes || typeof jsonData.notes !== "string") {
                    res.status(400).json({ message: "Invalid JSON format" });
                    return;
                }
                content = jsonData.notes;
            } catch (jsonError) {
                console.error("JSON Parsing Error:", jsonError);
                res.status(400).json({ message: "Error parsing JSON file" });
                return;
            }
        }
        // DOCX Import
        else if (file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || file.originalname.endsWith(".docx")) {
            const result = await mammoth.extractRawText({ path: file.path });
            content = result.value;
        }
        else {
            res.status(400).json({ message: "Invalid file format. Use JSON or DOCX" });
            return;
        }

        // Check if user already has a note
        const existingNote = await pool.query("SELECT * FROM notes WHERE user_id = $1", [userId]);

        if (existingNote.rows.length > 0) {
            await pool.query("UPDATE notes SET content = $1 WHERE user_id = $2", [content, userId]);
        } else {
            await pool.query("INSERT INTO notes (user_id, content) VALUES ($1, $2)", [userId, content]);
        }

        fs.unlinkSync(file.path); // Delete file after processing
        res.json({ message: "Note imported successfully!", content });

    } catch (error) {
        console.error("Import error:", error);
        res.status(500).json({ message: "Server error" });
    }
});


export default router;
