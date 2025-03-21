import React, { useState } from 'react';
import NavButton from "./navigation";
import "../App.css";


const ProjectsList: React.FC = () => {
  const [projName, setProjName] = useState<string>('');// variable and function to record project Name
  const [showInput, setShowInput] = useState<boolean>(false);  // variable and function to toggle input visibility

  const handleInputChange = 
        (e: React.ChangeEvent<HTMLInputElement>) => {
          setProjName(e.target.value);
        };

  const toggleInput = () => {
          setShowInput(!showInput);  // Toggles input visibility
        };
  return (
    <div>
      <div  className="Menu-button-list">
      <NavButton Path="/" Text="Go Back to Home" />
      <button onClick={toggleInput}>New Project
      </button>
      
      <button>Delete Project</button>
      </div>

      <div>
        {showInput && (
            <input
              type="text"
              id="projName"
              onChange={handleInputChange}
              placeholder="Enter Project Name"
            />
            
          )}
          {showInput && (<button className='InputAccept'>Create Poject</button>)}
        <h1>Projects Page</h1>
        <p>This is the projects page.</p>
      </div>
    </div>
  );
};

export default ProjectsList;