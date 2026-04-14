import axios from 'axios';

// In production (Render), API is on same origin. In dev, it's localhost:5000
const API = axios.create({
  baseURL: import.meta.env.DEV ? 'http://localhost:5000/api' : '/api',
});

export default API;
