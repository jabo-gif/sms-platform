import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 10000,
});

// Attach token to every request
api.interceptors.request.use(config => {
  // Check localStorage directly
  let token = localStorage.getItem('token');

  // Also check Zustand persisted store
  if (!token) {
    try {
      const stored = JSON.parse(localStorage.getItem('sms-store'));
      token = stored?.state?.token;
    } catch {}
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Handle errors globally
api.interceptors.response.use(
  res => res.data,
  err => {
    const msg = err.response?.data?.message || 'Something went wrong';
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('sms-store');
      window.location.href = '/login';
    } else {
      toast.error(msg);
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  login:        (data)  => api.post('/auth/login', data),
  me:           ()      => api.get('/auth/me'),
  updateTheme:  (theme) => api.put('/auth/theme', { theme }),
  updateProfile:(data)  => api.put('/auth/profile', data),
};

export const companiesAPI = {
  list:   (params) => api.get('/companies',       { params }),
  all:    ()       => api.get('/companies/all'),
  get:    (id)     => api.get(`/companies/${id}`),
  create: (data)   => api.post('/companies', data),
  update: (id, d)  => api.put(`/companies/${id}`, d),
  delete: (id)     => api.delete(`/companies/${id}`),
};

export const contactsAPI = {
  list:      (params) => api.get('/contacts',              { params }),
  byCompany: (id)     => api.get(`/contacts/by-company/${id}`),
  create:    (data)   => api.post('/contacts', data),
  update:    (id, d)  => api.put(`/contacts/${id}`, d),
  delete:    (id)     => api.delete(`/contacts/${id}`),
  bulkDelete:(ids)    => api.post('/contacts/bulk-delete', { ids }),
};

export const messagesAPI = {
  send:   (data)   => api.post('/messages/send', data),
  list:   (params) => api.get('/messages',        { params }),
  stats:  ()       => api.get('/messages/stats'),
  delete: (id)     => api.delete(`/messages/${id}`),
};

export default api;