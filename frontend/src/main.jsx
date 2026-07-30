import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { AuthProvider } from './context/AuthContext.jsx';
import { GlobalProvider } from './context/GlobalContext.jsx';
import Routes from './Routes.jsx';
import RootErrorBoundary from '@components/RootErrorBoundary.jsx';
import './index.css';

const isDev = import.meta.env.VITE_NODE_ENV === 'development';

isDev && console.info('¡Tú estás viendo esto, porque estás en modo de desarrollo!');

const basename = import.meta.env.VITE_BASE_PATH || '/';
const root = createRoot(document.getElementById('root'));

root.render(
    <RootErrorBoundary basename={basename}>
        <BrowserRouter basename={basename}>
            <StrictMode>
                <GlobalProvider>
                    <AuthProvider>
                        <Routes />
                    </AuthProvider>
                </GlobalProvider>
            </StrictMode>
        </BrowserRouter>
    </RootErrorBoundary>
);
