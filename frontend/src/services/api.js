import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

/** Creates a new room, returns { roomId, language } */
export const createRoom = async () => {
  const { data } = await api.post("/api/rooms");
  return data;
};

/** Fetches room metadata (language, lastUpdated). Creates room if not found. */
export const getRoom = async (roomId) => {
  const { data } = await api.get(`/api/rooms/${roomId}`);
  return data;
};

export default api;
