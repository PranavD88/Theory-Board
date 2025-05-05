import React, { useState, CSSProperties } from "react";
import { useNavigate } from "react-router-dom";

const apiBase = process.env.REACT_APP_API_BASE;

interface LoginPageProps {
  setIsAuthenticated: (isAuth: boolean) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ setIsAuthenticated }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null); // Track error message
  const navigate = useNavigate();

  //Focus state tracker
  const [isFocused, setIsFocused] = useState(false);
  //hover tracker
  const [isHovered, setIsHovered] = useState(false);
  //tracks if login has failed
  const [isFailedLogin, setIsFailedLogin] = useState(false);


  const handleLogin = async () => {
    try {
      const response = await fetch(`${apiBase}/api/auth/login`, {
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
        setError(error.message); // Set error message
        setIsFailedLogin(true)//activates register button highlight
      } else {
        setError("An unexpected error occurred.");
        setIsFailedLogin(false)//deactivates register button highlight
      }
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        <h1 style={styles.title}>Theory Board</h1>
        <p style={styles.subtitle}>Your New Personal Knowledge Management System</p>

        {error && (
          <div style={styles.errorBox}>
            <span style={styles.errorIcon}>✖</span>
            <span>{error}</span>
          </div>
        )}
        
        <div style={styles.inputContainer}> 
          {/* Email Input box */}
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
        </div>

        <div style={styles.inputContainer}>
          {/* Password Input box */}
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
        </div>
            {/* Login Button */}
        <button onClick={handleLogin}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            ...styles.button,
            backgroundColor: isHovered ? "#ff005d" : "#1f1e27",// Conditional background color
            color: isHovered ? "#1f1e27" : "#ff005d",//conditional text color
          }}
        >Login</button>

        <p style={{
          ...styles.registerText,
          color: isFailedLogin ? "#ff005d" : "#f9508e",//conditional text color
          fontSize:isFailedLogin ? "15px" : "10px",
        }}>Don't have an account?</p>
            {/* Register Button */}
        <button onClick={() => navigate("/register")}
           style={{
            ...styles.button,
            backgroundColor: isFailedLogin ? "#ff005d" : "#1f1e27",// Conditional background color
            color: isFailedLogin ? "#1f1e27" : "#ff005d",//conditional text color
            padding: isFailedLogin ? "15px" : "10px",//conditional button scale
          }}>

          Register
        </button>
      </div>
    </div>
  );
};

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
  subtitle: {
    fontSize: "14px",
    color: "#f9508e",
    marginBottom: "20px",

  },
  errorBox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ff005d",
    color: "#1f1e27",
    padding: "10px",
    borderRadius: "4px",
    marginBottom: "15px",
    width: "90%",
  },
  errorIcon: {
    marginRight: "8px",
    fontWeight: "bold",
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
    border: "2px solid",
    transition: "background-color 0.3s ease",
    fontSize: "16px",
    textAlign: "center",
  },
  button: {
    width: "95%",
    padding: "10px",
    marginTop: "10px",
    backgroundColor: "#778DA9",
    color: "#0D1B2A",
    border: "2px solid",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "16px",
    transition: "background-color 2.0s ease, color 2.0s ease, padding 0.3s ease",
  },
  registerText: {
    marginTop: "15px",
    fontSize: "14px",
    color: "#f9508e",
    transition: "font-size 2.0s ease, color 2.0s ease",
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
