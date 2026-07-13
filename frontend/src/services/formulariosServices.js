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

const resolveErrorMessage = (detail, status) => {
    if (typeof detail === 'string') return detail;
    const errores = detail?.errores;
    if (Array.isArray(errores) && errores.length) {
        return errores
            .map((e) => (e?.path ? `${e.path}: ${e.msg}` : e?.msg))
            .filter(Boolean)
            .join(' · ');
    }
    return `HTTP ${status}`;
};

const parseJson = async (response) => {
    const data = safeParse(await response.text());
    if (!response.ok) {
        const error = new Error(resolveErrorMessage(data?.detail, response.status));
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

export const getEnvio = async (onFetch, slug) => {
    const r = await onFetch(buildUrl(`/formularios/${encodeURIComponent(slug)}/envio`));
    return parseJson(r);
};

export const putEnvio = async (onFetch, slug, { datos, paso_actual = 0, enviar = false, cambios_vistos = [] }) => {
    const r = await onFetch(buildUrl(`/formularios/${encodeURIComponent(slug)}/envio`), {
        method: 'PUT',
        body: { datos, paso_actual, enviar, cambios_vistos },
    });
    return parseJson(r);
};

export const actualizarVersionEnvio = async (onFetch, slug) => {
    const r = await onFetch(buildUrl(`/formularios/${encodeURIComponent(slug)}/envio/actualizar-version`), {
        method: 'POST',
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

export const getMiEnvioDetalle = async (onFetch, envioId) => {
    const r = await onFetch(buildUrl(`/formularios/mis-envios/${envioId}`));
    return parseJson(r);
};

export const downloadEnvioPdf = async (envioId) => {
    const url = buildUrl(`/formularios/mis-envios/${envioId}/pdf`);
    const response = await fetch(url, { credentials: 'include' });
    if (!response.ok) {
        throw new Error('Error al descargar el PDF');
    }
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const disposition = response.headers.get('Content-Disposition') || '';
    const match = disposition.match(/filename\*=UTF-8''(.+)/);
    const filename = match ? decodeURIComponent(match[1]) : 'formulario.pdf';
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
};
