import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import Body from "./components/Body";

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Check if user is logged in on first load
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
        {/* Redirect to main page if already logged in */}
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <LoginPage setIsAuthenticated={setIsAuthenticated} />} />
        
        {/* Pass setIsAuthenticated to Body */}
        <Route path="/" element={isAuthenticated ? <Body setIsAuthenticated={setIsAuthenticated} /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  );
};

export default App;