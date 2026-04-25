const isDev = import.meta.env.VITE_NODE_ENV === 'development';

export const pushAnalyticsEvent = (category, action, label) => {
    const layer = typeof window !== 'undefined' && Array.isArray(window.dataLayer)
        ? window.dataLayer
        : null;

    if (!layer) {
        if (isDev) console.debug('[analytics] dataLayer no disponible:', { category, action, label });
        return;
    }

    layer.push({ event: 'sieej_event', category, action, label });
};
