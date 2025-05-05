import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
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

const verifyToken = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
  const token = req.cookies.token;
  if (!token) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    (req as any).user = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

// Register routes
app.use("/api/auth", authRoutes);
app.use("/api/notes", verifyToken, noteRoutes);
app.use("/api/projects", verifyToken, projectRoutes);

console.log("Registered Routes:");
[...authRoutes.stack, ...noteRoutes.stack].forEach((layer: any) => {
  if (layer.route) {
    console.log(layer.route.path, Object.keys(layer.route.methods || {}));
  }
});

// Start server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

export { app };
