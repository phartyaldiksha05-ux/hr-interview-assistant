import { api } from "./client";

export const aiApi = {
  generateSummary: (candidateId) => api.post(`/ai/candidates/${candidateId}/summary`, {}),
  getSummary: (candidateId) => api.get(`/ai/candidates/${candidateId}/summary`),
  getCandidateQuestions: (candidateId) => api.get(`/ai/candidates/${candidateId}/questions`),
  generateCandidateQuestions: (candidateId, targetJobRole) => api.post(`/ai/candidates/${candidateId}/questions`, { target_job_role: targetJobRole }),
  saveCandidateQuestions: (candidateId, questions) => api.put(`/ai/candidates/${candidateId}/questions`, questions),
  generateQuestions: (interviewId, targetJobRole) => api.post(`/ai/interviews/${interviewId}/questions`, { target_job_role: targetJobRole }),
  generatePostSummary: (interviewId) => api.post(`/ai/interviews/${interviewId}/post-summary`, {}),
  getPostSummary: (interviewId) => api.get(`/ai/interviews/${interviewId}/post-summary`),
  savePostSummary: (interviewId, content) => api.put(`/ai/interviews/${interviewId}/post-summary`, content),
};
