import React from "react";
import NavButton from "./navigation";
import "../App.css";


const ProjectsList: React.FC = () => {
  return (
    <div>
      <div  className="Menu-button-list">
      <NavButton Path="/" Text="Go Back to Home" />
      </div>

      <div>
        <h1>Projects Page</h1>
        <p>This is the projects page.</p>
      </div>
    </div>
  );
};

export default ProjectsList;