import React, { useState, CSSProperties } from "react";
import { useNavigate } from "react-router-dom";

const apiBase = process.env.REACT_APP_API_BASE;

const RegisterPage: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  //Focus state tracker
  const [isFocused, setIsFocused] = useState(false);

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const response = await fetch(`${apiBase}/api/auth/register`, {
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
{/* Name input box */}
        <input 
          type="text" 
          placeholder="Name" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          onFocus={() => setIsFocused(true)}  // Set focus state to true
          onBlur={() => setIsFocused(false)}   // Set focus state to false
          style={{
            ...styles.input,
            backgroundColor: isFocused ? "#282c34" :"#1f1e27" ,  // Conditional background color
            color: isFocused ? "antiquewhite" : "#ff005d",//conditional text color
          }}

        />
{/* email input box */}
        <input 
          type="email" 
          placeholder="Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          onFocus={() => setIsFocused(true)}  // Set focus state to true
          onBlur={() => setIsFocused(false)}   // Set focus state to false
          style={{
            ...styles.input,
            backgroundColor: isFocused ? "#282c34" :"#1f1e27" ,  // Conditional background color
            color: isFocused ? "antiquewhite" : "#ff005d",//conditional text color
          }}

        />
{/* password input box */}
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          onFocus={() => setIsFocused(true)}  // Set focus state to true
          onBlur={() => setIsFocused(false)}   // Set focus state to false
          style={{
            ...styles.input,
            backgroundColor: isFocused ? "#282c34" :"#1f1e27" ,  // Conditional background color
            color: isFocused ? "antiquewhite" : "#ff005d",//conditional text color
          }}

        />
{/* confirm password input box */}
        <input 
          type="password" 
          placeholder="Confirm Password" 
          value={confirmPassword} 
          onChange={(e) => setConfirmPassword(e.target.value)} 
          onFocus={() => setIsFocused(true)}  // Set focus state to true
          onBlur={() => setIsFocused(false)}   // Set focus state to false
          style={{
            ...styles.input,
            backgroundColor: isFocused ? "#282c34" :"#1f1e27" ,  // Conditional background color
            color: isFocused ? "antiquewhite" : "#ff005d",//conditional text color
          }}

        />
{/* register button */}
        <button onClick={handleRegister} style={styles.button}>Register</button>

        <p style={styles.backText}>Already have an account?</p>
        {/* back button */}
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
    backgroundColor: "#1f1e27",
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "#E0E1DD",
  },
  box: {
    backgroundColor: "#282c34",
    color:"#ff005d",
    padding: "30px",
    border: "2px solid",
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
    color: "#ff005d",
    marginBottom: "10px",
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
    border: "2px solid",
    transition: "background-color 0.3s ease",
    fontSize: "16px",
    textAlign: "center",
  },
  button: {
    width: "95%",
    padding: "10px",
    marginTop: "10px",
    backgroundColor: "#1f1e27",
    color: "#ff005d",
    border: "2px solid",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "16px",
    transition: "background-color 2.0s ease, color 2.0s ease",
  },
  backText: {
    marginTop: "15px",
    fontSize: "14px",
    color: "#f9508e",
  },
  backButton: {
    marginTop: "5px",
    padding: "8px 15px",
    backgroundColor: "#1f1e27",
    color: "#ff005d",
    border: "2px solid",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
    width: "95%",
  },

};

export default RegisterPage;
