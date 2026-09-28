import { api } from "./client";

export const remindersApi = {
  due: () => api.get("/reminders/due"),
  acknowledge: (id) => api.patch(`/reminders/${id}/acknowledge`, {}),
};
