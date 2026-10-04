export type Domain = "education" | "employment" | "finance" | "healthcare" | string;

export interface SubIds {
  education?: string;
  employment?: string;
  finance?: string;
  healthcare?: string;
  [domain: string]: string | undefined;
}

export interface CitizenProfile {
  citizen_id: string;
  name: string;
  dob: string;
  root_id: string;
  sub_ids: SubIds;
  [key: string]: unknown;
}

export interface RecordItem {
  record_id?: string;
  id?: string;
  title: string;
  content: string;
  signature?: string;
  institution_name?: string;
  issuer?: string;
  institution?: { name?: string } | string;
  domain: Domain;
  created_at?: string;
  [key: string]: unknown;
}

export interface RegisterResponse {
  citizen_id: string;
  root_id: string;
  sub_ids: SubIds;
}

export interface IssueResponse {
  record_id: string;
  signature: string;
}

export interface ShareResponse {
  share_code: string;
}

export interface VerifyResponse {
  valid: boolean;
  title?: string;
  domain?: string;
  issuer?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const payload = await response.json();
      if (typeof payload?.detail === "string") message = payload.detail;
      else if (Array.isArray(payload?.detail)) message = payload.detail.map((item: { msg?: string }) => item.msg).filter(Boolean).join(", ");
      else if (typeof payload?.message === "string") message = payload.message;
    } catch {
      // Keep the HTTP status message when the backend does not return JSON.
    }
    throw new Error(message);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  register: (body: { name: string; dob: string }) => request<RegisterResponse>("/register", {
    method: "POST",
    body: JSON.stringify(body),
  }),
  getCitizen: (citizenId: string) => request<CitizenProfile>(`/citizens/${encodeURIComponent(citizenId)}`),
  getRecords: (citizenId: string) => request<RecordItem[]>(`/citizens/${encodeURIComponent(citizenId)}/records`),
  issueRecord: (body: { sub_id: string; institution_name: string; title: string; content: string }) => request<IssueResponse>("/institutions/issue", {
    method: "POST",
    body: JSON.stringify(body),
  }),
  createShare: (body: { record_id: string; verifier_name: string }) => request<ShareResponse>("/consent/share", {
    method: "POST",
    body: JSON.stringify(body),
  }),
  verifyShare: (body: { share_code: string }) => request<VerifyResponse>("/consent/verify", {
    method: "POST",
    body: JSON.stringify(body),
  }),
};

export { API_BASE_URL };
