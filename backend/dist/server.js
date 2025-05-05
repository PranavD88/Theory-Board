"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const noteRoutes_1 = __importDefault(require("./routes/noteRoutes"));
const projectRoutes_1 = __importDefault(require("./routes/projectRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
exports.app = app;
const PORT = process.env.PORT || 5000;
// Middleware
const allowedOrigins = [
    "http://localhost:3000",
    "https://theory-board.onrender.com"
];
app.use((0, cors_1.default)({
    origin: allowedOrigins,
    credentials: true
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
// Register routes
app.use("/api/auth", authRoutes_1.default);
app.use("/api/notes", noteRoutes_1.default);
app.use("/api/projects", projectRoutes_1.default);
console.log("Registered Routes:");
[...authRoutes_1.default.stack, ...noteRoutes_1.default.stack].forEach((layer) => {
    if (layer.route) {
        console.log(layer.route.path, Object.keys(layer.route.methods || {}));
    }
});
// Start server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
