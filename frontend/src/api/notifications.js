import { api } from "./client";

export const pushNotificationsApi = {
  subscribe: (subscription) => api.post("/notifications/push/subscribe", subscription),
  unsubscribe: (endpoint) => api.delete("/notifications/push/subscribe", { endpoint }),
  status: () => api.get("/notifications/push/status"),
};
