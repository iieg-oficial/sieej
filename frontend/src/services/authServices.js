const API_HOST = import.meta.env.VITE_BACKEND_API_HOST;

const buildUrl = (path) => `${API_HOST}${path}`;

const fetchJson = async (url, options = {}) => {
    const response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        },
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    if (!response.ok) {
        const detail = data?.detail || `HTTP ${response.status}`;
        throw new Error(typeof detail === 'string' ? detail : 'Error en la solicitud');
    }

    return data;
};

export const postLogin = async ({ username, password }) =>
    fetchJson(buildUrl('/autenticacion/iniciar-sesion'), {
        method: 'POST',
        body: JSON.stringify({ username, password }),
    });

export const postLogout = async () =>
    fetchJson(buildUrl('/autenticacion/cerrar-sesion'), { method: 'POST' });

export const getProfile = async () =>
    fetchJson(buildUrl('/autenticacion/perfil'));
