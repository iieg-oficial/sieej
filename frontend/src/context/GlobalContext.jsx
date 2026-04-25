import React, { createContext, useState, useEffect } from 'react';
import infoGen from '../assets/icons/ico_info_general.svg';
import infoEnl from '../assets/icons/ico_info_enlaces.svg';
import infoBd from '../assets/icons/ico_info_bd.svg';
import { pushAnalyticsEvent } from '../helpers/analytics';

const GlobalContext = createContext();

const STEPS = [{ 
    title: 'Información general del ente de gobierno', 
    status: 'En proceso', 
    tablename: 'informacion_general',
    icon: infoGen
}, { 
    title: 'Información de enlaces', 
    status: 'No iniciada',
    tablename: 'informacion_enlaces' ,
    icon: infoEnl
}, { 
    title: 'Listado de bases de datos estratégicas', 
    status: 'No iniciada',
    tablename: 'informacion_basesdatos',
    icon: infoBd
}, { 
    title: 'Información de bases de datos', 
    status: 'No iniciada',
    tablename: 'informacion_basesdatos',
    icon: infoBd
}, { 
    title: 'Resumen de cuestionario', 
    status: 'No iniciada',
    tablename: 'resumen'
}
];

const GlobalProvider = ({ children }) => {
    const [ currentStep, setCurrentStep ] = useState(0);
    const [ activeTab, setActiveTab ] = useState(0);
    const [ visitedTabs, setVisitedTabs ] = useState(new Set([activeTab]));
    const [ sizeTabs, setSizeTabs ] = useState(0);
    const [ tabLoading, setTabLoading ] = useState(false);
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
    const isDisabledEdition = import.meta.env.VITE_DISABLED_EDITION;
    const isMobile = screenSize.sm || screenSize.md;
    const isTablet = screenSize.md;
    const isDesktop = !isMobile && !isTablet;
    const isFirst = currentStep === 0;
    const isList = currentStep === 3;
    const isLast = currentStep === STEPS.length - 1;
    const isFirstTab = activeTab === 0;
    const isLastTab = (visitedTabs.size === sizeTabs) && (activeTab === sizeTabs - 1);
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

    const handleActiveTab = (index) => {
        const cleanIndex = (index === null || index === undefined || index < 0 || index >= sizeTabs) ? 0 : index;
        setActiveTab(cleanIndex);
    };

    const handleNext = () => { 
        setCurrentStep(currentStep + 1);
        updateStepStatus(currentStep, 'Completada');
    };

    const handlePrev = () => {
        if (isList && !isFirstTab && activeTab > 0) {
            const tab = activeTab === 0 ? 0 : activeTab - 1;
            handleVisitedTabs(tab);
            return handleActiveTab(tab);
        }
        if (currentStep > 0) setCurrentStep(currentStep - 1);
    };

    const handleVisitedTabs = (index) => {
        if (!visitedTabs.has(index)) {
            setVisitedTabs((prev) => new Set(prev).add(index));
        }
    };

    const resetVisitedTabs = () => {
        setVisitedTabs(new Set([0]));
    };

    const handleMessage = (status) => setMessageOpen(status);
    const closeModal = () => { setIsModalOpen(false) };
    const handleModalButtons = (buttons) => { setModalButtons(buttons) };
    const handleTabLoading = (value) => { setTabLoading(value) };
    const handleSizeTab = (size) => { setSizeTabs(size) };
    const handleTabChange = (index) => { 
        if (index !== undefined && index !== null) { 
            handleActiveTab(index);
            handleVisitedTabs(index);
        } else {
            const nextTab = activeTab + 1;
            if (nextTab >= sizeTabs) return;
            handleActiveTab(nextTab);
            handleVisitedTabs(nextTab);
        }
    };    
    
    const updateStepStatus = (stepIndex, status) => {
        if (STEPS[stepIndex].status === 'Completada') return;
        if (stepIndex >= 0 && stepIndex < STEPS.length) {
            STEPS[stepIndex].status = status;
        }
    };

    useEffect(() => { 
        updateStepStatus(currentStep, 'En proceso');
    }, [currentStep]);

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
        currentStep, steps: STEPS, isDisabledEdition,
        visitedTabs, onVisitedTabs: handleVisitedTabs, resetVisitedTabs,
        activeTab, onActiveTab: handleActiveTab,
        isFirst, isLast, isFirstTab, isLastTab, isList,
        tabLoading, onTabLoading: handleTabLoading,
        sizeTabs, onSizeTab: handleSizeTab,
        isModalOpen, modalType, modalMessage, modalButtons, modalTitle,
        closeModal, openModal, onButtons: handleModalButtons,
        onNext: handleNext, 
        onPrev: handlePrev, 
        onStep: setCurrentStep,
        onTabs: handleTabChange,
        onStatus: updateStepStatus,
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