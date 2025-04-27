import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import "./App.css";
import GraphView, { GraphViewHandles } from "./components/GraphView";
import MenuButton from "./components/MenuButton";
import NavButton from "./pages/navigation";
import ProjectsList from "./pages/projects";


const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const graphRef = useRef<GraphViewHandles>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/auth/user", {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
      }
    };

    checkAuth();
  }, []);

  return (
    <Router>
      <Routes>
        {/* takes user login and for backend comparison*/}
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/" /> : <LoginPage setIsAuthenticated={setIsAuthenticated} />} 
        />
        {/* Registers account to backend process */}
        <Route 
          path="/register" 
          element={isAuthenticated ? <Navigate to="/" /> : <RegisterPage />} 
        />
        
        <Route
          path="/"
          element={
            // if authenticated login, loads the app view for the account
            isAuthenticated ? (
              <div 
              style={{ width: "100vw", height: "70vh", position: "relative" }}
              > <div className="buffer"></div>
                {/* Project Menu Area */}
                <div className="Menu-button-list">
                  <button>New Project</button>
                  <NavButton Path="./projects" Text="Open Projects" /> 
                  {/* to do -- make projects be instances of app */}
                  <button>Delete Project</button>                  
                </div>

                  
                <div className="Graph-area">
                  {/* creates graph view in app */}
                  <GraphView ref={graphRef} />

                  {/* Handles node instance in graph view */}
                 <MenuButton
                    setIsAuthenticated={setIsAuthenticated}
                    //adds new node instance to graph
                    addNode={(newNote) => graphRef.current?.addNode(newNote)}
                    // links 2 node instances on graph
                    addEdge={(fromNoteId, toNoteId) => graphRef.current?.addEdge(fromNoteId, toNoteId)}
                    //clears all instances
                    clearGraph={() => graphRef.current?.clearGraph()}
                  /> 
                </div>
                
                
              </div>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route 
          path="/projects" 
          element={isAuthenticated ? <ProjectsList /> : <Navigate to="/login" />} 
        />
      </Routes>
    </Router>
  );
};

export default App;
