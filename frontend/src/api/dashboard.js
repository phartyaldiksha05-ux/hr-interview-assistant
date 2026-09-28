import { api } from "./client";

export const dashboardApi = {
  stats: () => api.get("/dashboard/stats"),
  pendingFeedback: () => api.get("/dashboard/pending-feedback"),
};
