"use strict";
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
const express_1 = __importDefault(require("express"));
const db_1 = __importDefault(require("../db"));
const authMiddleware_1 = __importDefault(require("../middleware/authMiddleware"));
const noteController_1 = require("../controllers/noteController");
const multer_1 = __importDefault(require("multer"));
const upload = (0, multer_1.default)({ dest: "uploads/" });
const router = express_1.default.Router();
router.get("/", authMiddleware_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const { projectId } = req.query;
        let query = "SELECT id, title, content, project_id, x, y, tags FROM notes WHERE user_id = $1";
        const values = [userId];
        if (projectId) {
            query += " AND project_id = $2";
            values.push(projectId);
        }
        const result = yield db_1.default.query(query, values);
        res.json(result.rows);
    }
    catch (error) {
        console.error("Error fetching user's notes:", error);
        res.status(500).json({ message: "Server error" });
    }
}));
router.post("/", authMiddleware_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const { title, content, projectId, tags } = req.body;
        if (!title.trim()) {
            res.status(400).json({ message: "Title is required" });
            return;
        }
        const existingNote = yield db_1.default.query("SELECT * FROM notes WHERE user_id = $1 AND title = $2 AND project_id = $3", [userId, title, projectId]);
        if (existingNote.rows.length > 0) {
            const updatedNote = yield db_1.default.query("UPDATE notes SET content = $1 WHERE user_id = $2 AND title = $3 AND project_id = $4 RETURNING *", [content, userId, title, projectId]);
            res.json(updatedNote.rows[0]);
        }
        else {
            const newNote = yield db_1.default.query("INSERT INTO notes (user_id, title, content, project_id, tags) VALUES ($1, $2, $3, $4, $5) RETURNING *", [userId, title, content, projectId, tags !== null && tags !== void 0 ? tags : []]);
            res.status(201).json(newNote.rows[0]);
        }
    }
    catch (error) {
        console.error("Error saving note:", error);
        res.status(500).json({ message: "Server error" });
    }
}));
router.put("/position/:id", authMiddleware_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const noteId = parseInt(req.params.id);
    const { x, y } = req.body;
    if (isNaN(noteId) || typeof x !== "number" || typeof y !== "number") {
        res.status(400).json({ error: "Invalid data" });
        return;
    }
    try {
        yield db_1.default.query("UPDATE notes SET x = $1, y = $2 WHERE id = $3", [x, y, noteId]);
        res.end();
    }
    catch (err) {
        console.error("Error updating position:", err);
        res.status(500).json({ error: "Database error" });
    }
}));
router.get("/graph", authMiddleware_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const { projectId } = req.query;
        if (!projectId) {
            res.status(400).json({ error: "Missing projectId" });
            return;
        }
        const notes = yield db_1.default.query("SELECT id, title, x, y FROM notes WHERE user_id = $1 AND project_id = $2", [userId, projectId]);
        const links = yield db_1.default.query(`SELECT from_note_id, to_note_id 
         FROM note_links 
         WHERE from_note_id IN (
           SELECT id FROM notes WHERE user_id = $1 AND project_id = $2
         ) 
         OR to_note_id IN (
           SELECT id FROM notes WHERE user_id = $1 AND project_id = $2
         )`, [userId, projectId]);
        res.json({ nodes: notes.rows, links: links.rows });
        return;
    }
    catch (error) {
        console.error("Error retrieving project-scoped graph:", error);
        res.status(500).json({ error: "Internal Server Error" });
        return;
    }
}));
router.post("/import/pdf", authMiddleware_1.default, upload.single("file"), noteController_1.importPdf);
router.post("/import/docx", authMiddleware_1.default, upload.single("file"), noteController_1.importDocx);
router.get("/export/pdf/:id", authMiddleware_1.default, noteController_1.exportNoteAsPDF);
router.get("/export/docx/:id", authMiddleware_1.default, noteController_1.exportNoteAsDOCX);
router.put("/:id", authMiddleware_1.default, noteController_1.updateNote);
router.get("/graph", authMiddleware_1.default, noteController_1.getGraphData);
router.post("/create", authMiddleware_1.default, noteController_1.createNote);
router.get("/all", authMiddleware_1.default, noteController_1.getAllNotes);
router.post("/link", authMiddleware_1.default, noteController_1.linkNotes);
router.delete("/unlink", authMiddleware_1.default, noteController_1.unlinkNotes);
router.get("/:id", authMiddleware_1.default, noteController_1.getNote);
router.delete("/:id", authMiddleware_1.default, noteController_1.deleteNote);
exports.default = router;
