import { Request, Response } from "express";
import pool from "../db";

// Create a new project
export const createProject = async (req: Request, res: Response) => {
  if (!req.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { name } = req.body;
  const userId = req.userId;

  try {
    const result = await pool.query(
      "INSERT INTO projects (name, user_id) VALUES ($1, $2) RETURNING *",
      [name, userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating project:", err);
    res.status(500).json({ error: "Failed to create project" });
  }
};

// Get all projects for user
export const getProjects = async (req: Request, res: Response) => {
  if (!req.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const userId = req.userId;

  try {
    const result = await pool.query(
      "SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error getting projects:", err);
    res.status(500).json({ error: "Failed to get projects" });
  }
};

// Delete a project
export const deleteProject = async (req: Request, res: Response): Promise<void> => {
  const { projectId } = req.params;
  const userId = req.userId;

  try {
    const notesResult = await pool.query(
      "SELECT id FROM notes WHERE user_id = $1 AND project_id = $2",
      [userId, projectId]
    );
    const noteIds = notesResult.rows.map(row => row.id);

    if (noteIds.length > 0) {
      await pool.query(
        "DELETE FROM note_links WHERE from_note_id = ANY($1) OR to_note_id = ANY($1)",
        [noteIds]
      );

      await pool.query(
        "DELETE FROM notes WHERE id = ANY($1)",
        [noteIds]
      );
    }

    await pool.query(
      "DELETE FROM projects WHERE id = $1 AND user_id = $2",
      [projectId, userId]
    );

    res.status(204).end();
  } catch (err) {
    console.error("Error deleting project:", err);
    res.status(500).json({ error: "Failed to delete project" });
  }
};