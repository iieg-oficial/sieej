import React, { createContext, useState } from 'react';
import useGlobal from './useGlobal';
import useAuth from './useAuth';
import { pushAnalyticsEvent } from '../helpers/analytics';

const UserContext = createContext();

const UserProvider = ({ children }) => {
    const { hostBackend, openModal } = useGlobal();
    const { onFetch, user: authUser } = useAuth();
    const [ loading, setLoading ] = useState(false);
    const [ error, setError ] = useState(null);
    const [ userForms, setUserForms ] = useState(null);

    const userAnalyticsEvent = (action, label) => {
        pushAnalyticsEvent('Usuario', action, label);
    };

    const handleUser = async () => {
        if (userForms?.username) return;

        // Si AuthContext ya cargó el perfil, reusarlo y mapearlo al shape SIEEJ
        if (authUser) {
            const [nombre = '', apellido = ''] = (authUser.name || '').split(' ', 2);
            const profile = {
                username: authUser.username,
                email: authUser.email,
                nombre: authUser.nombre || nombre,
                apellido: authUser.apellido || apellido,
            };
            setUserForms(profile);
            userAnalyticsEvent('Obtener usuario', `Se obtuvo el usuario ${profile.username}`);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response = await onFetch(`${hostBackend}/autenticacion/perfil`, { method: 'GET' });
            const user = await response.json();
            if (user?.detail) throw new Error(user.detail);

            const [nombre = '', apellido = ''] = (user.name || '').split(' ', 2);
            const profile = {
                username: user.username,
                email: user.email,
                nombre: user.nombre || nombre,
                apellido: user.apellido || apellido,
            };
            setUserForms(profile);
            userAnalyticsEvent('Obtener usuario', `Se obtuvo el usuario ${profile.username}`);
        } catch (err) {
            setError(err.message);
            openModal('error', 'Error', err.message || 'Error al obtener el usuario');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const value = {
        error, userIsLoading: loading,
        userForms,
        onUser: handleUser,
        onAnalytics: userAnalyticsEvent
    };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
};

UserContext.displayName = 'UserContext';

export { UserContext, UserProvider };
