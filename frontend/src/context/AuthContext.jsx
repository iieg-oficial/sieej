import {
    useState, createContext, useEffect, useCallback, useRef
} from 'react';
import useGlobal from './useGlobal';
import { useLocation, useNavigate } from 'react-router';
import { postLogin, postLogout, getProfile } from '@services/authServices';
import { pushAnalyticsEvent } from '@helpers/analytics';
import { normalizeUser } from '@helpers/normalizeUser';

const AuthContext = createContext();

export const CSRF_KEY = 'sieej_csrf_token';
const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const AuthProvider = ({ children }) => {
    const { onMessage, hostBackend } = useGlobal();
    const navigate = useNavigate();
    const location = useLocation();

    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAuthLoading, setAuthLoading] = useState(true);
    const [authError, setAuthError] = useState(null);

    const csrfRefreshPromiseRef = useRef(null);

    const originPage = location.state?.from?.pathname || '/';

    const authAnalyticsEvent = (action, label) => {
        pushAnalyticsEvent('Autenticación', action, label);
    };

    const closeMessageError = () => setAuthError(null);

    const refreshCsrfToken = useCallback(async () => {
        if (csrfRefreshPromiseRef.current) return csrfRefreshPromiseRef.current;
        csrfRefreshPromiseRef.current = (async () => {
            try {
                const response = await fetch(`${hostBackend}/autenticacion/csrf`, {
                    credentials: 'include',
                });
                if (!response.ok) return null;
                const data = await response.json();
                const newToken = data?.csrf_token;
                if (newToken) {
                    sessionStorage.setItem(CSRF_KEY, newToken);
                    return newToken;
                }
                return null;
            } catch {
                return null;
            } finally {
                csrfRefreshPromiseRef.current = null;
            }
        })();
        return csrfRefreshPromiseRef.current;
    }, [hostBackend]);

    const handleFetchWithAuth = useCallback(async (url, options = {}) => {
        const { body: rawBody, headers: rawHeaders, __csrfRetried, ...rest } = options;
        const method = (rest.method || 'GET').toUpperCase();
        const headers = {
            'Accept': 'application/json',
            ...(rawHeaders || {}),
        };

        if (MUTATION_METHODS.has(method)) {
            const csrf = sessionStorage.getItem(CSRF_KEY);
            if (csrf) headers['X-CSRF-Token'] = csrf;
        }

        let body = rawBody;
        if (
            body
            && !(body instanceof FormData)
            && !(body instanceof URLSearchParams)
            && !(body instanceof Blob)
            && typeof body !== 'string'
        ) {
            body = JSON.stringify(body);
            headers['Content-Type'] = 'application/json';
        }

        const response = await fetch(url, {
            ...rest,
            method,
            headers,
            body,
            credentials: 'include',
        });

        if (response.status === 401) {
            sessionStorage.removeItem(CSRF_KEY);
            setUser(null);
            setIsAuthenticated(false);
            if (!location.pathname.endsWith('/inicio-sesion')) {
                navigate('/inicio-sesion');
            }
            return response;
        }

        if (response.status === 403 && MUTATION_METHODS.has(method) && !__csrfRetried) {
            let detail = null;
            try {
                const data = await response.clone().json();
                detail = data?.detail;
            } catch {
                /* respuesta sin JSON, no es CSRF */
            }
            if (typeof detail === 'string' && detail.toLowerCase().includes('csrf')) {
                const newToken = await refreshCsrfToken();
                if (newToken) {
                    return handleFetchWithAuth(url, { ...options, __csrfRetried: true });
                }
            }
        }

        return response;
    }, [location.pathname, navigate, refreshCsrfToken]);

    const mountedRef = useRef(true);
    useEffect(() => () => { mountedRef.current = false; }, []);
    const safeSet = (setter) => (value) => { if (mountedRef.current) setter(value); };

    const handleCheckAuth = useCallback(async () => {
        safeSet(setAuthLoading)(true);
        try {
            const profile = await getProfile();
            safeSet(setUser)(normalizeUser(profile));
            safeSet(setIsAuthenticated)(true);
            if (!sessionStorage.getItem(CSRF_KEY)) {
                await refreshCsrfToken();
            }
        } catch {
            safeSet(setUser)(null);
            safeSet(setIsAuthenticated)(false);
        } finally {
            safeSet(setAuthLoading)(false);
        }
    }, [refreshCsrfToken]);

    const handleLogin = async ({ username, password }) => {
        safeSet(setAuthLoading)(true);
        safeSet(setAuthError)(null);

        try {
            const { csrf_token, user: loginUser } = await postLogin({ username, password });
            sessionStorage.setItem(CSRF_KEY, csrf_token);

            const profile = await getProfile();
            const finalUser = normalizeUser(profile || loginUser);
            safeSet(setUser)(finalUser);
            safeSet(setIsAuthenticated)(true);
            authAnalyticsEvent('Iniciar sesión', 'Inicio de sesión exitoso');

            const target = finalUser?.must_change_password ? '/cambiar-contrasena' : originPage;
            navigate(target);
        } catch (error) {
            safeSet(setAuthError)(error.message || 'Error al iniciar sesión');
            onMessage(true);
            throw error;
        } finally {
            safeSet(setAuthLoading)(false);
        }
    };

    const handleLogout = async () => {
        try {
            await postLogout();
        } catch {
            /* ignorar fallo de logout server-side */
        }
        sessionStorage.removeItem(CSRF_KEY);
        safeSet(setUser)(null);
        safeSet(setIsAuthenticated)(false);
        safeSet(setAuthError)(null);
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
