import { api } from "./client";

export const questionsApi = {
  list: (interviewId) => api.get(`/interviews/${interviewId}/questions`),
  save: (interviewId, questions) => api.put(`/interviews/${interviewId}/questions`, questions),
};
