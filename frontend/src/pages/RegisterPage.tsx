import React, { useState, CSSProperties } from "react";
import { useNavigate } from "react-router-dom";

const RegisterPage: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Registration failed");
      }

      alert("Registration successful! You can now log in.");
      navigate("/login");
    } catch (error) {
      console.error("Registration error:", error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unexpected error occurred.");
      }
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        <h1 style={styles.title}>Create Your Account</h1>

        {error && <p style={styles.errorText}>{error}</p>}

        <input 
          type="text" 
          placeholder="Name" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          style={styles.input} 
        />

        <input 
          type="email" 
          placeholder="Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          style={styles.input} 
        />

        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          style={styles.input} 
        />

        <input 
          type="password" 
          placeholder="Confirm Password" 
          value={confirmPassword} 
          onChange={(e) => setConfirmPassword(e.target.value)} 
          style={styles.input} 
        />

        <button onClick={handleRegister} style={styles.button}>Register</button>

        <p style={styles.backText}>Already have an account?</p>
        <button onClick={() => navigate("/login")} style={styles.backButton}>
          Back to Login
        </button>
      </div>
    </div>
  );
};

// Styles
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
    fontSize: "24px",
    color: "#E0E1DD",
    marginBottom: "15px",
  },
  errorText: {
    color: "red",
    fontSize: "14px",
    marginBottom: "10px",
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
  backText: {
    marginTop: "15px",
    fontSize: "14px",
    color: "#E0E1DD",
  },
  backButton: {
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

export default RegisterPage;
