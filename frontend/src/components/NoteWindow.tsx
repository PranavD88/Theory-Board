import { useState } from "react";
import { Rnd } from "react-rnd";
import RichTextEditor from "./RichTextEditor";
import "./NoteWindow.css";

type WindowedNote = {
  id: number;
  title: string;
  content: string;
  tags?: string[];
  z: number;
  x?: number;
  y?: number;
};

type NoteWindowProps = {
  note: {
    id: number;
    title: string;
    content: string;
    tags?: string[];
    z: number;
    x?: number;
    y?: number;
  };
  onUpdate: (id: number, field: "title" | "content", value: string) => void;
  onDelete: (id: number) => void;
  onClose: (id: number) => void;
  onAddTag: (id: number, tag: string) => void;
  onRemoveTag: (id: number, tag: string) => void;
  onExportPDF: (id: number) => void;
  onExportDOCX: (id: number) => void;
  onSave: (note: WindowedNote) => void;
};

const NoteWindow = ({
  note,
  onUpdate,
  onDelete,
  onClose,
  onAddTag,
  onRemoveTag,
  onExportPDF,
  onExportDOCX,
  onSave,
}: NoteWindowProps) => {
  const [newTag, setNewTag] = useState("");

  return (
    <Rnd
      default={{
        x: note.x ?? 100,
        y: note.y ?? 100,
        width: 400,
        height: 705,
      }}
      minWidth={300}
      minHeight={200}
      className="note-preview"
      dragHandleClassName="drag-handle"
      style={{ zIndex: note.z }}
    >
      <div className="drag-handle">⠿ Drag</div>
      <h3 className="note-title">Edit Note</h3>

      <div className="full-width">
        <input
          type="text"
          value={note.title}
          onChange={(e) => onUpdate(note.id, "title", e.target.value)}
          className="input"
        />
      </div>

      <div className="full-width">
        <RichTextEditor
          content={note.content}
          onChange={(val) => onUpdate(note.id, "content", val)}
        />
      </div>

      <div className="tags-container">
        <label className="tags-label">Tags</label>
        <div className="tags-list">
          {(note.tags ?? []).map((tag, idx) => (
            <span key={`${tag}-${idx}`} className="tag">
              #{tag}
              <button
                className="delete-tag-btn"
                onClick={() => onRemoveTag(note.id, tag)}
              >
                ×
              </button>
            </span>
          ))}
        </div>

        <div className="tag-input-wrapper">
          <div className="full-width">
            <input
              type="text"
              placeholder="Add new tag"
              className="add-tag-input"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
            />
          </div>
          <button
            className="create-button"
            onClick={() => {
              const trimmed = newTag.trim();
              if (!trimmed || note.tags?.includes(trimmed)) return;
              onAddTag(note.id, trimmed);
              setNewTag("");
            }}
          >
            Add Tag
          </button>
        </div>
      </div>

      <div className="actions-row">
        <button onClick={() => onSave(note)} className="save-button">
          Save
        </button>
        <button onClick={() => onDelete(note.id)} className="delete-button">
          Delete
        </button>
        <button onClick={() => onExportPDF(note.id)} className="export-button pdf-export">
          Export as PDF
        </button>
        <button onClick={() => onExportDOCX(note.id)} className="export-button docx-export">
          Export as DOCX
        </button>
        <button onClick={() => onClose(note.id)} className="close-button">
          Close
        </button>
      </div>
    </Rnd>
  );
};

export default NoteWindow;
