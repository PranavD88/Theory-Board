import { Rnd } from "react-rnd";
import RichTextEditor from "./RichTextEditor";

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
}: NoteWindowProps) => {
  return (
    <Rnd
      default={{
        x: note.x ?? 100,
        y: note.y ?? 100,
        width: 400,
        height: 660,
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
        <input
          type="text"
          placeholder="Add new tag"
          className="add-tag-input"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const val = e.currentTarget.value.trim();
              if (val) {
                onAddTag(note.id, val);
                e.currentTarget.value = "";
              }
            }
          }}
        />
      </div>

      <button onClick={() => onDelete(note.id)} className="delete-button">
        Delete
      </button>
      <button onClick={() => onExportPDF(note.id)} className="export-button">
        Export as PDF
      </button>
      <button onClick={() => onExportDOCX(note.id)} className="export-button">
        Export as DOCX
      </button>
      <button onClick={() => onClose(note.id)} className="close-button">
        Close
      </button>
    </Rnd>
  );
};

export default NoteWindow;
