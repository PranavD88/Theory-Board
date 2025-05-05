"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("./db"));
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASS:", process.env.DB_PASS);
db_1.default.query("SELECT NOW()", (err, res) => {
    if (err) {
        console.error("❌ Database connection error:", err);
    }
    else {
        console.log("✅ Database connected successfully!", res.rows);
    }
    process.exit();
});
