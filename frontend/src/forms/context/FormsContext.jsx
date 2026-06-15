import React, { createContext, useCallback, useEffect, useState } from 'react';
import useAuth from '@context/useAuth';
import { listFormularios } from '@services/formulariosServices';

export const FormsContext = createContext(null);

export const FormsProvider = ({ children }) => {
    const { onFetch, isAuthenticated } = useAuth();
    const [formularios, setFormularios] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [errorStatus, setErrorStatus] = useState(null);

    const refresh = useCallback(async () => {
        if (!isAuthenticated) return;
        setLoading(true);
        setError(null);
        setErrorStatus(null);
        try {
            const data = await listFormularios(onFetch);
            setFormularios(data ?? []);
        } catch (e) {
            setError(e.message);
            setErrorStatus(e.status ?? null);
        } finally {
            setLoading(false);
        }
    }, [onFetch, isAuthenticated]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return (
        <FormsContext.Provider value={{ formularios, loading, error, errorStatus, refresh }}>
            {children}
        </FormsContext.Provider>
    );
};
