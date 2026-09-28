import { api } from "./client";

export const interviewsApi = {
  list: () => api.get("/interviews"),
  get: (id) => api.get(`/interviews/${id}`),
  create: (data) => api.post("/interviews", data),
  update: (id, data) => api.patch(`/interviews/${id}`, data),
  remove: (id) => api.delete(`/interviews/${id}`),
};
