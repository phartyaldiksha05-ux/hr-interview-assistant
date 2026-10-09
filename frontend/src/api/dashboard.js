import { api } from "./client";

export const dashboardApi = {
  stats: () => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    return api.get(`/dashboard/stats?timezone=${encodeURIComponent(timezone)}`);
  },
  pendingFeedback: () => api.get("/dashboard/pending-feedback"),
};
