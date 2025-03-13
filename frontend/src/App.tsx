import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import GraphView, { GraphViewHandles } from "./components/GraphView";
import MenuButton from "./components/MenuButton";
import Header from "./components/Header";

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
          element={
            isAuthenticated ? (
              <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
                <GraphView ref={graphRef} />
                <MenuButton
                  setIsAuthenticated={setIsAuthenticated}
                  addNode={(newNote) => graphRef.current?.addNode(newNote)}
                  addEdge={(fromNoteId, toNoteId) => graphRef.current?.addEdge(fromNoteId, toNoteId)}
                  clearGraph={() => graphRef.current?.clearGraph()}
                />
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
