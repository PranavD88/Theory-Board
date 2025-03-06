import React, { useState, useEffect } from "react";

interface TextEditorProps {
  isOpen: boolean;
}

const TextEditor: React.FC<TextEditorProps> = ({ isOpen }) => {
  const [content, setContent] = useState("");

  // Load saved note when the editor opens
  useEffect(() => {
    if (isOpen) {
      fetch("http://localhost:5000/api/notes", { credentials: "include" })
        .then((res) => res.json())
        .then((data) => {
          setContent(data.content || ""); // Set the loaded content
        })
        .catch((err) => console.error("Error loading note:", err));
    }
  }, [isOpen]);

  // Save the note to the backend
  const saveNote = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to save note");
      }

      alert("Note saved!");
    } catch (error) {
      console.error("Error saving note:", error);
      alert("Failed to save note.");
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div style={styles.editorContainer}>
      <textarea
        style={styles.textArea}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Start typing..."
      />
      <button onClick={saveNote} style={styles.saveButton}>Save</button>
    </div>
  );
};

// Styles
const styles: Record<string, React.CSSProperties> = {
  editorContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
    marginTop: "20px",
  },
  textArea: {
    width: "80%",
    height: "400px",
    padding: "10px",
    fontSize: "16px",
    backgroundColor: "#1B263B",
    color: "#E0E1DD",
    border: "1px solid #415A77",
    borderRadius: "5px",
  },
  saveButton: {
    marginTop: "10px",
    padding: "10px 20px",
    backgroundColor: "#778DA9",
    color: "#0D1B2A",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "16px",
  },
};

export default TextEditor;
