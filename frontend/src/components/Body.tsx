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
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h2>Welcome to PKMS</h2>
      <p>Your knowledge management system is ready.</p>

      <button onClick={() => setIsEditorOpen(!isEditorOpen)}>
        {isEditorOpen ? "Close Editor" : "Open Editor"}
      </button>

      {isEditorOpen && <TextEditor isOpen={isEditorOpen} />} 

      <br />
      <p>Project Menu (Placeholder for Future Features)</p>

      <button onClick={handleLogout} style={{ marginTop: "20px", backgroundColor: "red", color: "white" }}>
        Logout
      </button>
    </div>
  );
};

export default Body;
