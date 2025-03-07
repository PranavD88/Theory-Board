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
        .then((data) => setContent(data.content || ""))
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

  // Export note function
  const exportNote = async (format: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/notes/export/${format}`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to export note");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `note.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error exporting note:", error);
      alert("Failed to export note.");
    }
  };

  const importNote = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:5000/api/notes/import", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to import note");
      }

      const updatedNoteResponse = await fetch("http://localhost:5000/api/notes", {
        credentials: "include",
      });
      const updatedNoteData = await updatedNoteResponse.json();
      setContent(updatedNoteData.content || "");

      alert("Note imported successfully!");
    } catch (error) {
      console.error("Error importing note:", error);
      alert("Failed to import note.");
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

      <div style={styles.buttonContainer}>
        <button onClick={saveNote} style={styles.saveButton}>Save</button>

        <button onClick={() => exportNote("json")} style={styles.exportButton}>Export JSON</button>
        <button onClick={() => exportNote("docx")} style={styles.exportButton}>Export DOCX</button>
        <button onClick={() => exportNote("pdf")} style={styles.exportButton}>Export PDF</button>

        <label style={styles.importLabel}>
          Import File
          <input type="file" accept=".json,.docx" onChange={importNote} style={styles.importInput} />
        </label>
      </div>
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
  buttonContainer: {
    marginTop: "10px",
    display: "flex",
    gap: "10px",
  },
  saveButton: {
    padding: "10px 20px",
    backgroundColor: "#778DA9",
    color: "#0D1B2A",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "16px",
  },
  exportButton: {
    padding: "10px 15px",
    backgroundColor: "#415A77",
    color: "#E0E1DD",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "14px",
  },
  importLabel: {
    display: "inline-block",
    padding: "10px 15px",
    backgroundColor: "#E0E1DD",
    color: "#1B263B",
    border: "1px solid #415A77",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "14px",
  },
  importInput: {
    display: "none",
  },
};

export default TextEditor;
