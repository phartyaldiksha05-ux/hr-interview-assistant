import { api } from "./client";

export const authApi = {
  register: (data) => api.post("/auth/register", data),
  verifyOtp: (data) => api.post("/auth/verify-otp", data),
  resendOtp: (data) => api.post("/auth/resend-otp", data),
  login: (data) => api.post("/auth/login", data),
  me: () => api.get("/auth/me"),
};