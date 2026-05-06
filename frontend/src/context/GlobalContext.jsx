import React, { createContext, useState, useEffect } from 'react';
import { pushAnalyticsEvent } from '../helpers/analytics';

const GlobalContext = createContext();

const GlobalProvider = ({ children }) => {
    const [ isModalOpen, setIsModalOpen ] = useState(false);
    const [ isMessageOpen, setMessageOpen ] = useState(false);
    const [ modalType, setModalType ] = useState('info');
    const [ modalButtons, setModalButtons ] = useState(null);
    const [ modalMessage, setModalMessage ] = useState('');
    const [ modalTitle, setModalTitle ] = useState('');
    const [ screenSize, setScreenSize ] = useState({
        sm: false,
        md: false,
        lg: false,
        xl: false,
        xxl: false,
    });

    const isDevelopment = import.meta.env.VITE_NODE_ENV === 'development';
    const hostBackend = import.meta.env.VITE_BACKEND_API_HOST;
    const isDisabledEdition = import.meta.env.VITE_DISABLED_EDITION === 'true';
    const isMobile = screenSize.sm || screenSize.md;
    const isTablet = screenSize.md;
    const isDesktop = !isMobile && !isTablet;
    const patternMessageEmail = 'El formato del correo electrónico es inválido';
    const linkPrivacity = 'https://www.iieg.gob.mx/ns/wp-content/uploads/2025/02/Aviso_Privacidad_Integral_IIEG_01_2025.pdf';
    const regexEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    const regexPass = /^(?!.*(\b(SELECT|INSERT|DELETE|UPDATE|DROP|UNION|--|#|;|<|>)\b)).*$/;
    const regexTel = /^(\d{2}-?){4}\d{2}$/;
    const regexExt = /^\d{1,9}$/;

    const globalAnalyticsEvent = (action, label) => {
        pushAnalyticsEvent('Todo', action, label);
    };

    const updateScreenSize = () => {
        const width = window.innerWidth;
        setScreenSize({
            sm: width >= 100 && width < 768,
            md: width >= 768 && width < 1024,
            lg: width >= 1024 && width < 1280,
            xl: width >= 1280 && width < 1536,
            xxl: width >= 1536,
        });
    };

    const handleMessage = (status) => setMessageOpen(status);
    const closeModal = () => { setIsModalOpen(false); };
    const handleModalButtons = (buttons) => { setModalButtons(buttons); };

    useEffect(() => {
        updateScreenSize();
        window.addEventListener('resize', updateScreenSize);
        return () => window.removeEventListener('resize', updateScreenSize);
    }, []);

    const openModal = (type, title, message, buttons) => {
        setModalType(type);
        setModalMessage(message || '');
        setModalTitle(title || '');
        handleModalButtons(buttons || null);
        setIsModalOpen(true);
    };

    const value = {
        hostBackend, isDevelopment, screenSize,
        isMobile, isTablet, isDesktop,
        isMessageOpen, onMessage: handleMessage,
        regexEmail, regexPass, regexTel, regexExt,
        patternMessageEmail, linkPrivacity,
        isDisabledEdition,
        isModalOpen, modalType, modalMessage, modalButtons, modalTitle,
        closeModal, openModal, onButtons: handleModalButtons,
        onAnalytics: globalAnalyticsEvent,
    };

    return (
        <GlobalContext.Provider value={value}>
            {children}
        </GlobalContext.Provider>
    );
};

GlobalContext.displayName = 'GlobalContext';

export { GlobalContext, GlobalProvider };
