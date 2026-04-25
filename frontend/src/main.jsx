import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { AuthProvider } from './context/AuthContext.jsx';
import { GlobalProvider } from './context/GlobalContext.jsx';
import { CatalogProvider } from './context/CatalogContext.jsx';
import { UserProvider } from './context/UserContext.jsx';
import { HomeProvider } from './context/HomeContext.jsx';
import Routes from './Routes.jsx';
import './index.css';

const isDev = import.meta.env.VITE_NODE_ENV === 'development';
const root = createRoot(document.getElementById('root'));

isDev && console.info('¡Tú estás viendo esto, porque estás en modo de desarrollo!');

const basename = import.meta.env.VITE_BASE_PATH || '/';

root.render(
    <BrowserRouter basename={basename}>
        <StrictMode>
            <GlobalProvider>
                <AuthProvider>
                    <CatalogProvider>
                        <UserProvider>
                            <HomeProvider>
                                <Routes />
                            </HomeProvider>
                        </UserProvider>
                    </CatalogProvider>
                </AuthProvider>
            </GlobalProvider>
        </StrictMode>
    </BrowserRouter>
);
