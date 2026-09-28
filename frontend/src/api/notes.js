import { api } from "./client";

export const notesApi = {
  list: (interviewId) => api.get(`/interviews/${interviewId}/notes`),
  create: (interviewId, data) => api.post(`/interviews/${interviewId}/notes`, data),
  update: (noteId, data) => api.patch(`/interviews/notes/${noteId}`, data),
};
