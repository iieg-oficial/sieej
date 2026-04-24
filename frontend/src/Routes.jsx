import React, {  } from "react";
import { Routes as RoutesRRD, Route, Navigate, useLocation } from 'react-router';
import { useGlobal } from "./context/GlobalContext";
import { useAuth } from './context/AuthContext';
import MainLayout from "./layout/MainLayout";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import NoMatch from "./pages/NoMatch";
import Disclaimer from "./pages/Disclaimer";

const ProtectedRoute = () => {
    const { isAuthenticated } = useAuth();
    const location = useLocation();
    
    return isAuthenticated ? <MainLayout/> : <Navigate to="/inicio-sesion" replace state={{ from: location }} />;
};

const Routes = () => {
    const { isDevelopment } = useGlobal();
    return (
        <RoutesRRD>
            <Route path="inicio-sesion" element={<Login />} />
            <Route path="exencion" element={<Disclaimer />} />
            {isDevelopment && <Route path="regisño" element={<Register />} />}
            <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Home />} />
            </Route>
            <Route path="*" element={<NoMatch />} />
        </RoutesRRD>
)};

export default Routes;