import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  timeout: 60000, // 60 seconds to allow for slow AI generation
  headers: { "Content-Type": "application/json" },
});

/** Creates a new workspace */
export const createWorkspace = async (name) => {
  const { data } = await api.post("/api/workspaces", { name });
  return data;
};

/** Joins a workspace */
export const joinWorkspace = async (roomId) => {
  const { data } = await api.post("/api/workspaces/join", { roomId });
  return data;
};

/** Fetches user workspaces */
export const getUserWorkspaces = async () => {
  const { data } = await api.get("/api/workspaces");
  return data;
};

/** Fetches workspace metadata */
export const getWorkspace = async (roomId) => {
  const { data } = await api.get(`/api/workspaces/${roomId}`);
  return data;
};

/** Deletes a workspace */
export const deleteWorkspace = async (roomId) => {
  const { data } = await api.delete(`/api/workspaces/${roomId}`);
  return data;
};

// Add interceptor to include auth token in requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- AI Endpoints ---

/** Requests AI Code Review */
export const requestAiReview = async (code, language) => {
  const { data } = await api.post("/api/ai/review", { code, language });
  return data; // { result, credits }
};

/** Requests AI Code Explanation */
export const requestAiExplain = async (code, language) => {
  const { data } = await api.post("/api/ai/explain", { code, language });
  return data; // { result, credits }
};

/** Requests AI Code Assistance (Refactoring/Generation) */
export const requestAiAssist = async (prompt, code, language) => {
  const { data } = await api.post("/api/ai/assist", { prompt, code, language });
  return data; // { result, credits }
};

/** Requests Stripe Checkout Session Setup */
export const requestStripeCheckout = async (planId, returnUrl) => {
  const { data } = await api.post("/api/stripe/create-checkout-session", { planId, returnUrl });
  return data; // { url }
};

/** Verifies Stripe Checkout Session */
export const verifyStripeSession = async (sessionId) => {
  const { data } = await api.post("/api/stripe/verify-session", { sessionId });
  return data;
};

/** Executes Code via Backend JDoodle Proxy */
export const executeCode = async (language, code) => {
  const { data } = await api.post("/api/execute", { language, code });
  return data;
};

export default api;
