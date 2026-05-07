export const normalizeUser = (raw) => {
    if (!raw) return null;
    const [nombreFromName = '', apellidoFromName = ''] = (raw.name || '').split(' ', 2);
    return {
        ...raw,
        nombre: raw.nombre || nombreFromName,
        apellido: raw.apellido || apellidoFromName,
    };
};
