export const API_VERSION = (process.env.NEXT_PUBLIC_API_VERSION || 'v1').toLowerCase();
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function getAuthHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('campushub_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function getApiEndpoint(endpointPath: string): string {
  const cleanPath = endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`;
  return `${API_BASE_URL}/api/${API_VERSION}${cleanPath}`;
}

export async function apiRequest<T = any>(
  endpointPath: string,
  options: RequestInit = {}
): Promise<T> {
  const url = getApiEndpoint(endpointPath);
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
    const error: any = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data as T;
}

export async function apiUpload<T = any>(
  endpointPath: string,
  formData: FormData
): Promise<T> {
  const url = getApiEndpoint(endpointPath);
  const headers = {
    ...getAuthHeader(),
  };

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Upload failed with status ${response.status}`;
    const error: any = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data as T;
}

export function getDocumentDownloadUrl(filename: string): string {
  return getApiEndpoint(`/documents/${encodeURIComponent(filename)}`);
}

export function getSubmissionDownloadUrl(filename: string): string {
  return getApiEndpoint(`/assignments/uploads/${encodeURIComponent(filename)}`);
}
