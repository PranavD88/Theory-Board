import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes";
import noteRoutes from "./routes/noteRoutes";
import projectRoutes from "./routes/projectRoutes";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = [
  "http://localhost:3000",
  "https://theory-board.onrender.com"
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Register routes
app.use("/api/auth", authRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/projects", projectRoutes);

console.log("Registered Routes:");
[...authRoutes.stack, ...noteRoutes.stack].forEach((layer: any) => {
    if (layer.route) {
        console.log(layer.route.path, Object.keys(layer.route.methods || {}));
    }
});

// Start server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

export { app };
