import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import * as Sentry from '@sentry/react';
import { AuthProvider } from './context/AuthContext.jsx';
import { GlobalProvider } from './context/GlobalContext.jsx';
import { CatalogProvider } from './context/CatalogContext.jsx';
import { UserProvider } from './context/UserContext.jsx';
import Routes from './Routes.jsx';
import ErrorPage from './pages/ErrorPage.jsx';
import './index.css';

const isDev = import.meta.env.VITE_NODE_ENV === 'development';

if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
        dsn: import.meta.env.VITE_SENTRY_DSN,
        environment: import.meta.env.VITE_NODE_ENV || 'production',
        release: `sieej@${__APP_VERSION__}`,
        integrations: [Sentry.browserTracingIntegration()],
        tracesSampleRate: isDev ? 1.0 : 0.1,
        denyUrls: [/youtubei\/v1/, /google-analytics/, /googletagmanager/, /doubleclick\.net/],
    });
}

isDev && console.info('¡Tú estás viendo esto, porque estás en modo de desarrollo!');

const basename = import.meta.env.VITE_BASE_PATH || '/';
const root = createRoot(document.getElementById('root'));

root.render(
    <Sentry.ErrorBoundary fallback={({ error, resetError }) => (
        <BrowserRouter basename={basename}>
            <ErrorPage error={error} resetError={resetError} />
        </BrowserRouter>
    )}>
        <BrowserRouter basename={basename}>
            <StrictMode>
                <GlobalProvider>
                    <AuthProvider>
                        <CatalogProvider>
                            <UserProvider>
                                <Routes />
                            </UserProvider>
                        </CatalogProvider>
                    </AuthProvider>
                </GlobalProvider>
            </StrictMode>
        </BrowserRouter>
    </Sentry.ErrorBoundary>
);
