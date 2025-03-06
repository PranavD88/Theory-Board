import React, { useState, CSSProperties } from "react";
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
    <div style={styles.container}>
      <div style={styles.box}>
        <h1 style={styles.title}>Theory Board</h1>
        <p style={styles.subtitle}>Your New Personal Knowledge Management System</p>

        <div style={styles.inputContainer}>
          <input 
            type="email" 
            placeholder="Email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            style={styles.input} 
          />
        </div>

        <div style={styles.inputContainer}>
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            style={styles.input} 
          />
        </div>

        <button onClick={handleLogin} style={styles.button}>Login</button>

        <p style={styles.registerText}>Don't have an account?</p>
        <button onClick={() => navigate("/register")} style={styles.registerButton}>
          Register
        </button>
      </div>
    </div>
  );
};

const styles: Record<string, CSSProperties> = {
  container: {
    backgroundColor: "#0D1B2A",
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "#E0E1DD",
  },
  box: {
    backgroundColor: "#1B263B",
    padding: "30px",
    borderRadius: "8px",
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.3)",
    textAlign: "center",
    width: "350px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  title: {
    fontSize: "26px",
    color: "#E0E1DD",
    marginBottom: "10px",
  },
  subtitle: {
    fontSize: "14px",
    color: "#778DA9",
    marginBottom: "20px",
  },
  inputContainer: {
    width: "100%",
    display: "flex",
    justifyContent: "center",
  },
  input: {
    width: "90%",
    padding: "10px",
    margin: "8px 0",
    borderRadius: "4px",
    border: "none",
    backgroundColor: "#415A77",
    color: "#E0E1DD",
    fontSize: "16px",
    textAlign: "center",
  },
  button: {
    width: "95%",
    padding: "10px",
    marginTop: "10px",
    backgroundColor: "#778DA9",
    color: "#0D1B2A",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "16px",
  },
  registerText: {
    marginTop: "15px",
    fontSize: "14px",
    color: "#E0E1DD",
  },
  registerButton: {
    marginTop: "5px",
    padding: "8px 15px",
    backgroundColor: "#415A77",
    color: "#E0E1DD",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
    width: "95%",
  },
};

export default LoginPage;
