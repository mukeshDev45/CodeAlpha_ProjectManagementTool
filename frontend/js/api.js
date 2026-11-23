// ProjectFlow Centralized API Client
const API = {
  getToken() {
    return localStorage.getItem(CONFIG.TOKEN_KEY);
  },

  setToken(token) {
    if (token) {
      localStorage.setItem(CONFIG.TOKEN_KEY, token);
    } else {
      localStorage.removeItem(CONFIG.TOKEN_KEY);
    }
  },

  async request(endpoint, options = {}) {
    const url = `${CONFIG.API_BASE_URL}${endpoint}`;
    const token = this.getToken();

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
    };

    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // If token expired or unauthorized
        if (response.status === 401) {
          if (token) {
            this.setToken(null);
            localStorage.removeItem(CONFIG.USER_KEY);
            if (window.handleLogout) {
              window.handleLogout(true);
            }
          }
        }
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error.message);
      throw error;
    }
  },

  // File upload helper using FormData
  async upload(endpoint, formData) {
    const url = `${CONFIG.API_BASE_URL}${endpoint}`;
    const token = this.getToken();
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `Upload failed with status ${response.status}`);
      }
      return data;
    } catch (error) {
      console.error(`API Upload Error [${endpoint}]:`, error.message);
      throw error;
    }
  },

  // Convenience methods
  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  post(endpoint, body) {
    return this.request(endpoint, { method: 'POST', body });
  },

  put(endpoint, body) {
    return this.request(endpoint, { method: 'PUT', body });
  },

  patch(endpoint, body) {
    return this.request(endpoint, { method: 'PATCH', body });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  },
};

window.API = API;
