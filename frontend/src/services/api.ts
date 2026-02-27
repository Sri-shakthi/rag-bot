
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  imageUrl?: string;
}

export interface LegalCase {
  id: string;
  name: string;
  jurisdiction: string;
  year: number;
  description: string;
  content?: string;
}

export interface AuthUser {
  sub: string;
  email: string;
  name: string;
  picture?: string;
}

interface ChatApiResponse {
  reply: string;
  confidenceScore?: number;
}

export interface UploadedDocument {
  id: string;
  sessionId: string;
  fileName: string;
  createdAt: string;
}

export interface BackendSession {
  sessionId: string;
  caseId: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  createdAt: string;
  updatedAt: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {})
    },
    ...init
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || 'Request failed');
  }

  return data as T;
}

export async function sendAiMessage(
  sessionId: string,
  caseId: string,
  userMessage: string,
  _history: Array<{ role: 'user' | 'assistant'; content: string }>,
  documentId?: string
): Promise<ChatApiResponse> {
  return apiFetch<ChatApiResponse>('/api/chat', {
    method: 'POST',
    body: JSON.stringify({
      sessionId,
      caseId,
      documentId: documentId || null,
      message: userMessage
    })
  });
}

export async function fetchCases(): Promise<{ cases: LegalCase[] }> {
  return apiFetch<{ cases: LegalCase[] }>('/api/cases', { method: 'GET' });
}

export async function fetchCaseById(caseId: string): Promise<{ case: LegalCase }> {
  return apiFetch<{ case: LegalCase }>(`/api/cases/${caseId}`, { method: 'GET' });
}

export async function fetchSessions(caseId?: string): Promise<{ sessions: BackendSession[] }> {
  const path = caseId
    ? `/api/chat/sessions?caseId=${encodeURIComponent(caseId)}`
    : '/api/chat/sessions';
  return apiFetch<{ sessions: BackendSession[] }>(path, { method: 'GET' });
}

export async function createSession(sessionId: string, caseId: string): Promise<{ session: BackendSession }> {
  return apiFetch<{ session: BackendSession }>('/api/chat/sessions', {
    method: 'POST',
    body: JSON.stringify({ sessionId, caseId })
  });
}

export async function uploadDocument(
  sessionId: string,
  caseId: string,
  file: File
): Promise<{ documentId: string; fileName: string; chunks: number }> {
  const form = new FormData();
  form.append('sessionId', sessionId);
  form.append('caseId', caseId);
  form.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/documents/upload`, {
    method: 'POST',
    credentials: 'include',
    body: form
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.message || 'Upload failed');
  return data;
}

export async function fetchUploadedDocuments(
  sessionId: string
): Promise<{ documents: UploadedDocument[] }> {
  return apiFetch<{ documents: UploadedDocument[] }>(
    `/api/documents?sessionId=${encodeURIComponent(sessionId)}`,
    { method: 'GET' }
  );
}

export async function loginWithGoogle(idToken: string): Promise<{ user: AuthUser }> {
  return apiFetch<{ user: AuthUser }>('/api/auth/google', {
    method: 'POST',
    body: JSON.stringify({ idToken })
  });
}

export async function getCurrentUser(): Promise<{ user: AuthUser }> {
  return apiFetch<{ user: AuthUser }>('/api/auth/me', {
    method: 'GET'
  });
}

export async function logoutUser(): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>('/api/auth/logout', {
    method: 'POST'
  });
}

export const generateImage = async (prompt: string): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Return a placeholder image URL
      resolve(`https://picsum.photos/seed/${encodeURIComponent(prompt)}/800/600`);
    }, 2000);
  });
};
