import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

interface LoginPageProps {
  setIsAuthenticated: (isAuth: boolean) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ setIsAuthenticated }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login failed");
      }

      setIsAuthenticated(true);
      navigate("/");
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("An unexpected error occurred.");
      }
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "50px", backgroundColor: "#f4f4f4", height: "100vh" }}>
      <h2>Login</h2>
      <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ margin: "10px", padding: "10px" }} />
      <br />
      <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ margin: "10px", padding: "10px" }} />
      <br />
      <button onClick={handleLogin} style={{ padding: "10px 20px", marginTop: "10px" }}>
        Login
      </button>
    </div>
  );
};

export default LoginPage;
