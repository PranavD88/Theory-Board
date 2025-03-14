import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import "./App.css";
import GraphView, { GraphViewHandles } from "./components/GraphView";
import MenuButton from "./components/MenuButton";


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
              style={{ width: "100vw", height: "100vh", position: "relative" }}
              >
                {/* Project Menu Area */}
                <div className="Menu-button-list">
                  <button>New Project</button>
                  <button>Open Project</button>
                  <button>Delete Project</button>                  
                </div>
                  {/* Note Menu area */}
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
      </Routes>
    </Router>
  );
};

export default App;
