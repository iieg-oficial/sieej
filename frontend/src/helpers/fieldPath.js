const RHF_A_BACKEND = /^([^.]+)\.(\d+)\./;
const BACKEND_A_RHF = /^([^.[]+)\[(\d+)\]\./;

export const aPathBackend = (nombreRHF) => (
    String(nombreRHF ?? '').replace(RHF_A_BACKEND, '$1[$2].')
);

export const aNombreRHF = (path) => (
    String(path ?? '').replace(BACKEND_A_RHF, '$1.$2.')
);

export const aplanarDatos = (datos) => {
    const salida = {};
    Object.entries(datos ?? {}).forEach(([stepId, valor]) => {
        if (Array.isArray(valor)) {
            valor.forEach((item, i) => {
                Object.entries(item ?? {}).forEach(([campo, v]) => {
                    salida[`${stepId}[${i}].${campo}`] = v;
                });
            });
            return;
        }
        if (valor && typeof valor === 'object') {
            Object.entries(valor).forEach(([campo, v]) => {
                salida[`${stepId}.${campo}`] = v;
            });
        }
    });
    return salida;
};

export const pathsDeArchivo = (definicion) => {
    const paths = new Set();
    (definicion?.steps ?? []).forEach((step) => {
        (step.fields ?? []).forEach((field) => {
            if (field.type === 'file') paths.add(`${step.id}.${field.name}`);
        });
    });
    return paths;
};

export const esArchivo = (path, pathsArchivo) => (
    pathsArchivo.has(aPathBackend(path).replace(/\[\d+\]/, ''))
);

export const camposCambiados = (anteriores, actuales, pathsArchivo) => {
    const cambios = {};
    Object.entries(actuales).forEach(([path, valor]) => {
        if (pathsArchivo && esArchivo(path, pathsArchivo)) return;
        if (JSON.stringify(anteriores?.[path]) === JSON.stringify(valor)) return;
        cambios[path] = valor;
    });
    return cambios;
};
