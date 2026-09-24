import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('campusense_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('campusense_token');
      localStorage.removeItem('campusense_user');
    }
    return Promise.reject(error);
  }
);

const parseJsonField = (item) => {
  if (item && typeof item.subject_ids === 'string') {
    try {
      const parsed = JSON.parse(item.subject_ids);
      if (Array.isArray(parsed)) {
        return { ...item, subject_ids: parsed.map((v) => String(v)) };
      }
    } catch (e) {
      return item;
    }
  }
  if (item && typeof item.permissions === 'string' && item.permissions.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(item.permissions);
      if (Array.isArray(parsed)) {
        return { ...item, permissions: parsed.map((v) => String(v)) };
      }
    } catch (e) {
      return item;
    }
  }
  return item;
};

const normalizeId = (data) => {
  if (Array.isArray(data)) {
    return data.map(normalizeId);
  }
  if (data && typeof data === 'object' && 'id' in data) {
    const normalized = { ...data, id: String(data.id) };
    Object.keys(normalized).forEach((key) => {
      if (key.endsWith('_id') && key !== 'id' && normalized[key] != null) {
        normalized[key] = String(normalized[key]);
      }
    });
    return parseJsonField(normalized);
  }
  return data;
};

function createResource(name) {
  return {
    async list(sort, limit, skip) {
      const params = {};
      if (sort) params.sort = sort;
      if (limit) params.limit = limit;
      if (skip) params.skip = skip;
      const res = await api.get(`/entities/${name}`, { params });
      return normalizeId(res.data);
    },

    async filter(query = {}, sort, limit, skip) {
      const params = { ...(query || {}) };
      if (sort) params.sort = sort;
      if (limit) params.limit = limit;
      if (skip) params.skip = skip;
      const res = await api.get(`/entities/${name}/filter`, { params });
      return normalizeId(res.data);
    },

    async get(id) {
      const res = await api.get(`/entities/${name}/${id}`);
      return normalizeId(res.data);
    },

    async create(data) {
      const res = await api.post(`/entities/${name}`, data);
      return normalizeId(res.data);
    },

    async bulkCreate(records) {
      const res = await api.post(`/entities/${name}/bulk`, { records });
      return normalizeId(res.data);
    },

    async update(id, data) {
      const res = await api.patch(`/entities/${name}/${id}`, data);
      return normalizeId(res.data);
    },

    async delete(id) {
      const res = await api.delete(`/entities/${name}/${id}`);
      return res.data;
    }
  };
}

const resourceCache = {};

const entities = new Proxy({}, {
  get(target, prop) {
    if (typeof prop !== 'string') return undefined;
    if (prop === 'Query') return null;
    if (!(prop in target)) {
      target[prop] = createResource(prop);
    }
    return target[prop];
  }
});

const auth = {
  async me() {
    const res = await api.get('/auth/me');
    return res.data;
  },
  async login(email, password) {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('campusense_token', res.data.token);
    localStorage.setItem('campusense_user', JSON.stringify(res.data.user));
    return res.data;
  },
  async register(data) {
    const res = await api.post('/auth/register', data);
    localStorage.setItem('campusense_token', res.data.token);
    localStorage.setItem('campusense_user', JSON.stringify(res.data.user));
    return res.data;
  },
  logout(shouldRedirect = false) {
    localStorage.removeItem('campusense_token');
    localStorage.removeItem('campusense_user');
    if (shouldRedirect && typeof window !== 'undefined') {
      window.location.hash = '';
    }
  },
  redirectToLogin(redirectUrl) {
    if (typeof window !== 'undefined') {
      window.location.hash = '';
    }
  }
};

const Core = {
  async UploadFile({ file }) {
    const fd = new FormData();
    fd.append('file', file);
    const res = await api.post('/integrations/Core/UploadFile', fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  async InvokeLLM({ prompt, response_json_schema, apiKey }) {
    const res = await api.post('/integrations/Core/InvokeLLM', { prompt, response_json_schema, apiKey });
    return res.data;
  },
  async SendEmail({ to, subject, body, html, from_name }) {
    const res = await api.post('/integrations/Core/SendEmail', { to, subject, body, html, from_name });
    return res.data;
  },
  async SendSMS({ to, body }) {
    const res = await api.post('/integrations/Core/SendSMS', { to, body });
    return res.data;
  },
  async GenerateImage({ prompt }) {
    const res = await api.post('/integrations/Core/GenerateImage', { prompt });
    return res.data;
  },
  async ExtractDataFromUploadedFile({ file }) {
    const fd = new FormData();
    fd.append('file', file);
    const res = await api.post('/integrations/Core/ExtractDataFromUploadedFile', fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  }
};

const functions = {
  async invoke(name, payload) {
    if (name === 'backupRestore') {
      const res = await api.post('/functions/backupRestore', payload || {});
      return res.data;
    }
    if (name === 'calculateAttendanceInsights') {
      return { success: true, message: 'Stub' };
    }
    if (name === 'driveBackup') {
      return { success: true, files: [] };
    }
    console.warn(`[functions] ${name} not implemented locally`, payload);
    return { success: true, message: 'Stub' };
  }
};

export const base44 = {
  entities,
  auth,
  integrations: { Core },
  functions,
  appLogs: {
    logUserInApp() {
      return Promise.resolve({ success: true });
    }
  }
};

export const apiClient = api;
export default api;
