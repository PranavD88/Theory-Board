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
  const [searchTerm, setSearchTerm] = useState<string>("");
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

  const filteredProjects = projects.filter((proj) =>
    proj.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  //creates new project
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
      <h2 style={{ color: "#ff005d", marginBottom: "1rem" }}>
        🔥 Current Streak: {localStorage.getItem('streakCount') || 0} days
      </h2>
  
      <div className="Menu-button-list" style={{ marginBottom: "2rem", display: "flex", gap: "1rem", alignItems: "center" }}>
        <button
          onClick={toggleInput}
          style={{
            backgroundColor: "#1f1e27",
            color: "#ff005d",
            padding: "0.5rem 1rem",
            borderRadius: "4px",
            border: "solid 2px",
          }}
        >
          New Project
        </button>
  
        <button
          onClick={handleLogout}
          style={{
            backgroundColor: "#1f1e27",
            color: "#ff005d",
            padding: "0.5rem 1rem",
            borderRadius: "4px",
            border: "solid 2px",
          }}
        >
          Logout
        </button>
  
  {/* search box style */}
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search Projects"
          style={{
          padding: "0.5rem",
          width: "300px",
          borderRadius: "4px",
          border: "2px solid",
          marginLeft: "1rem",
          color: "#ff005d",
          backgroundColor: "#1f1e27",
          }}
        />
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
              backgroundColor: "#1f1e27",
              color: "#ff005d",
              padding: "0.5rem 1rem",
              borderRadius: "4px",
              border: "solid 2px",
            }}
          >
            Create Project
          </button>
        </div>
      )}
  
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem",color: "#ff005d", }}>Your Projects</h1>
      <h2 style={{ color: "#ff005d", marginBottom: "1rem" }}>
      🔥 Current Streak: {localStorage.getItem('streakCount') || 0} days
      </h2>
  
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {/* Project List Item setup */}
        {filteredProjects.map((proj) => (
          <div
            key={proj.id}
            style={{
              backgroundColor: "#1f1e27",
              color: "#ff005d",
              border:"solid 2px",
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
            <p style={{ color: "#ff005d", fontSize: "0.9rem" }}>
              Created: {new Date(proj.created_at).toLocaleDateString()}
            </p>
  
            <button
              onClick={() => handleDeleteProject(proj.id)}
              style={{
                backgroundColor: "#1f1e27",
                color: "#ff005d",
                padding: "0.5rem 1rem",
                borderRadius: "4px",
                border: "solid 2px",
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
