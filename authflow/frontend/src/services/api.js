import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request interceptor: adjuntar token ─────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Response interceptor: refresh automático ────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (
      error.response?.status === 401 &&
      error.response?.data?.code === 'TOKEN_EXPIRED' &&
      !original._retry
    ) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post('/api/auth/refresh', { refreshToken });
        localStorage.setItem('accessToken', data.data.accessToken);
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(original);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),
  me: () => api.get('/auth/me'),
  register: (data) => api.post('/auth/register', data),
};

// ─── Asistencia ───────────────────────────────────────────────────────────────
export const asistenciaService = {
  checkIn: () => api.post('/asistencia/checkin'),
  checkOut: (observaciones) => api.post('/asistencia/checkout', { observaciones }),
  hoy: () => api.get('/asistencia/hoy'),
  historial: (params) => api.get('/asistencia/historial', { params }),
  reporte: (params) => api.get('/asistencia/reporte', { params }),
};

// ─── Usuarios ─────────────────────────────────────────────────────────────────
export const usuariosService = {
  listar: (params) => api.get('/usuarios', { params }),
  obtener: (id) => api.get(`/usuarios/${id}`),
  actualizar: (id, data) => api.put(`/usuarios/${id}`, data),
  eliminar: (id) => api.delete(`/usuarios/${id}`),
};

export default api;
