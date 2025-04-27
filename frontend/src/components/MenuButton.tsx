import React, { useState, useEffect, useCallback } from "react";
import { Menu } from "lucide-react";
import TagInput from "./TagInput";
import RichTextEditor from "./RichTextEditor";
import "./MenuButton.css";

interface MenuButtonProps {
  setIsAuthenticated: (isAuth: boolean) => void;
  addNode: (newNote: any) => void;
  addEdge: (fromNoteId: number, toNoteId: number) => void;
  clearGraph: () => void;
  projectId?: string;
}

const MenuButton: React.FC<MenuButtonProps> = ({
  setIsAuthenticated,
  addNode,
  addEdge,
  clearGraph,
  projectId,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedNote1, setSelectedNote1] = useState("");
  const [selectedNote2, setSelectedNote2] = useState("");
  const [notes, setNotes] = useState<{ id: number; title: string }[]>([]);
  const [tags, setTags] = useState<{ id: string; text: string }[]>([]);

  // Memoized function to fetch notes for the dropdown lists
  const fetchNotes = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/notes?projectId=${projectId}`, {
        method: "GET",
        credentials: "include",
      });

      if (response.status === 401) {
        console.error("Unauthorized access - Logging out");
        setIsAuthenticated(false);
        return;
      }

      const data = await response.json();
      if (!Array.isArray(data)) throw new Error("Invalid data format received");
      setNotes(data);
    } catch (error) {
      console.error("Error fetching notes:", error);
      setNotes([]);
    }
  }, [setIsAuthenticated, projectId]);

  useEffect(() => {
    if (isOpen) {
      fetchNotes();
    }
  }, [isOpen, fetchNotes]);

  const handleCreateNote = async () => {
    if (!title.trim()) {
      alert("Title is required");
      return;
    }
  
    const response = await fetch("http://localhost:5000/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        title,
        content,
        tags: tags.map(tag => tag.text),
        projectId,
      }),
    });
  
    if (response.status === 401) {
      console.error("Unauthorized access - Logging out");
      setIsAuthenticated(false);
      return;
    }
  
    if (response.ok) {
      const newNote = await response.json();
      alert("Note created!");
      setTitle("");
      setContent("");
      setTags([]);
      addNode(newNote);
      fetchNotes();
    } else {
      alert("Error creating note");
    }
  };

  const handleLinkNotes = async () => {
    if (!selectedNote1 || !selectedNote2 || selectedNote1 === selectedNote2) {
      alert("Select two different notes to link");
      return;
    }

    const response = await fetch("http://localhost:5000/api/notes/link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        from_note_id: selectedNote1,
        to_note_id: selectedNote2,
      }),
    });

    if (response.status === 401) {
      console.error("Unauthorized access - Logging out");
      setIsAuthenticated(false);
      return;
    }

    if (response.ok) {
      alert("Notes linked successfully!");
      addEdge(Number(selectedNote1), Number(selectedNote2));
      fetchNotes();
      setSelectedNote1("");
      setSelectedNote2("");
    } else {
      alert("Error linking notes");
    }
  };

  const handleImportPDF = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
  
    const formData = new FormData();
    formData.append("file", file);
  
    try {
      const response = await fetch("http://localhost:5000/api/notes/import/pdf", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
  
      if (!response.ok) {
        throw new Error("Failed to import PDF");
      }
  
      const newNote = await response.json();
      alert("PDF imported as note!");
      addNode(newNote);
      fetchNotes();
  
      e.target.value = "";
    } catch (err) {
      console.error("Error importing PDF:", err);
      alert("Error importing PDF");
    }
  };

  const handleImportDOCX = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
  
    const formData = new FormData();
    formData.append("file", file);
  
    try {
      const response = await fetch("http://localhost:5000/api/notes/import/docx", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
  
      if (!response.ok) {
        throw new Error("Failed to import DOCX");
      }
  
      const newNote = await response.json();
      alert("DOCX imported as note!");
      addNode(newNote);
      fetchNotes();
  
      e.target.value = "";
    } catch (err) {
      console.error("Error importing DOCX:", err);
      alert("Error importing DOCX");
    }
  };
  
  return (
    <div className="menu-container">
      <button onClick={() => setIsOpen(!isOpen)} className="menu-button">
        <Menu size={32} color="white" />
      </button>
  
      {isOpen && (
        <div className="dropdown">
          <h3 className="heading">Create a Note</h3>
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input"
          />
          <div style={{ width: "100%", textAlign: "left", display: "block" }}>
            <RichTextEditor content={content} onChange={setContent} />
          </div>
          <TagInput tags={tags} setTags={setTags} />
  
          <label className="import-label pdf">
            Import PDF
            <input type="file" accept=".pdf" onChange={handleImportPDF} className="import-input" />
          </label>
  
          <label className="import-label docx">
            Import DOCX
            <input type="file" accept=".docx" onChange={handleImportDOCX} className="import-input" />
          </label>
  
          <button onClick={handleCreateNote} className="create-button">
            Create
          </button>
  
          <h3 className="heading">Link Notes</h3>
          <select
            value={selectedNote1}
            onChange={(e) => setSelectedNote1(e.target.value)}
            className="select"
          >
            <option value="">Select Note 1</option>
            {notes.map((note) => (
              <option key={note.id} value={note.id}>
                {note.title}
              </option>
            ))}
          </select>
          <select
            value={selectedNote2}
            onChange={(e) => setSelectedNote2(e.target.value)}
            className="select"
          >
            <option value="">Select Note 2</option>
            {notes.map((note) => (
              <option key={note.id} value={note.id}>
                {note.title}
              </option>
            ))}
          </select>
          <button onClick={handleLinkNotes} className="create-button">
            Link
          </button>
        </div>
      )}
    </div>
  );
};  

export default MenuButton;