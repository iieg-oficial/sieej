import React, { lazy, Suspense } from 'react';
import { Routes as RoutesRRD, Route, Navigate, useLocation } from 'react-router';
import useGlobal from './context/useGlobal';
import useAuth from './context/useAuth';
import Loading from './components/Loading';

const MainLayout = lazy(() => import('./layout/MainLayout'));
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const NoMatch = lazy(() => import('./pages/NoMatch'));
const Disclaimer = lazy(() => import('./pages/Disclaimer'));
const ChangePassword = lazy(() => import('./pages/ChangePassword'));
const ErrorPage = lazy(() => import('./pages/ErrorPage'));
const FormList = lazy(() => import('./pages/FormList'));
const FormPage = lazy(() => import('./pages/FormPage'));

const ProtectedRoute = () => {
    const { isAuthenticated } = useAuth();
    const location = useLocation();

    return isAuthenticated ? <MainLayout/> : <Navigate to="/inicio-sesion" replace state={{ from: location }} />;
};

const Routes = () => {
    const { isDevelopment } = useGlobal();
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loading /></div>}>
            <RoutesRRD>
                <Route path="inicio-sesion" element={<Login />} />
                <Route path="exencion" element={<Disclaimer />} />
                {isDevelopment && <Route path="regisño" element={<Register />} />}
                <Route element={<ProtectedRoute />}>
                    <Route path="/" element={<Navigate to="/formularios" replace />} />
                    <Route path="cambiar-contrasena" element={<ChangePassword />} />
                    <Route path="formularios" element={<FormList />} />
                    <Route path="formularios/:slug" element={<FormPage />} />
                    <Route path="legacy-wizard" element={<Home />} />
                </Route>
                <Route path="error" element={<ErrorPage />} />
                <Route path="*" element={<NoMatch />} />
            </RoutesRRD>
        </Suspense>
    );
};

export default Routes;
