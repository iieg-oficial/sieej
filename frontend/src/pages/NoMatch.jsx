import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import useGlobal from '@context/useGlobal';
import logo404 from '@assets/png/404.png';
import Typography from '@components/Typography';
import Button from '@components/Button';

const NoMatch = () => {
    const { onAnalytics } = useGlobal();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        onAnalytics('error 404', `Intentaron acceder a: ${location.pathname}`);
    }, [onAnalytics, location.pathname]);

    return (
        <main className="grid min-h-dvh place-items-center bg-white px-6 py-24 sm:py-32 lg:px-8">
            <img 
                src={logo404} 
                alt="error 404" 
                className="max-w-full h-auto sm:max-h-[400px] sm:max-w-[600px] lg:max-h-[522px] lg:max-w-[842px]"
            />
            <div className="flex flex-col items-center text-center gap-y-6 px-4 sm:px-8">
                <Typography 
                    as="h1" 
                    titleName="Página no encontrada" 
                    className="text-[32px] sm:text-[40px] lg:text-[50px]" 
                    style={{ margin: 0 }}
                />
                <Typography 
                    as="p" 
                    titleName="Lo sentimos, la página que buscas no pudo ser encontrada por favor regresa a la página principal" 
                    className="w-full max-w-[300px] sm:max-w-[500px] lg:max-w-[656px] font-garetregular text-[16px] sm:text-[20px] lg:text-[24px]"
                />
                <Button 
                    label="Ir a la página principal"
                    onClick={() => navigate('/')}
                />
            </div>
        </main>
    )
}
  
export default NoMatch;