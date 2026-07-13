import React, { createContext, useEffect, useState } from 'react';
import useAuth from '@context/useAuth';
import useGlobal from '@context/useGlobal';

export const CatalogosContext = createContext(null);

export const CatalogosProvider = ({ children }) => {
    const { hostBackend } = useGlobal();
    const { isAuthenticated, onFetch } = useAuth();
    const [catalogos, setCatalogos] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!isAuthenticated) return;

        const controller = new AbortController();
        setLoading(true);
        setError(null);

        (async () => {
            try {
                const response = await onFetch(`${hostBackend}/formularios/catalogos`, {
                    method: 'GET',
                    signal: controller.signal,
                });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const data = await response.json();
                setCatalogos(data);
            } catch (err) {
                if (err.name === 'AbortError') return;
                setError(err.message || 'Error al cargar catálogos');
            } finally {
                setLoading(false);
            }
        })();

        return () => controller.abort();
    }, [isAuthenticated, hostBackend, onFetch]);

    return (
        <CatalogosContext.Provider value={{ catalogos, loading, error }}>
            {children}
        </CatalogosContext.Provider>
    );
};

CatalogosContext.displayName = 'CatalogosContext';
