import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import GraphView from "./GraphView";

// Define the Note type
interface Note {
    id: number;
    title: string;
    content: string;
    created_at: string;
}

const Body: React.FC<{ setIsAuthenticated: (isAuth: boolean) => void }> = ({ setIsAuthenticated }) => {
    const navigate = useNavigate();
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [isGraphOpen, setIsGraphOpen] = useState(true);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [notes, setNotes] = useState<Note[]>([]);
    const [selectedNote1, setSelectedNote1] = useState("");
    const [selectedNote2, setSelectedNote2] = useState("");

    // Fetch all notes from the backend
    useEffect(() => {
        fetch("http://localhost:5000/api/notes/all")
            .then(res => res.json())
            .then((data: Note[]) => setNotes(data))
            .catch(err => console.error("Error fetching notes:", err));
    }, []);

    // Create a new note
    const handleCreateNote = async () => {
        if (!title.trim()) {
            alert("Title is required");
            return;
        }

        const response = await fetch("http://localhost:5000/api/notes/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, content }),
        });

        if (response.ok) {
            const newNote: Note = await response.json();
            setNotes([...notes, newNote]);
            setTitle("");
            setContent("");
        } else {
            alert("Error creating note");
        }
    };

    // Link two notes together
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

    // Logout
    const handleLogout = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/auth/logout", {
                method: "POST",
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error("Logout failed");
            }

            setIsAuthenticated(false);
            navigate("/login");
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>Theory Board</h2>
            <p style={styles.description}>Visualize and organize your knowledge.</p>

            <div style={styles.buttonContainer}>
                <button onClick={() => setIsEditorOpen(!isEditorOpen)} style={styles.toggleButton}>
                    {isEditorOpen ? "Close Editor" : "Open Editor"}
                </button>
                <button onClick={() => setIsGraphOpen(!isGraphOpen)} style={styles.toggleButton}>
                    {isGraphOpen ? "Hide Graph" : "Show Graph"}
                </button>
            </div>

            {/* Note Creation Form */}
            <div style={styles.noteForm}>
                <h3>Create a New Note</h3>
                <input
                    type="text"
                    placeholder="Note Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={styles.input}
                />
                <textarea
                    placeholder="Note Content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    style={styles.textarea}
                />
                <button onClick={handleCreateNote} style={styles.createButton}>Create Note</button>
            </div>

            {/* Note Linking */}
            <div style={styles.noteForm}>
                <h3>Link Notes</h3>
                <select value={selectedNote1} onChange={(e) => setSelectedNote1(e.target.value)} style={styles.select}>
                    <option value="">Select Note 1</option>
                    {notes.map((note) => (
                        <option key={note.id} value={note.id}>{note.title}</option>
                    ))}
                </select>
                <select value={selectedNote2} onChange={(e) => setSelectedNote2(e.target.value)} style={styles.select}>
                    <option value="">Select Note 2</option>
                    {notes.map((note) => (
                        <option key={note.id} value={note.id}>{note.title}</option>
                    ))}
                </select>
                <button onClick={handleLinkNotes} style={styles.createButton}>Link Notes</button>
            </div>

            {/* Graph View */}
            <div className="graphContainer" style={styles.graphContainer}>
                {isGraphOpen && <GraphView />}
            </div>

            <button onClick={handleLogout} style={styles.logoutButton}>Logout</button>
        </div>
    );
};

// Styles
const styles: Record<string, React.CSSProperties> = {
    container: {
        textAlign: "center",
        padding: "40px",
        backgroundColor: "#0D1B2A",
        color: "#E0E1DD",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
    },
    title: { 
        fontSize: "32px", 
        fontWeight: "bold", 
        color: "#E0E1DD", 
        marginBottom: "5px" 
    },
    description: { 
        fontSize: "18px", 
        color: "#778DA9", 
        marginBottom: "20px" 
    },
    buttonContainer: { 
        display: "flex", 
        gap: "15px", 
        marginBottom: "20px" 
    },
    toggleButton: { 
        padding: "10px 20px", 
        fontSize: "16px", 
        backgroundColor: "#415A77", 
        color: "white", 
        border: "none", 
        borderRadius: "5px", 
        cursor: "pointer" 
    },
    noteForm: { 
        backgroundColor: "#1B263B", 
        padding: "20px", 
        borderRadius: "10px", 
        marginBottom: "20px", 
        width: "50%" 
    },
    input: { 
        width: "100%", 
        padding: "10px", 
        marginBottom: "10px", 
        borderRadius: "5px", 
        border: "none" 
    },
    textarea: { 
        width: "100%", 
        padding: "10px", 
        marginBottom: "10px", 
        borderRadius: "5px", 
        border: "none", 
        height: "80px" 
    },
    select: { 
        width: "100%", 
        padding: "10px", 
        marginBottom: "10px", 
        borderRadius: "5px", 
        border: "none" 
    },
    createButton: { 
        padding: "10px 20px", 
        fontSize: "16px", 
        backgroundColor: "#29A19C", 
        color: "white", 
        border: "none", 
        borderRadius: "5px", 
        cursor: "pointer" 
    },
    graphContainer: {
        width: "100%",
        height: "500px",
        backgroundColor: "#1B263B",
        padding: "10px",
        borderRadius: "10px",
        marginBottom: "20px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
        overflow: "visible",
    },
    logoutButton: { 
        marginTop: "20px", 
        padding: "10px 15px", 
        fontSize: "16px", 
        backgroundColor: "red", 
        color: "white", 
        border: "none", 
        borderRadius: "5px", 
        cursor: "pointer" 
    },
};

export default Body;