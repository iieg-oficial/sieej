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

const parseJson = async (response) => {
    const data = safeParse(await response.text());
    if (!response.ok) {
        const detail = data?.detail;
        const msg = typeof detail === 'string' ? detail : `HTTP ${response.status}`;
        const error = new Error(msg);
        error.status = response.status;
        error.data = data;
        throw error;
    }
    return data;
};

export const listFormularios = async (onFetch) => {
    const r = await onFetch(buildUrl('/formularios/'));
    return parseJson(r);
};

export const getFormularioDetalle = async (onFetch, slug) => {
    const r = await onFetch(buildUrl(`/formularios/${encodeURIComponent(slug)}`));
    return parseJson(r);
};

export const getFormularioSchema = async (onFetch, slug) => {
    const r = await onFetch(buildUrl(`/formularios/${encodeURIComponent(slug)}/schema`));
    return parseJson(r);
};

export const getEnvio = async (onFetch, slug) => {
    const r = await onFetch(buildUrl(`/formularios/${encodeURIComponent(slug)}/envio`));
    return parseJson(r);
};

export const putEnvio = async (onFetch, slug, { datos, paso_actual = 0, enviar = false }) => {
    const r = await onFetch(buildUrl(`/formularios/${encodeURIComponent(slug)}/envio`), {
        method: 'PUT',
        body: { datos, paso_actual, enviar },
    });
    return parseJson(r);
};

export const uploadArchivo = async (onFetch, slug, fieldPath, file) => {
    const formData = new FormData();
    formData.append('field_path', fieldPath);
    formData.append('file', file);

    const r = await onFetch(buildUrl(`/formularios/${encodeURIComponent(slug)}/envio/upload`), {
        method: 'POST',
        body: formData,
    });
    return parseJson(r);
};
