import React, { useEffect, useId, useMemo, useRef } from 'react';
import useGlobal from '@context/useGlobal';
import errorIcon from '@assets/icons/ico_sección_error.svg';
import infoIcon from '@assets/icons/ico_avance_guardado.svg';
import warnIcon from '@assets/icons/ico_confirmación.svg';
import successIcon from '@assets/icons/ico_check.svg';
import Button from './Button';
import Typography from './Typography';

const MODAL_DATA = {
    error: {
        icon: <img src={errorIcon} alt="" className="w-20 h-20" />,
        title: 'Se tuvo problemas con esta sección',
        message: 'Por favor intenta nuevamente',
        buttons: (closeModal) => [
            { label: 'Cerrar', variant: 'secondary', onClick: closeModal },
        ],
    },
    warn: {
        icon: <img src={warnIcon} alt="" className="w-20 h-20" />,
        title: '¿Estás seguro de que quieres enviar tu formulario?',
        message: 'Al dar confirmar y enviar ya no podrás editar la información',
        buttons: (closeModal) => [
            { label: 'Cancelar', variant: 'secondary', onClick: closeModal },
            { label: 'Confirmar', variant: 'primary', onClick: closeModal },
        ],
    },
    success: {
        icon: (
            <div className="w-20 h-20 my-10 rounded-full bg-[#CCFFD2] flex items-center justify-center">
                <img src={successIcon} alt="" className="w-10 h-10" />
            </div>
        ),
        title: 'Sección completada',
        message: '',
        buttons: () => [],
    },
    info: {
        icon: <img src={infoIcon} alt="" className="w-20 h-20" />,
        title: 'Avance guardado',
        message: 'La información aún no ha sido enviada, solamente se ha guardado el avance puedes seguir completando tu registro.',
        buttons: (closeModal) => [
            { label: 'Aceptar', variant: 'secondary', onClick: closeModal },
        ],
    },
    infoSuccess: {
        icon: (
            <div className="w-20 h-20 my-10 rounded-full bg-[#CCFFD2] flex items-center justify-center">
                <img src={successIcon} alt="" className="w-10 h-10" />
            </div>
        ),
        title: 'Gracias por completar tu registro',
        message: 'Te estaremos informando las siguientes etapas vía correo electrónico',
        buttons: (closeModal) => [
            { label: 'Continuar', variant: 'secondary', onClick: closeModal },
        ],
    },
};

const FOCUSABLE_SELECTOR = [
    'a[href]', 'button:not([disabled])', 'input:not([disabled])',
    'select:not([disabled])', 'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(',');

const Modal = () => {
    const { isModalOpen, modalType, modalTitle, modalMessage, modalButtons, closeModal } = useGlobal();
    const { icon, title, message, buttons } = useMemo(() => MODAL_DATA[modalType] || {}, [modalType]);
    const titleId = useId();
    const descriptionId = useId();
    const dialogRef = useRef(null);
    const lastFocusRef = useRef(null);

    useEffect(() => {
        if (modalType === 'success' && isModalOpen) {
            const timer = setTimeout(closeModal, 1500);
            return () => clearTimeout(timer);
        }
    }, [isModalOpen, modalType, closeModal]);

    useEffect(() => {
        if (!isModalOpen) return undefined;

        lastFocusRef.current = document.activeElement;
        const dialog = dialogRef.current;
        const focusables = dialog?.querySelectorAll(FOCUSABLE_SELECTOR);
        focusables?.[0]?.focus();

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                closeModal();
                return;
            }
            if (e.key !== 'Tab' || !focusables?.length) return;
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            if (lastFocusRef.current && typeof lastFocusRef.current.focus === 'function') {
                lastFocusRef.current.focus();
            }
        };
    }, [isModalOpen, closeModal]);

    if (!isModalOpen) return null;

    const renderedButtons = modalButtons || (buttons ? buttons(closeModal) : []);

    return (
        <div
            className="fixed inset-0 bg-black/40 flex justify-center items-center z-50"
            onClick={closeModal}
        >
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={descriptionId}
                onClick={(e) => e.stopPropagation()}
                className="flex flex-col justify-center items-center space-y-15 p-12 rounded-2xl shadow-lg w-[90%] max-w-[812px] min-h-[312px] bg-white overflow-auto"
            >
                {icon && icon}
                <div className="flex flex-col text-center space-y-7">
                    <Typography
                        as="h2"
                        titleName={modalTitle || title}
                        className="text-[21px]"
                    />
                    <span id={titleId} className="sr-only">{modalTitle || title}</span>
                    <Typography
                        as="span"
                        titleName={modalMessage || message}
                        className="text-[18px]"
                    />
                    <span id={descriptionId} className="sr-only">{modalMessage || message}</span>
                </div>
                <div className="flex flex-wrap gap-4 md:gap-15 justify-center">
                    {renderedButtons.map((button, index) => (
                        <Button
                            key={`${button.label}-${index}`}
                            label={button.label}
                            variant={button.variant}
                            onClick={button.onClick}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Modal;
