import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import useGlobal from '@context/useGlobal';
import IcoQuestion from '@assets/icons/ico_tooltip.svg';
import IcoX from '@assets/icons/ico_x_slow.svg';

const MARGEN_VIEWPORT = 8;

const Tooltip = ({ text, showIcon = true, size = 'normal', placement = 'top', children }) => {
    const { isDesktop } = useGlobal();
    const [isHovered, setIsHovered] = useState(false);
    const [coords, setCoords] = useState(null);
    const typeTooltip = isDesktop ? size : 'full';
    const hoverTimeoutRef = useRef(null);
    const triggerRef = useRef(null);
    const panelRef = useRef(null);

    useEffect(() => () => {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    }, []);

    useEffect(() => {
        if (!isHovered) setCoords(null);
    }, [isHovered]);

    useLayoutEffect(() => {
        if (!isHovered || typeTooltip === 'full') return;
        const trigger = triggerRef.current;
        const panel = panelRef.current;
        if (!trigger || !panel) return;
        const t = trigger.getBoundingClientRect();
        const p = panel.getBoundingClientRect();
        const left = Math.max(
            MARGEN_VIEWPORT,
            Math.min(
                t.left + t.width / 2 - p.width / 2,
                window.innerWidth - p.width - MARGEN_VIEWPORT,
            ),
        );
        const arriba = t.top - p.height - MARGEN_VIEWPORT;
        const abajo = t.bottom + MARGEN_VIEWPORT;
        const cabeArriba = arriba >= MARGEN_VIEWPORT;
        const preferirArriba = placement !== 'bottom';
        setCoords({
            left,
            top: (preferirArriba && cabeArriba) || abajo + p.height > window.innerHeight
                ? Math.max(MARGEN_VIEWPORT, arriba)
                : abajo,
        });
    }, [isHovered, typeTooltip, text, placement]);

    if(!text) return children;

    return (
        <div className="inline-flex space-x-1 items-center justify-center">
            {children &&
                <span
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
                {isHovered && typeTooltip === 'normal' && createPortal(
                    <div
                        ref={panelRef}
                        style={{
                            top: coords?.top ?? 0,
                            left: coords?.left ?? 0,
                            visibility: coords ? 'visible' : 'hidden',
                        }}
                        className="
                            fixed inline-flex z-[999]
                            text-xs/[21px] text-[#191919] bg-[#F8F8F8] rounded-[10px] py-4 px-7
                            w-[min(406px,calc(100vw-16px))] text-start whitespace-normal
                            font-garetmedium shadow-[0px_3px_12px_#4615524D]
                        "
                    >
                        <img src={IcoQuestion} alt="tooltip" className="w-5 h-5 mr-6 shrink-0"/>
                        {text}
                    </div>,
                    document.body,
                )}
                {isHovered && isDesktop && typeTooltip === 'small' && createPortal(
                    <div
                        ref={panelRef}
                        style={{
                            top: coords?.top ?? 0,
                            left: coords?.left ?? 0,
                            visibility: coords ? 'visible' : 'hidden',
                        }}
                        className="
                            fixed z-[999] max-w-[min(280px,calc(100vw-16px))]
                            text-[10px] text-white bg-[#5B6670] rounded px-2 py-1
                            font-garetbold
                        "
                    >
                        {text}
                    </div>,
                    document.body,
                )}
                {isHovered && typeTooltip === 'full' && (
                    <div
                        className="fixed inset-0 flex items-center justify-center z-20 overflow-auto"
                        onClick={() => setIsHovered(false)}
                        onKeyDown={(e) => { if (e.key === 'Escape') setIsHovered(false); }}
                        role="presentation"
                    >
                        <div
                            className="
                                max-w-lg w-full shadow-[0px_3px_12px_#4615524D] bg-[#F8F8F8] rounded-[10px]
                                p-4 md:py-4 md:px-7 text-start font-garetmedium text-xs/[21px] text-[#191919]
                                max-h-dvh overflow-y-auto grid grid-flow-col
                            "
                            onClick={(e) => e.stopPropagation()}
                            role="presentation"
                        >
                            <div className="w-5 h-full space-y-4 mr-4">
                                <img src={IcoQuestion} alt="tooltip"/>
                                <button type="button" onClick={() => setIsHovered(false)} className="cursor-pointer hover:shadow-[0px_3px_12px_#4615524D] rounded-full bg-transparent !border-0 !p-0" aria-label="Cerrar">
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