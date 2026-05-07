export const TAB_FILTERS = {
    pendientes: (f) => f.estado_envio === 'no_iniciado' || f.estado_envio === 'en_proceso',
    enviados: (f) => f.estado_envio === 'enviado',
    expirados: (f) => f.estado_envio === 'expirado',
};

export const TAB_LABELS = {
    pendientes: 'Pendientes',
    enviados: 'Enviados',
    expirados: 'Expirados',
};

export const TAB_KEYS = ['pendientes', 'enviados', 'expirados'];

export const filterByTab = (formularios, tab) => {
    const predicate = TAB_FILTERS[tab];
    if (!predicate) return formularios;
    return formularios.filter(predicate);
};

export const filterBySearch = (formularios, query) => {
    const q = (query || '').trim().toLowerCase();
    if (!q) return formularios;
    return formularios.filter((f) => {
        const haystack = `${f.nombre || ''} ${f.descripcion || ''}`.toLowerCase();
        return haystack.includes(q);
    });
};

export const countByTab = (formularios) => {
    const counts = { pendientes: 0, enviados: 0, expirados: 0 };
    for (const f of formularios) {
        for (const tab of TAB_KEYS) {
            if (TAB_FILTERS[tab](f)) counts[tab] += 1;
        }
    }
    return counts;
};
