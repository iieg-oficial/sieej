import React, { useEffect } from 'react';
import { useLocation } from 'react-router';
import useGlobal from '@context/useGlobal';
import closeImage from '@assets/svg/closePage.svg';
import Typography from '@components/Typography';

const ClosePage = () => {
    const { onAnalytics } = useGlobal();
    const location = useLocation();

    useEffect(() => {
        onAnalytics('error 404', `Intentaron acceder a: ${location.pathname}`);
    }, [onAnalytics, location.pathname]);

    return (
        <div className="flex flex-col items-center justify-start gap-5 bg-white w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <img
                src={closeImage}
                alt="Sistema en revisión"
                className="w-full h-auto max-h-[180px] sm:max-h-[260px] md:max-h-[320px] lg:max-h-[352px] object-contain"
            />
            <div className="flex flex-col items-center text-center gap-y-4 w-full">
                <Typography
                    as="p"
                    className="w-full font-garetbook text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl leading-relaxed tracking-normal"
                >
                    El sistema de información estará temporalmente inactivo debido a tareas de análisis de datos y generación de oficios, con base en la información previamente registrada.
                    <br /><br />
                    Durante este periodo, no será posible acceder al sistema. Agradecemos tu comprensión y te pedimos estar atento a la reactivación del servicio.
                    <br /><br />
                    Si tienes algún comentario, escríbenos a:&nbsp;
                    <a
                        href="mailto:ayuda.sieej@iieg.gob.mx"
                        className="underline font-garetbold text-[#5C2472] break-all"
                        rel="noopener noreferrer"
                    >
                        ayuda.sieej@iieg.gob.mx
                    </a>
                </Typography>
            </div>
        </div>
    );
};
  
export default ClosePage;