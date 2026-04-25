import {
    useState, createContext, useEffect, useCallback
} from 'react';
import useGlobal from './useGlobal';
import { useLocation, useNavigate } from 'react-router';
import { postLogin, postLogout, getProfile } from '../services/authServices';
import { pushAnalyticsEvent } from '../helpers/analytics';

const AuthContext = createContext();

const CSRF_KEY = 'sieej_csrf_token';
const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const AuthProvider = ({ children }) => {
    const { onMessage } = useGlobal();
    const navigate = useNavigate();
    const location = useLocation();

    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAuthLoading, setAuthLoading] = useState(true);
    const [authError, setAuthError] = useState(null);

    const originPage = location.state?.from?.pathname || '/';

    const authAnalyticsEvent = (action, label) => {
        pushAnalyticsEvent('Autenticación', action, label);
    };

    const closeMessageError = () => setAuthError(null);

    const handleFetchWithAuth = useCallback(async (url, options = {}) => {
        const method = (options.method || 'GET').toUpperCase();
        const headers = {
            'Accept': 'application/json',
            ...(options.headers || {}),
        };

        if (MUTATION_METHODS.has(method)) {
            const csrf = sessionStorage.getItem(CSRF_KEY);
            if (csrf) headers['X-CSRF-Token'] = csrf;
        }

        if (
            options.body
            && !(options.body instanceof FormData)
            && !(options.body instanceof URLSearchParams)
            && typeof options.body !== 'string'
        ) {
            options.body = JSON.stringify(options.body);
            headers['Content-Type'] = 'application/json';
        }

        const response = await fetch(url, {
            ...options,
            method,
            headers,
            credentials: 'include',
        });

        if (response.status === 401) {
            sessionStorage.removeItem(CSRF_KEY);
            setUser(null);
            setIsAuthenticated(false);
            if (!location.pathname.endsWith('/inicio-sesion')) {
                navigate('/inicio-sesion');
            }
        }

        return response;
    }, [location.pathname, navigate]);

    const handleCheckAuth = useCallback(async () => {
        setAuthLoading(true);
        try {
            const profile = await getProfile();
            setUser(profile);
            setIsAuthenticated(true);
        } catch {
            setUser(null);
            setIsAuthenticated(false);
        } finally {
            setAuthLoading(false);
        }
    }, []);

    const handleLogin = async ({ username, password }) => {
        setAuthLoading(true);
        setAuthError(null);

        try {
            const { csrf_token, user: loginUser } = await postLogin({ username, password });
            sessionStorage.setItem(CSRF_KEY, csrf_token);

            const profile = await getProfile();
            setUser(profile || loginUser);
            setIsAuthenticated(true);
            authAnalyticsEvent('Iniciar sesión', 'Inicio de sesión exitoso');
            navigate(originPage);
        } catch (error) {
            setAuthError(error.message || 'Error al iniciar sesión');
            onMessage(true);
            throw error;
        } finally {
            setAuthLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await postLogout();
        } catch {
            /* ignorar fallo de logout server-side */
        }
        sessionStorage.removeItem(CSRF_KEY);
        setUser(null);
        setIsAuthenticated(false);
        setAuthError(null);
        authAnalyticsEvent('Cerrar sesión', 'Sesión cerrada manualmente');
        navigate('/inicio-sesion');
    };

    useEffect(() => {
        handleCheckAuth();
    }, [handleCheckAuth]);

    const value = {
        user, isAuthenticated, isAuthLoading, authError,
        originPage, closeMessageError,
        onFetch: handleFetchWithAuth,
        onLogin: handleLogin,
        onLogout: handleLogout,
        onCheckAuth: handleCheckAuth,
        onAnalytics: authAnalyticsEvent,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

AuthContext.displayName = 'AuthContext';

export { AuthContext, AuthProvider };
