import axios from "axios";

const API_URL = "http://localhost:5000";

export const api = axios.create({
    baseURL: API_URL,
    headers: { "Content-Type": "application/json" },
});

export const getMessage = async () => {
    try {
        const response = await api.get("/");
        return response.data;
    } catch (error) {
        console.error("Error fetching message:", error);
        throw error;
    }
};

export const createNote = async (title: string, content: string) => {
    try {
        const response = await api.post("/notes", { title, content });
        return response.data;
    } catch (error) {
        console.error("Error creating note:", error);
        throw error;
    }
};