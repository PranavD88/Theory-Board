"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportNoteAsDOCX = exports.exportNoteAsPDF = exports.importDocx = exports.importPdf = exports.deleteNote = exports.getGraphData = exports.unlinkNotes = exports.linkNotes = exports.updateNote = exports.getAllNotes = exports.getNote = exports.createNote = void 0;
const db_1 = __importDefault(require("../db"));
const fs_1 = __importDefault(require("fs"));
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const docx_1 = require("docx");
const mammoth = __importStar(require("mammoth"));
const pdfkit_1 = __importDefault(require("pdfkit"));
// Create a new note
const createNote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, content, tags } = req.body;
        console.log("CREATING NOTE WITH TAGS:", tags);
        const userId = req.userId;
        if (!title.trim()) {
            res.status(400).json({ error: "Title is required" });
            return;
        }
        const result = yield db_1.default.query("INSERT INTO notes (title, content, user_id, tags) VALUES ($1, $2, $3, $4) RETURNING *", [title, content || null, userId, Array.isArray(tags) ? tags : []]);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        console.error("Error creating note:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
exports.createNote = createNote;
// Get a single note by ID
const getNote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const noteId = parseInt(req.params.id, 10);
        const userId = req.userId;
        if (isNaN(noteId)) {
            res.status(400).json({ error: "Invalid note ID" });
            return;
        }
        const result = yield db_1.default.query("SELECT id, title, content, tags FROM notes WHERE id = $1 AND user_id = $2", [noteId, userId]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: "Note not found or unauthorized" });
            return;
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        console.error("Error retrieving note:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
exports.getNote = getNote;
// Get all notes
const getAllNotes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const result = yield db_1.default.query("SELECT * FROM notes WHERE user_id = $1 ORDER BY created_at DESC", [userId]);
        res.json(result.rows);
    }
    catch (error) {
        console.error("Error retrieving notes:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
exports.getAllNotes = getAllNotes;
// Update an existing note
const updateNote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const noteId = parseInt(req.params.id, 10);
        const userId = req.userId;
        const { title, content, tags } = req.body;
        if (isNaN(noteId)) {
            res.status(400).json({ error: "Invalid note ID" });
            return;
        }
        const existingNote = yield db_1.default.query("SELECT * FROM notes WHERE id = $1 AND user_id = $2", [noteId, userId]);
        if (existingNote.rows.length === 0) {
            res.status(404).json({ error: "Note not found or unauthorized" });
            return;
        }
        // Update the note including the tags column
        yield db_1.default.query("UPDATE notes SET title = $1, content = $2, tags = $3 WHERE id = $4 AND user_id = $5", [title, content, tags || [], noteId, userId]);
        res.json({ message: "Note updated successfully" });
    }
    catch (error) {
        console.error("Error updating note:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
exports.updateNote = updateNote;
// Link two notes together
const linkNotes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { from_note_id, to_note_id } = req.body;
        const userId = req.userId;
        if (!from_note_id || !to_note_id || from_note_id === to_note_id) {
            res.status(400).json({ error: "Invalid note IDs" });
            return;
        }
        const fromNote = yield db_1.default.query("SELECT id FROM notes WHERE id = $1 AND user_id = $2", [from_note_id, userId]);
        const toNote = yield db_1.default.query("SELECT id FROM notes WHERE id = $1 AND user_id = $2", [to_note_id, userId]);
        if (fromNote.rows.length === 0 || toNote.rows.length === 0) {
            res.status(400).json({ error: "One or both notes do not exist or unauthorized" });
            return;
        }
        // Check if the link already exists
        const existingLink = yield db_1.default.query("SELECT id FROM note_links WHERE from_note_id = $1 AND to_note_id = $2", [from_note_id, to_note_id]);
        if (existingLink.rows.length > 0) {
            res.status(400).json({ error: "Link already exists" });
            return;
        }
        // Insert into note_links table
        yield db_1.default.query("INSERT INTO note_links (from_note_id, to_note_id) VALUES ($1, $2)", [from_note_id, to_note_id]);
        res.json({ message: "Notes linked successfully" });
    }
    catch (error) {
        console.error("Error linking notes:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
exports.linkNotes = linkNotes;
// Unlink two notes
const unlinkNotes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const fromNoteId = parseInt(req.query.from_note_id, 10);
        const toNoteId = parseInt(req.query.to_note_id, 10);
        const userId = req.userId;
        if (isNaN(fromNoteId) || isNaN(toNoteId)) {
            res.status(400).json({ error: "Invalid note IDs" });
            return;
        }
        // Ensure both notes belong to the logged-in user
        const fromNote = yield db_1.default.query("SELECT id FROM notes WHERE id = $1 AND user_id = $2", [fromNoteId, userId]);
        const toNote = yield db_1.default.query("SELECT id FROM notes WHERE id = $1 AND user_id = $2", [toNoteId, userId]);
        if (fromNote.rows.length === 0 || toNote.rows.length === 0) {
            res.status(400).json({ error: "One or both notes do not exist or unauthorized" });
            return;
        }
        // Delete the link
        const deleteResult = yield db_1.default.query("DELETE FROM note_links WHERE from_note_id = $1 AND to_note_id = $2", [fromNoteId, toNoteId]);
        if (deleteResult.rowCount === 0) {
            res.status(404).json({ error: "Link not found" });
            return;
        }
        res.json({ message: "Link deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting link:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
exports.unlinkNotes = unlinkNotes;
// Get all notes with their connections
const getGraphData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const notes = yield db_1.default.query("SELECT id, title, x, y FROM notes WHERE user_id = $1", [userId]);
        const links = yield db_1.default.query(`SELECT from_note_id, to_note_id 
         FROM note_links 
         WHERE from_note_id IN (
           SELECT id FROM notes WHERE user_id = $1
         ) 
         OR to_note_id IN (
           SELECT id FROM notes WHERE user_id = $1
         )`, [userId]);
        res.json({ nodes: notes.rows, links: links.rows });
    }
    catch (error) {
        console.error("Error retrieving graph data:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
exports.getGraphData = getGraphData;
// Delete a note and its connections
const deleteNote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const noteId = parseInt(req.params.id, 10);
        const userId = req.userId;
        if (isNaN(noteId)) {
            res.status(400).json({ error: "Invalid note ID" });
            return;
        }
        const note = yield db_1.default.query("SELECT id FROM notes WHERE id = $1 AND user_id = $2", [noteId, userId]);
        if (note.rows.length === 0) {
            res.status(403).json({ error: "Unauthorized or note does not exist" });
            return;
        }
        yield db_1.default.query("DELETE FROM note_links WHERE from_note_id = $1 OR to_note_id = $1", [noteId]);
        yield db_1.default.query("DELETE FROM notes WHERE id = $1", [noteId]);
        res.json({ message: "Note deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting note:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
exports.deleteNote = deleteNote;
// Import Pdf
const importPdf = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            res.status(400).json({ error: "No file uploaded" });
            return;
        }
        const userId = req.userId;
        console.log("Importing PDF for user ID:", userId);
        const dataBuffer = fs_1.default.readFileSync(req.file.path);
        const pdfData = yield (0, pdf_parse_1.default)(dataBuffer);
        const text = pdfData.text.trim();
        if (!text) {
            res.status(400).json({ error: "PDF contains no readable text" });
            return;
        }
        const title = req.file.originalname.replace(/\.pdf$/, "") || "Untitled Note";
        const result = yield db_1.default.query("INSERT INTO notes (title, content, user_id, tags) VALUES ($1, $2, $3, $4) RETURNING *", [title, text, userId, []]);
        fs_1.default.unlinkSync(req.file.path);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        console.error("Error importing PDF:", error);
        res.status(500).json({ error: "Failed to import PDF" });
    }
});
exports.importPdf = importPdf;
// Import DOCX file
const importDocx = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            res.status(400).json({ error: "No file uploaded" });
            return;
        }
        const userId = req.userId;
        const buffer = fs_1.default.readFileSync(req.file.path);
        const resultText = yield mammoth.extractRawText({ buffer });
        const text = resultText.value.trim();
        if (!text) {
            res.status(400).json({ error: "DOCX contains no readable text" });
            return;
        }
        const title = req.file.originalname.replace(/\.docx$/, "") || "Untitled Note";
        const result = yield db_1.default.query("INSERT INTO notes (title, content, user_id, tags) VALUES ($1, $2, $3, $4) RETURNING *", [title, text, userId, []]);
        fs_1.default.unlinkSync(req.file.path);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        console.error("Error importing DOCX:", error);
        res.status(500).json({ error: "Failed to import DOCX" });
    }
});
exports.importDocx = importDocx;
// Export PDF File
const exportNoteAsPDF = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const noteId = parseInt(req.params.id);
        const userId = req.userId;
        const result = yield db_1.default.query("SELECT title, content FROM notes WHERE id = $1 AND user_id = $2", [noteId, userId]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: "Note not found" });
        }
        const { title, content } = result.rows[0];
        const doc = new pdfkit_1.default();
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${title}.pdf"`);
        doc.pipe(res);
        doc.fontSize(18).text(title, { underline: true });
        doc.moveDown();
        doc.fontSize(12).text(content);
        doc.end();
    }
    catch (error) {
        console.error("PDF export error:", error);
        res.status(500).json({ error: "Failed to export PDF" });
    }
});
exports.exportNoteAsPDF = exportNoteAsPDF;
// Export DOCX File
const exportNoteAsDOCX = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const noteId = parseInt(req.params.id);
        const userId = req.userId;
        const result = yield db_1.default.query("SELECT title, content, tags FROM notes WHERE id = $1 AND user_id = $2", [noteId, userId]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: "Note not found or unauthorized" });
            return;
        }
        const { title, content, tags } = result.rows[0];
        const paragraphs = [];
        paragraphs.push(new docx_1.Paragraph({ text: title || "Untitled", heading: docx_1.HeadingLevel.HEADING_1 }));
        paragraphs.push(new docx_1.Paragraph(content || ""));
        if (Array.isArray(tags) && tags.length > 0) {
            paragraphs.push(new docx_1.Paragraph({ text: "Tags:", heading: docx_1.HeadingLevel.HEADING_2 }));
            for (const tag of tags) {
                paragraphs.push(new docx_1.Paragraph(`#${tag}`));
            }
        }
        const doc = new docx_1.Document({ sections: [{ children: paragraphs }] });
        const buffer = yield docx_1.Packer.toBuffer(doc);
        res.setHeader("Content-Disposition", `attachment; filename="${title}.docx"`);
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        res.send(buffer);
    }
    catch (error) {
        console.error("DOCX export error:", error);
        res.status(500).json({ error: "Failed to export DOCX" });
    }
});
exports.exportNoteAsDOCX = exportNoteAsDOCX;
