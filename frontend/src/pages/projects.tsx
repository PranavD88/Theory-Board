import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

interface ProjectsProps {
  setIsAuthenticated: (isAuth: boolean) => void;
}

const Projects: React.FC<ProjectsProps> = ({ setIsAuthenticated }) => {
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

  const handleLogout = async () => {
    try {
      await fetch(`${process.env.REACT_APP_API_BASE}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsAuthenticated(false);
      navigate("/login");
    }
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

  const handleDeleteProject = async (projectId: number) => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;

    try {
      const res = await fetch(`${process.env.REACT_APP_API_BASE}/api/projects/${projectId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        alert("Project deleted!");
        fetchProjects();
      } else {
        alert("Failed to delete project");
      }
    } catch (err) {
      console.error("Delete project error:", err);
      alert("Error deleting project");
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
      <h1 style={{color: "red"}}> HELLO TEST </h1>
      <div className="Menu-button-list" style={{ marginBottom: "2rem", display: "flex", gap: "1rem" }}>
        <button
          onClick={toggleInput}
          style={{
            backgroundColor: "#ff005d",
            color: "white",
            border: "none",
            padding: "0.5rem 1rem",
            borderRadius: "8px",
          }}
        >
          New Project
        </button>

        <button
          onClick={handleLogout}
          style={{
            backgroundColor: "#ff005d",
            color: "white",
            border: "none",
            padding: "0.5rem 1rem",
            borderRadius: "8px",
          }}
        >
          Logout
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
          <button
            onClick={handleCreateProject}
            className="InputAccept"
            style={{
              backgroundColor: "#ff005d",
              color: "white",
              padding: "0.5rem 1rem",
              borderRadius: "8px",
              border: "none",
            }}
          >
            Create Project
          </button>
        </div>
      )}

      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Your Projects</h1>
      <p style={{ marginBottom: "2rem" }}>Click on a project to open its graph.</p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {projects.map((proj) => (
          <div
            key={proj.id}
            style={{
              backgroundColor: "#3a3f47",
              borderRadius: "12px",
              padding: "1rem",
              position: "relative",
              transition: "transform 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <h2
              onClick={() => handleProjectClick(proj.id)}
              style={{ color: "#ff005d", marginBottom: "0.5rem", cursor: "pointer" }}
            >
              {proj.name}
            </h2>
            <p style={{ color: "#bbb", fontSize: "0.9rem" }}>
              Created: {new Date(proj.created_at).toLocaleDateString()}
            </p>

            <button
              onClick={() => handleDeleteProject(proj.id)}
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                backgroundColor: "#ff005d",
                color: "white",
                border: "none",
                padding: "0.3rem 0.6rem",
                borderRadius: "8px",
                fontSize: "0.8rem",
              }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
  
};

export default Projects;
