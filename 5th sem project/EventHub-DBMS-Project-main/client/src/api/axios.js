import axios from 'axios';

// Normalize API base URL:
// In local dev, defaults to '/api' (proxied by Vite to http://localhost:5000).
// In production (Vercel/Render), handles bare origins or origins with/without trailing slashes.
const rawBaseURL = import.meta.env.VITE_API_URL || '/api';
const baseURL = rawBaseURL === '/api'
  ? '/api'
  : rawBaseURL.endsWith('/api')
  ? rawBaseURL
  : rawBaseURL.replace(/\/+$/, '') + '/api';

const API = axios.create({
  baseURL,
  timeout: 15000,
});

// Request interceptor to attach JWT token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// NOTE: The 401 response interceptor is registered by AuthContext so it can
// call logout() and keep React state in sync. Do NOT add a second one here.

export default API;
