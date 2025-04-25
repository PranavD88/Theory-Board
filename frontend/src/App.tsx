import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import "./App.css";
import GraphView, { GraphViewHandles } from "./components/GraphView";
import MenuButton from "./components/MenuButton";
import Projects from "./pages/projects"; 
import GraphPage from "./pages/GraphPage";

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
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" /> : <LoginPage setIsAuthenticated={setIsAuthenticated} />}
        />
        <Route
          path="/register"
          element={isAuthenticated ? <Navigate to="/" /> : <RegisterPage />}
        />

        <Route
          path="/"
          element={isAuthenticated ? <Projects /> : <Navigate to="/login" />}
        />

        <Route
          path="/projects"
          element={isAuthenticated ? <Projects /> : <Navigate to="/login" />}
        />

        <Route
          path="/graph/:projectId"
          element={isAuthenticated ? <GraphPage /> : <Navigate to="/login" />}
        />

        <Route
          path="/graph/active"
          element={
            isAuthenticated ? (
              <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
                <div className="Menu-button-list">
                  <button>New Project</button>
                  <button>Open Projects</button>
                  <button>Delete Project</button>
                </div>
                <div className="Graph-area">
                  <GraphView ref={graphRef} />
                  <MenuButton
                    setIsAuthenticated={setIsAuthenticated}
                    addNode={(newNote) => graphRef.current?.addNode(newNote)}
                    addEdge={(fromNoteId, toNoteId) => graphRef.current?.addEdge(fromNoteId, toNoteId)}
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
