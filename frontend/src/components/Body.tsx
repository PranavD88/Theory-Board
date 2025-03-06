import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import TextEditor from "./TextEditor";

const Body: React.FC<{ setIsAuthenticated: (isAuth: boolean) => void }> = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();
  const [isEditorOpen, setIsEditorOpen] = useState(false);

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
      <h2 style={styles.title}>Welcome to Theory Board</h2>
      <p style={styles.description}>Your personal knowledge management system is ready.</p>

      <button onClick={() => setIsEditorOpen(!isEditorOpen)} style={styles.toggleButton}>
        {isEditorOpen ? "Close Editor" : "Open Editor"}
      </button>

      {isEditorOpen && <TextEditor isOpen={isEditorOpen} />} 

      <br />
      <p style={styles.placeholder}>Project Menu (Placeholder for Future Features)</p>

      <button onClick={handleLogout} style={styles.logoutButton}>
        Logout
      </button>
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
  },
  title: {
    fontSize: "28px",
    marginBottom: "10px",
    color: "#E0E1DD",
  },
  description: {
    fontSize: "18px",
    marginBottom: "20px",
    color: "#778DA9",
  },
  toggleButton: {
    marginBottom: "20px",
    padding: "10px 20px",
    fontSize: "16px",
    backgroundColor: "#415A77",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  placeholder: {
    fontSize: "14px",
    marginTop: "20px",
    color: "#E0E1DD",
  },
  logoutButton: {
    marginTop: "30px",
    padding: "10px 15px",
    fontSize: "16px",
    backgroundColor: "red",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
};

export default Body;
