import { api } from "./client";

export const candidatesApi = {
  list: () => api.get("/candidates"),
  archived: () => api.get("/candidates/archived"),
  get: (id) => api.get(`/candidates/${id}`),
  getByEmail: (email) => api.get(`/candidates/by-email?email=${encodeURIComponent(email)}`),
  resumes: (id) => api.get(`/candidates/${id}/resumes`),
  create: (data) => api.post("/candidates", data),
  update: (id, data) => api.patch(`/candidates/${id}`, data),
  remove: (id) => api.delete(`/candidates/${id}`),
  restore: (id) => api.post(`/candidates/${id}/restore`, {}),
  uploadResume: (id, file, onProgress) => {
    const form = new FormData();
    form.append("file", file);
    return api.upload(`/candidates/${id}/resume`, form, onProgress);
  },
  downloadResume: (candidateId, resumeId, filename) =>
    api.download(`/candidates/${candidateId}/resumes/${resumeId}/file`, filename),
};
