import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobal } from '../context/GlobalContext';
import sieej from '../assets/svg/logo_sieej_login.svg';
import iieg from '../assets/svg/logo_iieg.svg';
import CardPage from '../components/CardPage';
import Typography from '../components/Typography';
import Message from '../components/Message';
import Button from '../components/Button';

const Disclaimer = () => {
    const { linkPrivacity, onMessage, onAnalytics } = useGlobal();
    const [ accepted, setAccepted ] = useState(false);
    const navigate = useNavigate();

    const handleAccept = () => {
        if (accepted) { 
            navigate('/inicio-sesion'); 
            sessionStorage.setItem('termsAccepted', accepted);
        }
        if (!accepted) onMessage(true);
    };

    useEffect(() => {
        const termsAccepted = sessionStorage.getItem('termsAccepted') === 'true';
        if (termsAccepted) navigate('/inicio-sesion');
        onMessage(false)
    }, []);

    const handleLinkClick = () => {
        onAnalytics('Aviso de privacidad', 'Se direcciona al aviso de privacidad');
    };

    return (
        <CardPage needTerms={false} className="md:pt-0">
            <div className="flex flex-col items-center justify-center relative w-full h-full">
                <img src={sieej} alt="sieej disclaimer" className="hidden md:block"/>
                <div className="flex flex-col items-center justify-center gap-2 sm:gap-6">
                    <Typography as="h2" className="text-center text-[20px]/7 text-[#191919]">
                        Registro de enlaces para el Sistema de Información Estratégica Estatal de Jalisco
                    </Typography>
                    <div className="overflow-y-auto max-h-[200px] md:max-h-[250px] 2xl:max-h-[600px]">
                        <Typography as="span" className="text-xs/[31px]" style={{ color: '#465055'}}>
                            Con fundamento en el artículo 3 de la Ley Orgánica del Instituto de Información Estadística 
                            y Geográfica del Estado de Jalisco, el IIEG tiene como atribuciones el diseño, desarrollo, 
                            operación y actualización del Sistema de Información (fracción II), así como la coordinación 
                            con las instituciones públicas para asegurar que la información generada sea estructurada, comparable, 
                            veraz y oportuna (fracción IV).<br/><br/>
                            
                            En ese sentido, y en un marco de colaboración institucional, se estará solicitando a las distintas 
                            dependencias/entidades del Poder Ejecutivo del Estado su valioso apoyo para compartir bases de datos 
                            e insumos técnicos que puedan alimentar y enriquecer dicho Sistema. Esta acción forma parte de un 
                            esfuerzo conjunto para fortalecer las capacidades del Estado en materia de planeación, programación 
                            y evaluación de políticas públicas, conforme a lo establecido en la fracción I del mismo artículo. <br/><br/>
                            
                            Estamos convencidas y convencidos de que, al 
                            trabajar de manera coordinada, podemos avanzar hacia una gestión pública más eficiente, transparente 
                            y orientada a resultados, construyendo colectivamente una base sólida de información que sirva al 
                            desarrollo de Jalisco.
                        </Typography>
                    </div>
                    <Typography as="span" className="text-[10px] text-[#191919] flex items-center">
                        <input
                            type="checkbox"
                            id="acceptTerms"
                            checked={accepted}
                            onChange={(e) => setAccepted(e.target.checked)}
                            className="
                                w-6 h-6 m-2 border-2 border-[#CCD3E2] rounded-sm appearance-none 
                                hover:shadow-lg hover:shadow-[#2859C440] hover:border-[#5C2472]
                                checked:bg-[#5C2472] checked:border-[#5C2472]
                                checked:before:flex checked:before:items-center checked:before:justify-center 
                                checked:before:h-full checked:before:text-white checked:before:content-['✔'] 
                                checked:before:text-[16px]
                            "
                        />
                        <div className="text-center">
                            Acepto el &nbsp;
                            <a 
                                href={linkPrivacity}
                                target="_blank" 
                                className="underline text-[#5C2472] cursor-pointer"
                                rel="noopener noreferrer"
                                onClick={handleLinkClick}
                            >
                                aviso de privacidad
                            </a>
                        </div>
                    </Typography>
                    <Message type="error" message="Debes aceptar los términos y condiciones para continuar."/>
                    <Button
                        label="Continuar"
                        onClick={handleAccept}
                        disabled={!accepted}
                    />
                    <img src={iieg} alt="logo sin estilos" className="hidden md:block"/>
                </div>
            </div>
        </CardPage>
    );
};

export default Disclaimer;