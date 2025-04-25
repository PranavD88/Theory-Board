import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

const Projects: React.FC = () => {
  const [projName, setProjName] = useState<string>("");
  const [showInput, setShowInput] = useState<boolean>(false);
  const [projects, setProjects] = useState<any[]>([]);
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProjName(e.target.value);
  };

  const toggleInput = () => {
    setShowInput(!showInput);
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_BASE}/api/projects`, {
        method: "GET",
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      } else {
        console.error("Failed to fetch projects");
      }
    } catch (err) {
      console.error("Error fetching projects:", err);
    }
  };

  const handleCreateProject = async () => {
    if (!projName.trim()) return;

    try {
      const res = await fetch(`${process.env.REACT_APP_API_BASE}/api/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ name: projName }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(`Project "${data.name}" created!`);
        setProjName("");
        setShowInput(false);
        fetchProjects();
      } else {
        const err = await res.json();
        alert(`Failed to create project: ${err.error}`);
      }
    } catch (err) {
      console.error("Create project failed:", err);
      alert("Something went wrong.");
    }
  };

  const handleProjectClick = (projectId: number) => {
    navigate(`/graph/${projectId}`);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <div style={{ backgroundColor: "#282c34", minHeight: "100vh", padding: "2rem", color: "white" }}>
      <div className="Menu-button-list" style={{ marginBottom: "2rem" }}>
        <button onClick={toggleInput} style={{ marginRight: "1rem", backgroundColor: "#ff005d", color: "white", border: "none", padding: "0.5rem 1rem", borderRadius: "8px" }}>
          New Project
        </button>
        <button style={{ backgroundColor: "#ff005d", color: "white", border: "none", padding: "0.5rem 1rem", borderRadius: "8px" }}>
          Delete Project
        </button>
      </div>

      {showInput && (
        <div style={{ marginBottom: "2rem" }}>
          <input
            type="text"
            id="projName"
            value={projName}
            onChange={handleInputChange}
            placeholder="Enter Project Name"
            style={{
              padding: "0.5rem",
              width: "300px",
              borderRadius: "8px",
              marginRight: "1rem",
              border: "1px solid #ccc",
            }}
          />
          <button onClick={handleCreateProject} className="InputAccept" style={{ backgroundColor: "#ff005d", color: "white", padding: "0.5rem 1rem", borderRadius: "8px", border: "none" }}>
            Create Project
          </button>
        </div>
      )}

      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Your Projects</h1>
      <p style={{ marginBottom: "2rem" }}>Click on a project to open its graph.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "1.5rem" }}>
        {projects.map((proj) => (
          <div
            key={proj.id}
            onClick={() => handleProjectClick(proj.id)}
            style={{
              backgroundColor: "#3a3f47",
              borderRadius: "12px",
              padding: "1rem",
              cursor: "pointer",
              transition: "transform 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <h2 style={{ color: "#ff005d" }}>{proj.name}</h2>
            <p style={{ color: "#bbb", fontSize: "0.9rem" }}>Created: {new Date(proj.created_at).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Projects;
