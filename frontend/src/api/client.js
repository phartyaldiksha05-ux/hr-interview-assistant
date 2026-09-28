const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";
const TOKEN_KEY = "hr_assistant_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function friendlyError(status, body, fallback = "Request failed.", path = "") {
  if (status === 0) return "Meetwise could not connect to the backend. Check your connection and try again.";
  if (status === 401) return "Your session has expired. Sign in again.";
  if (status === 404) return "This record could not be found. It may have been archived or access changed.";
  if (status === 409 && path.startsWith("/candidates")) return "A candidate with this email already exists in your workspace.";
  if (status === 409) return "This action conflicts with an existing record. Refresh and try again.";
  if (status === 413) return "This PDF is too large. Choose a file under 10 MB.";
  if (status === 422) return "Some information is missing or invalid. Review the fields and try again.";
  if (status >= 500) return "Meetwise could not complete that request. Please retry; your saved candidate information was not removed.";
  const detail = typeof body?.detail === "string" ? body.detail : null;
  return detail ?? fallback;
}

async function errorBody(response) {
  const responseText = await response.text();
  try {
    return responseText ? JSON.parse(responseText) : null;
  } catch {
    return null;
  }
}

export async function request(path, options = {}) {
  const token = getToken();
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      headers: options.body instanceof FormData
        ? { ...authHeader, ...options.headers }
        : { "Content-Type": "application/json", ...authHeader, ...options.headers },
      ...options,
    });
  } catch (error) {
    throw new ApiError(friendlyError(0), 0);
  }

  if (response.status === 401) {
    // Token missing/expired/invalid. Clear it and force back to login rather than
    // showing a confusing "request failed" error on every panel of the app.
    clearToken();
    if (!path.startsWith("/auth/")) {
      window.location.href = "/login";
    }
  }

  if (!response.ok) {
    const body = await errorBody(response);
    throw new ApiError(friendlyError(response.status, body, `Request failed (${response.status}).`, path), response.status);
  }

  return response.status === 204 ? null : response.json();
}

export function upload(path, formData, onProgress = () => {}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BASE_URL}${path}`);
    xhr.timeout = 120000;
    const token = getToken();
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    });
    xhr.addEventListener("load", () => {
      let body = null;
      try { body = xhr.responseText ? JSON.parse(xhr.responseText) : null; } catch { /* handled below */ }
      if (xhr.status === 401) {
        clearToken();
        window.location.href = "/login";
      }
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new ApiError(friendlyError(xhr.status, body, `Upload failed (${xhr.status}).`, path), xhr.status));
        return;
      }
      resolve(body);
    });
    xhr.addEventListener("error", () => reject(new ApiError(friendlyError(0), 0)));
    xhr.addEventListener("timeout", () => reject(new ApiError("Resume upload timed out. Retry the upload.", 0)));
    xhr.addEventListener("abort", () => reject(new ApiError("Resume upload was interrupted. Retry the upload.", 0)));
    xhr.send(formData);
  });
}

async function download(path, filename) {
  const token = getToken();
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  } catch {
    throw new ApiError(friendlyError(0), 0);
  }
  if (response.status === 401) {
    clearToken();
    window.location.href = "/login";
  }
  if (!response.ok) {
    const body = await errorBody(response);
    throw new ApiError(friendlyError(response.status, body, `Download failed (${response.status}).`, path), response.status);
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body: body instanceof FormData ? body : JSON.stringify(body) }),
  upload: (path, body, onProgress) => upload(path, body, onProgress),
  patch: (path, body) => request(path, { method: "PATCH", body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: "DELETE" }),
  download,
};
