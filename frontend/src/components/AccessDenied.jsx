import React from 'react';
import useAuth from '@context/useAuth';
import Typography from '@components/Typography';
import Button from '@components/Button';

const LockIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#5C2473"
        strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
);

const AccessDenied = ({
    title = 'No tienes acceso a SIEEJ',
    description = 'Tu cuenta aún no tiene una dependencia asignada en SIEEJ. Ponte en contacto con tu enlace en el IIEG para que habiliten tu acceso.',
}) => {
    const { onLogout } = useAuth();
    return (
        <div className="w-full rounded-[20px] bg-white px-2 pb-2 md:px-10 md:pb-10 md:pt-10">
            <div className="w-full py-10 flex flex-col items-center text-center max-w-[440px] mx-auto">
                <div className="w-16 h-16 rounded-full bg-[#F0E2F5] flex items-center justify-center mb-5">
                    <LockIcon />
                </div>
                <Typography
                    as="h3"
                    className="text-[#212121] font-garetbold mb-2"
                    titleName={title}
                />
                <Typography
                    as="p"
                    className="text-[#7C7C7C] font-garetregular"
                    titleName={description}
                />
                <div className="mt-8">
                    <Button label="Cerrar sesión" variant="primary" onClick={onLogout} />
                </div>
            </div>
        </div>
    );
};

export default AccessDenied;
