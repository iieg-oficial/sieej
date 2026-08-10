import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import useAuth from '@context/useAuth';
import logoIIEG from '@assets/svg/logo_iieg_login.svg';
import logoSIEEJ from '@assets/svg/logo_sieej_login.svg';
import Typography from '@components/Typography';
import CardPage from '@components/CardPage';
import Button from '@components/Button';
import Message from '@components/Message';
import EnvBadge from '@components/EnvBadge';

const AUTH_ERRORS = {
    access_denied: 'Tu cuenta no tiene acceso a SIEEJ. Solicita que te asignen un rol de la aplicación.',
    invalid_request: 'La solicitud de inicio de sesión no fue válida. Intenta de nuevo.',
    server_error: 'No se pudo completar el inicio de sesión. Intenta más tarde.',
};

export default function Login() {
    const { onLogin, isAuthenticated, originPage, isAuthLoading } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [redirecting, setRedirecting] = useState(false);

    const authError = searchParams.get('auth_error');
    const errorMessage = authError
        ? (AUTH_ERRORS[authError] || 'No se pudo iniciar sesión.')
        : null;

    const ImageSIEEJ = ({ className }) => <img src={logoSIEEJ} alt="SIEEJ" className={`${className}`}/>

    const handleClick = () => {
        setRedirecting(true);
        onLogin();
    };

    useEffect(() => {
        if (!isAuthenticated) return;
        navigate(originPage);
    }, [isAuthenticated, navigate, originPage]);

    useEffect(() => {
        const termsAccepted = sessionStorage.getItem('termsAccepted') === 'true';
        if (!termsAccepted) navigate('/exencion');
    }, [navigate]);

    return (
        <CardPage>
            <div className="md:grid md:grid-cols-2 w-full h-full lg:gap-5">
                <div className="flex flex-col items-center justify-center">
                    <div className='w-[260px]'>
                        <Typography as="h2" titleName="Hola"/>
                        <Typography as="span" titleName="Inicia sesión con tu cuenta institucional."/>
                        <div className="mt-10">
                            <Message type="error" message={errorMessage}/>
                            <Button
                                label="Iniciar sesión"
                                variant="primary"
                                loading={isAuthLoading || redirecting}
                                onClick={handleClick}
                                fullWidth
                            />
                        </div>
                    </div>
                </div>
                <div className="hidden md:flex flex-col items-center justify-center">
                    <div className="relative inline-block">
                        <ImageSIEEJ />
                        <EnvBadge />
                    </div>
                    <img src={logoIIEG} alt="IIEG"/>
                </div>
            </div>
        </CardPage>
    )
};
