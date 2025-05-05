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
exports.deleteProject = exports.getProjects = exports.createProject = void 0;
const db_1 = __importDefault(require("../db"));
// Create a new project
const createProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const { name } = req.body;
    const userId = req.userId;
    try {
        const result = yield db_1.default.query("INSERT INTO projects (name, user_id) VALUES ($1, $2) RETURNING *", [name, userId]);
        res.status(201).json(result.rows[0]);
    }
    catch (err) {
        console.error("Error creating project:", err);
        res.status(500).json({ error: "Failed to create project" });
    }
});
exports.createProject = createProject;
// Get all projects for user
const getProjects = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const userId = req.userId;
    try {
        const result = yield db_1.default.query("SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC", [userId]);
        res.status(200).json(result.rows);
    }
    catch (err) {
        console.error("Error getting projects:", err);
        res.status(500).json({ error: "Failed to get projects" });
    }
});
exports.getProjects = getProjects;
// Delete a project
const deleteProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { projectId } = req.params;
    const userId = req.userId;
    try {
        const notesResult = yield db_1.default.query("SELECT id FROM notes WHERE user_id = $1 AND project_id = $2", [userId, projectId]);
        const noteIds = notesResult.rows.map(row => row.id);
        if (noteIds.length > 0) {
            yield db_1.default.query("DELETE FROM note_links WHERE from_note_id = ANY($1) OR to_note_id = ANY($1)", [noteIds]);
            yield db_1.default.query("DELETE FROM notes WHERE id = ANY($1)", [noteIds]);
        }
        yield db_1.default.query("DELETE FROM projects WHERE id = $1 AND user_id = $2", [projectId, userId]);
        res.status(204).end();
    }
    catch (err) {
        console.error("Error deleting project:", err);
        res.status(500).json({ error: "Failed to delete project" });
    }
});
exports.deleteProject = deleteProject;
