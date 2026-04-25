import React, { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import useGlobal from '../context/useGlobal';
import useAuth from '../context/useAuth';
import logoIIEG from '../assets/svg/logo_iieg_login.svg';
import logoSIEEJ from '../assets/svg/logo_sieej_login.svg';
import Typography from '../components/Typography';
import CardPage from '../components/CardPage';
import Input from '../components/Input';
import Button from '../components/Button';
import Message from '../components/Message';

export default function Login() {
    const { regexPass } = useGlobal();
    const { 
        onLogin, isAuthenticated, originPage, authError, 
        isAuthLoading 
    } = useAuth();
    const methods = useForm();
    const navigate = useNavigate();
    const { trigger, handleSubmit } = methods;

    const onSubmit = async (data) => {
        if (await trigger()) {
            await onLogin(data);
        }
    };

    const ImageSIEEJ = ({ className }) => <img src={logoSIEEJ} alt="SIEEJ" className={`${className}`}/>

    useEffect(() => {
        isAuthenticated && navigate(originPage);
    }, [isAuthenticated, navigate, originPage]);

    useEffect(() => {
        const termsAccepted = sessionStorage.getItem('termsAccepted') === 'true';
        if (!termsAccepted) navigate('/exencion');
    }, [navigate]);

    return (
        <CardPage>
            <div className="md:grid md:grid-cols-2 w-full h-full lg:gap-5">
                <div className="flex flex-col items-center justify-center">
                    <form 
                        id="register" 
                        onSubmit={handleSubmit(onSubmit)} 
                        className='w-[260px]'
                    >
                        <Typography as="h2" titleName="Hola"/>
                        <Typography as="span" titleName="Ingresa tus datos para iniciar sesión."/>
                        <Input
                            name="username"
                            label="Usuario o correo electrónico"
                            normalize="lowercase"
                            className="mb-8"
                            methods={methods}
                            filled
                            required
                        />
                        <Input 
                            type="password"
                            name="password"
                            label="Contraseña"
                            pattern={regexPass}
                            methods={methods}
                            normalize="normal"
                            required
                        />
                        <div className={`${authError ? '' : 'mt-10'}`}>
                            <Message type="error" message={authError}/>
                            <Button 
                                type="submit" 
                                label="Iniciar sesión" 
                                variant="primary" 
                                loading={isAuthLoading} 
                                fullWidth
                            />
                        </div>
                        <Button 
                            label="Olvidé mi contraseña" 
                            variant="link" 
                            colSpan={0}
                            disabled
                            fullWidth
                        />
                    </form>
                </div>
                <div className="hidden md:flex flex-col items-center justify-center">
                    <ImageSIEEJ />
                    <div className="relative inline-block">
                        <img src={logoIIEG} alt="IIEG"/>
                        <EnvBadge />
                    </div>
                </div>
            </div>
        </CardPage>
    )
};