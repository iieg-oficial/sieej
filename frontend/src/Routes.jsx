import React, { lazy, Suspense } from 'react';
import { Routes as RoutesRRD, Route, Navigate, useLocation } from 'react-router';
import useAuth from './context/useAuth';
import Loading from './components/Loading';

const MainLayout = lazy(() => import('./layout/MainLayout'));
const Login = lazy(() => import('./pages/Login'));
const NoMatch = lazy(() => import('./pages/NoMatch'));
const Disclaimer = lazy(() => import('./pages/Disclaimer'));
const ErrorPage = lazy(() => import('./pages/ErrorPage'));
const FormList = lazy(() => import('./pages/FormList'));
const FormPage = lazy(() => import('./pages/FormPage'));
const EnvioDetalle = lazy(() => import('./pages/EnvioDetalle'));
const EnvioActualizar = lazy(() => import('./pages/EnvioActualizar'));

const ProtectedRoute = () => {
    const { isAuthenticated, isAuthLoading } = useAuth();
    const location = useLocation();

    if (isAuthLoading) {
        return <div className="flex items-center justify-center min-h-dvh"><Loading /></div>;
    }
    if (!isAuthenticated) {
        return <Navigate to="/inicio-sesion" replace state={{ from: location }} />;
    }
    return <MainLayout/>;
};

const Routes = () => (
    <Suspense fallback={<div className="flex items-center justify-center min-h-dvh"><Loading /></div>}>
        <RoutesRRD>
            <Route path="inicio-sesion" element={<Login />} />
            <Route path="exencion" element={<Disclaimer />} />
            <Route element={<ProtectedRoute />}>
                <Route path="/" element={<FormList />} />
                <Route path="mis-envios/:id" element={<EnvioDetalle />} />
                <Route path="mis-envios/:id/actualizar" element={<EnvioActualizar />} />
                <Route path=":slug" element={<FormPage />} />
            </Route>
            <Route path="error" element={<ErrorPage />} />
            <Route path="*" element={<NoMatch />} />
        </RoutesRRD>
    </Suspense>
);

export default Routes;
