const API_HOST = import.meta.env.VITE_BACKEND_API_HOST;

const buildUrl = (path) => `${API_HOST}${path}`;

const safeParse = (text) => {
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
};

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

    const data = safeParse(await response.text());

    if (!response.ok) {
        const detail = data?.detail || `HTTP ${response.status}`;
        const error = new Error(typeof detail === 'string' ? detail : 'Error en la solicitud');
        error.status = response.status;
        error.data = data;
        throw error;
    }

    return data;
};

export const buildLoginUrl = () => {
    // Ruta absoluta del dominio (incluye el prefijo /sieej): mariachi la usa como
    // `return_to` para devolver aquí tras el login, en vez de a su propio home.
    const returnTo = `${window.location.pathname}${window.location.search}`;
    return buildUrl(`/autenticacion/login?return_to=${encodeURIComponent(returnTo)}`);
};

export const postLogout = async () =>
    fetchJson(buildUrl('/autenticacion/cerrar-sesion'), { method: 'POST' });

export const postRefresh = async () =>
    fetchJson(buildUrl('/autenticacion/refrescar'), { method: 'POST' });

export const getProfile = async () =>
    fetchJson(buildUrl('/autenticacion/perfil'));
