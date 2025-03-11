import React, { useState } from "react";
import { Menu } from "lucide-react";

const MenuButton: React.FC<{ setIsAuthenticated: (isAuth: boolean) => void }> = ({ setIsAuthenticated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedNote1, setSelectedNote1] = useState("");
  const [selectedNote2, setSelectedNote2] = useState("");
  const [notes, setNotes] = useState<{ id: number; title: string }[]>([]);

  const fetchNotes = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/notes/all");
      const data = await response.json();
      setNotes(data);
    } catch (error) {
      console.error("Error fetching notes:", error);
    }
  };

  const handleCreateNote = async () => {
    if (!title.trim()) return alert("Title is required");

    const response = await fetch("http://localhost:5000/api/notes/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    });

    if (response.ok) {
      alert("Note created!");
      setTitle("");
      setContent("");
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
      body: JSON.stringify({ from_note_id: selectedNote1, to_note_id: selectedNote2 }),
    });

    if (response.ok) {
      alert("Notes linked successfully!");
    } else {
      alert("Error linking notes");
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) throw new Error("Logout failed");
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div style={styles.menuContainer}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          fetchNotes();
        }}
        style={styles.menuButton}
      >
        <Menu size={32} color="white" />
      </button>

      {isOpen && (
        <div style={styles.dropdown}>
          <h3 style={styles.heading}>Create a Note</h3>
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={styles.input}
          />
          <textarea
            placeholder="Content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={styles.textarea}
          />
          <button onClick={handleCreateNote} style={styles.createButton}>
            Create
          </button>

          <h3 style={styles.heading}>Link Notes</h3>
          <select
            value={selectedNote1}
            onChange={(e) => setSelectedNote1(e.target.value)}
            style={styles.select}
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
            style={styles.select}
          >
            <option value="">Select Note 2</option>
            {notes.map((note) => (
              <option key={note.id} value={note.id}>
                {note.title}
              </option>
            ))}
          </select>
          <button onClick={handleLinkNotes} style={styles.createButton}>
            Link
          </button>

          <button onClick={handleLogout} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

// Styles
const styles: Record<string, React.CSSProperties> = {
  menuContainer: {
    position: "absolute",
    top: "10px",
    left: "10px",
    zIndex: 10,
  },
  menuButton: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
  },
  dropdown: {
    position: "absolute",
    top: "40px",
    left: 0,
    width: "300px",
    height: "85vh",
    background: "#333",
    padding: "15px",
    borderRadius: "5px",
    color: "white",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    overflowY: "auto",
    overflowX: "hidden",
  },
  heading: {
    marginBottom: "10px",
    textAlign: "center",
  },
  input: {
    width: "93%",
    padding: "10px",
    marginBottom: "10px",
    borderRadius: "4px",
    border: "none",
  },
  textarea: {
    width: "93%",
    height: "30vh",
    padding: "10px",
    marginBottom: "10px",
    borderRadius: "4px",
    border: "none",
  },
  select: {
    width: "100%",
    padding: "10px",
    marginBottom: "10px",
    borderRadius: "4px",
    border: "none",
  },
  createButton: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#29A19C",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    marginBottom: "10px",
  },
  logoutButton: {
    width: "100%",
    padding: "12px",
    backgroundColor: "red",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    marginBottom: "10px",
  },
};

export default MenuButton;
