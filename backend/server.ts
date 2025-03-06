import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes";

console.log("Imported authRoutes:", authRoutes);


dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(cookieParser());
console.log("Attempting to load authRoutes:", authRoutes);
app.use("/api/auth", authRoutes);

console.log("✅ Registered Routes:");
(authRoutes as any).stack.forEach((layer: any) => {
    if (layer.route) {
        console.log(layer.route.path, Object.keys(layer.route.methods || {}));
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export { app };
