import React, { useEffect } from 'react';
import { useGlobal } from '../context/GlobalContext';
import closeImage from '../assets/svg/closePage.svg';
import Typography from '../components/Typography';
import { useLocation } from 'react-router-dom';

const ClosePage = () => {
    const { onAnalytics } = useGlobal();
    const location = useLocation();

    useEffect(() => {
        onAnalytics('error 404', `Intentaron acceder a: ${location.pathname}`);
    }, []);

    return (
        <div className="flex flex-col mx-2 gap-5 items-center justify-start bg-white">
            <img 
                src={closeImage} 
                alt="error 404" 
                className="max-w-full h-auto lg:max-h-[352px] lg:max-w-[782px]"
            />
            <div className="flex flex-col items-center text-center gap-y-5">
                <Typography 
                    as="h2" 
                    titleName="Estamos en etapa de revisión de información" 
                    className="text-[30px] md:text-[50px]/[70px] max-w-[1125px] tracking-tight" 
                    style={{ margin: 0 }}
                />
                <Typography 
                    as="p"
                    className="w-full font-garetbook max-w-[1080px] text-sm md:text-[24px]/[41px] tracking-normal"
                >
                    El sistema de información estará temporalmente inactivo debido a tareas de análisis de <br/>
                    datos y generación de oficios, con base en la información previamente registrada. <br/><br/>
                    
                    Durante este periodo, no será posible acceder al sistema. <br/>
                    Agradecemos tu comprensión y te pedimos estar atento a la reactivación del servicio. <br/><br/>

                    Si tienes algún comentario, escríbenos a: &nbsp;
                    <a className={`underline font-garetbold text-[#5C2472]`} rel="noopener noreferrer">
                        ayuda.sieej@iieg.gob.mx
                    </a>
                </Typography>
            </div>
        </div>
    )
}
  
export default ClosePage;