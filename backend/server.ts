import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes";
import noteRoutes from "./routes/noteRoutes";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Register routes
app.use("/api/auth", authRoutes);
app.use("/api/notes", noteRoutes);

console.log("✅ Registered Routes:");
[...authRoutes.stack, ...noteRoutes.stack].forEach((layer: any) => {
    if (layer.route) {
        console.log(layer.route.path, Object.keys(layer.route.methods || {}));
    }
});

// Start server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

export { app };
