import React, { useState, useRef, useEffect } from 'react';
import { ESCAPE_PRIORITY, Portal, useAnchoredPosition, useDismissOutside, useEscape, useFocusTrap } from 'biombo/react';
import useGlobal from '@context/useGlobal';
import IcoQuestion from '@assets/icons/ico_tooltip.svg';
import IcoX from '@assets/icons/ico_x_slow.svg';

const MARGEN_VIEWPORT = 8;

const Tooltip = ({ text, showIcon = true, size = 'normal', placement = 'top', children }) => {
    const { isDesktop } = useGlobal();
    const [isHovered, setIsHovered] = useState(false);
    const typeTooltip = isDesktop ? size : 'full';
    const hoverTimeoutRef = useRef(null);
    const childrenRef = useRef(null);
    const triggerRef = useRef(null);
    const panelRef = useRef(null);
    const modalRef = useRef(null);
    const modalAbierto = isHovered && typeTooltip === 'full';
    const cerrar = () => setIsHovered(false);
    const anclado = useAnchoredPosition(panelRef, {
        anchor: showIcon || !children ? triggerRef : childrenRef,
        open: isHovered && typeTooltip !== 'full',
        placement: placement === 'bottom' ? 'bottom' : 'top',
        offset: MARGEN_VIEWPORT,
        margin: MARGEN_VIEWPORT,
    });
    const { getTrapProps } = useFocusTrap(modalRef, { active: modalAbierto });
    const { getDismissProps } = useDismissOutside(modalRef, cerrar, { active: modalAbierto });
    useEscape(cerrar, { enabled: modalAbierto, priority: ESCAPE_PRIORITY.modal });

    useEffect(() => () => {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    }, []);

    if(!text) return children;

    return (
        <div className="inline-flex space-x-1 items-center justify-center">
            {children &&
                <span
                    ref={childrenRef}
                    className="inline-block"
                    onMouseEnter={() => !showIcon && setIsHovered(true)}
                    onMouseLeave={() => !showIcon && setIsHovered(false)}
                >
                    {children}
                </span>
            }
            <span
                ref={triggerRef}
                className="relative"
                onMouseEnter={() => {
                    if (typeTooltip === 'full') {
                        hoverTimeoutRef.current = setTimeout(() => setIsHovered(true), 1000);
                    } else {
                        setIsHovered(true);
                    }
                }}
                onMouseLeave={() => {
                    if (hoverTimeoutRef.current) {
                        clearTimeout(hoverTimeoutRef.current);
                        hoverTimeoutRef.current = null;
                    }
                    setIsHovered(false);
                }}
            >
                {showIcon && (
                    <button type="button" onClick={() => setIsHovered(true)} className="w-5 h-5 bg-transparent !border-0 !p-0 cursor-pointer" aria-label="Mostrar información">
                        <img src={IcoQuestion} alt="tooltip" className="w-5 h-5"/>
                    </button>
                )}
                {isHovered && typeTooltip === 'normal' && (
                    <Portal>
                        <div
                            ref={panelRef}
                            {...anclado.getFloatingProps()}
                            className="
                                fixed inline-flex z-[999]
                                text-xs/[21px] text-[#191919] bg-[#F8F8F8] rounded-[10px] py-4 px-7
                                w-[min(406px,calc(100vw-16px))] text-start whitespace-normal
                                font-garetmedium shadow-[0px_3px_12px_#4615524D]
                            "
                        >
                            <img src={IcoQuestion} alt="tooltip" className="w-5 h-5 mr-6 shrink-0"/>
                            {text}
                        </div>
                    </Portal>
                )}
                {isHovered && isDesktop && typeTooltip === 'small' && (
                    <Portal>
                        <div
                            ref={panelRef}
                            {...anclado.getFloatingProps()}
                            className="
                                fixed z-[999] max-w-[min(280px,calc(100vw-16px))]
                                text-[10px] text-white bg-[#5B6670] rounded px-2 py-1
                                font-garetbold
                            "
                        >
                            {text}
                        </div>
                    </Portal>
                )}
                {isHovered && typeTooltip === 'full' && (
                    <div className="fixed inset-0 flex items-center justify-center z-20 overflow-auto">
                        <div
                            ref={modalRef}
                            {...getTrapProps()}
                            {...getDismissProps()}
                            role="dialog"
                            aria-modal="true"
                            aria-label="Información"
                            className="
                                max-w-lg w-full shadow-[0px_3px_12px_#4615524D] bg-[#F8F8F8] rounded-[10px]
                                p-4 md:py-4 md:px-7 text-start font-garetmedium text-xs/[21px] text-[#191919]
                                max-h-dvh overflow-y-auto grid grid-flow-col
                            "
                        >
                            <div className="w-5 h-full space-y-4 mr-4">
                                <img src={IcoQuestion} alt="tooltip"/>
                                <button type="button" onClick={cerrar} className="cursor-pointer hover:shadow-[0px_3px_12px_#4615524D] rounded-full bg-transparent !border-0 !p-0" aria-label="Cerrar">
                                    <img src={IcoX} alt="tooltip"/>
                                </button>
                            </div>
                            {text}
                        </div>
                    </div>
                )}
            </span>
        </div>
    );
};

export default Tooltip;