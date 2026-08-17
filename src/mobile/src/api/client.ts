import { appStorage } from '../utils/storage';
import { Platform } from 'react-native';

// Public Production Backend API trên Railway (kết nối toàn cầu qua 4G, 5G và mọi mạng Wi-Fi)
export const API_BASE_URL = 'https://tinywin-production.up.railway.app/v1';

interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, any>;
}

let onAuthExpiredCallback: (() => void) | null = null;

export function setAuthExpiredHandler(handler: () => void) {
  onAuthExpiredCallback = handler;
}

// Lightweight, 100% native HTTP client (Hermes-compatible, zero private property issues)
export const apiClient = {
  async request<T>(method: string, endpoint: string, data?: any, options?: RequestOptions): Promise<{ data: T }> {
    let url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

    if (options?.params) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(options.params)) {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      }
      const queryString = searchParams.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    };

    try {
      const token = await appStorage.getItem('access_token');
      if (token && !headers['Authorization']) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn('Failed to load token', e);
    }

    const config: RequestInit = {
      method,
      headers,
    };

    if (data !== undefined && method !== 'GET' && method !== 'HEAD') {
      config.body = JSON.stringify(data);
    }

    let response: Response;
    try {
      response = await fetch(url, config);
    } catch (netErr: any) {
      console.warn('[API Network Error]', url, netErr);
      const err: any = new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng hoặc thử lại.');
      err.isNetworkError = true;
      throw err;
    }

    let responseData = await response.json().catch(() => null);

    // Auto token refresh on 401 for authenticated endpoints
    if (
      response.status === 401 &&
      !endpoint.includes('/auth/login') &&
      !endpoint.includes('/auth/register') &&
      !endpoint.includes('/auth/refresh')
    ) {
      try {
        const refreshToken = await appStorage.getItem('refresh_token');
        if (refreshToken) {
          const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
          });

          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            if (refreshData?.access_token) {
              await appStorage.setItem('access_token', refreshData.access_token);
              if (refreshData.refresh_token) {
                await appStorage.setItem('refresh_token', refreshData.refresh_token);
              }
              if (refreshData.user) {
                await appStorage.setItem('user_profile', JSON.stringify(refreshData.user));
              }

              // Retry original request with new access token
              headers['Authorization'] = `Bearer ${refreshData.access_token}`;
              const retryResponse = await fetch(url, { ...config, headers });
              if (retryResponse.ok) {
                const retryData = await retryResponse.json().catch(() => null);
                return { data: retryData as T };
              }
            }
          }
        }
      } catch (refreshErr) {
        console.warn('Auto refresh token failed:', refreshErr);
      }

      // If refresh failed, clear stale credentials to prevent loop
      await appStorage.multiRemove(['access_token', 'refresh_token', 'user_profile']).catch(() => {});
      if (onAuthExpiredCallback) {
        onAuthExpiredCallback();
      }
    }

    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status}`;
      if (responseData?.detail?.error?.message && typeof responseData.detail.error.message === 'string') {
        errorMessage = responseData.detail.error.message;
      } else if (responseData?.error?.message && typeof responseData.error.message === 'string') {
        errorMessage = responseData.error.message;
      } else if (typeof responseData?.detail === 'string') {
        errorMessage = responseData.detail;
      } else if (Array.isArray(responseData?.detail) && responseData.detail[0]?.msg) {
        errorMessage = responseData.detail[0].msg;
      } else if (response.status === 401) {
        errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
      } else if (response.status === 403) {
        errorMessage = 'Bảng tin bị khóa. Bạn cần đăng Tiny Win hôm nay để mở!';
      } else if (response.status === 409) {
        errorMessage = 'Email hoặc tên người dùng này đã được sử dụng.';
      }

      const error: any = new Error(errorMessage);
      error.response = {
        status: response.status,
        data: responseData,
      };
      throw error;
    }

    return { data: responseData as T };
  },

  get<T>(endpoint: string, options?: RequestOptions) {
    return this.request<T>('GET', endpoint, undefined, options);
  },

  post<T>(endpoint: string, data?: any, options?: RequestOptions) {
    return this.request<T>('POST', endpoint, data, options);
  },

  put<T>(endpoint: string, data?: any, options?: RequestOptions) {
    return this.request<T>('PUT', endpoint, data, options);
  },

  delete<T>(endpoint: string, options?: RequestOptions) {
    return this.request<T>('DELETE', endpoint, undefined, options);
  },
};

// Format API error message helper
export function extractErrorMessage(error: any): string {
  if (!error) return 'Có lỗi xảy ra. Vui lòng thử lại.';

  const data = error?.response?.data;

  if (data?.detail?.error?.message && typeof data.detail.error.message === 'string') {
    return data.detail.error.message;
  }
  if (data?.error?.message && typeof data.error.message === 'string') {
    return data.error.message;
  }
  if (Array.isArray(data?.detail) && data.detail.length > 0 && data.detail[0]?.msg) {
    return data.detail[0].msg;
  }
  if (typeof data?.detail === 'string') {
    return data.detail;
  }

  if (error?.response?.status === 401) {
    return 'Email hoặc mật khẩu không chính xác.';
  }
  if (error?.response?.status === 403) {
    return 'Bảng tin bị khóa. Bạn cần đăng Tiny Win hôm nay để mở!';
  }
  if (error?.response?.status === 409) {
    return 'Email hoặc tên người dùng này đã được sử dụng.';
  }

  if (error?.message && typeof error.message === 'string' && error.message !== '[object Object]') {
    return error.message;
  }

  return 'Có lỗi kết nối xảy ra. Vui lòng thử lại.';
}

// Generate UUID v4 for Idempotency-Key
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
