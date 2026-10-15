/**
 * EmployeeHub — Centralized API Client
 * Namespace: window.EmployeeHub.api
 */
window.EmployeeHub = window.EmployeeHub || {};

window.EmployeeHub.api = (function () {
  'use strict';

  const BASE_URL = ''; // Relative URL for unified full-stack server

  function getToken() {
    return localStorage.getItem('eh_jwt_token') || '';
  }

  function setToken(token) {
    if (token) {
      localStorage.setItem('eh_jwt_token', token);
    } else {
      localStorage.removeItem('eh_jwt_token');
    }
  }

  async function request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(url, config);

      // Handle unauthenticated session
      if (response.status === 401) {
        setToken(null);
        if (window.EmployeeHub.auth && typeof window.EmployeeHub.auth.onSessionExpired === 'function') {
          window.EmployeeHub.auth.onSessionExpired();
        }
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/csv')) {
        return await response.text();
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error ${response.status}`);
      }

      return data;
    } catch (err) {
      console.warn(`[API Client] ${options.method || 'GET'} ${endpoint} failed:`, err.message);
      throw err;
    }
  }

  return {
    getToken,
    setToken,
    get: (endpoint) => request(endpoint, { method: 'GET' }),
    post: (endpoint, body) => request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
    patch: (endpoint, body) => request(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
    uploadCsv: (endpoint, csvText, commit = false) => {
      const token = getToken();
      return fetch(`${BASE_URL}${endpoint}?commit=${commit}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: csvText
      }).then(r => r.json());
    }
  };
})();
