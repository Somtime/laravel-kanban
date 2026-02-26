// src/api/client.ts

// Vite 환경 변수에서 API URL을 가져옵니다. 기본값은 프록시 대신 직접 BE 서버를 가리키도록 설정 ('http://localhost:8080')
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

interface FetchOptions extends RequestInit {
  data?: any;
}

export async function client(endpoint: string, { data, ...customConfig }: FetchOptions = {}) {
  const token = localStorage.getItem('auth_token');

  const headers: HeadersInit = {
    'Accept': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (data) {
    headers['Content-Type'] = 'application/json';
  }

  const config: RequestInit = {
    method: data ? 'POST' : 'GET',
    ...customConfig,
    headers: {
      ...headers,
      ...customConfig.headers,
    },
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // 401 Unauthorized 처리
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      // Token expired or invalid, redirect to login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return Promise.reject(new Error('Unauthorized'));
    }

    // 빈 응답 (204 No Content 등) 처리
    if (response.status === 204) {
      return null;
    }

    const responseData = await response.json().catch(() => null);

    if (response.ok) {
      return responseData;
    } else {
      // 서버에서 보내는 에러 메시지 처리
      return Promise.reject(responseData || new Error(`Request failed with status ${response.status}`));
    }
  } catch (error) {
    return Promise.reject(error);
  }
}

// 편의 메서드 래퍼
client.get = function (endpoint: string, customConfig: FetchOptions = {}) {
  return client(endpoint, { ...customConfig, method: 'GET' });
}

client.post = function (endpoint: string, data?: any, customConfig: FetchOptions = {}) {
  return client(endpoint, { ...customConfig, data, method: 'POST' });
}

client.put = function (endpoint: string, data?: any, customConfig: FetchOptions = {}) {
  return client(endpoint, { ...customConfig, data, method: 'PUT' });
}

client.delete = function (endpoint: string, customConfig: FetchOptions = {}) {
  return client(endpoint, { ...customConfig, method: 'DELETE' });
}
