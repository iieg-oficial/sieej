import React, { useState, useRef, useEffect } from 'react';
import useGlobal from '@context/useGlobal';
import IcoQuestion from '@assets/icons/ico_tooltip.svg';
import IcoX from '@assets/icons/ico_x_slow.svg';

const Tooltip = ({ text, showIcon = true, size = 'normal', children }) => {
    const { isDesktop } = useGlobal();
    const [isHovered, setIsHovered] = useState(false);
    const typeTooltip = isDesktop ? size : 'full';
    const hoverTimeoutRef = useRef(null);

    useEffect(() => () => {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    }, []);

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
                    <button type="button" onClick={() => setIsHovered(true)} className="w-5 h-5 bg-transparent border-0 p-0 cursor-pointer" aria-label="Mostrar información">
                        <img src={IcoQuestion} alt="tooltip" className="w-5 h-5"/>
                    </button>
                )}
                {isHovered && typeTooltip === 'normal' && (
                    <div 
                        className="
                            absolute inline-flex bottom-full left-1/2 transform -translate-x-1/2 mb-1 
                            text-xs/[21px] text-[#191919] bg-[#F8F8F8] rounded-[10px] py-4 px-7 z-20
                            w-[406px] text-start whitespace-normal font-garetmedium shadow-[0px_3px_12px_#4615524D]
                        "
                    >
                        <img src={IcoQuestion} alt="tooltip" className="w-5 h-5 mr-6"/>
                        {text}
                    </div>
                )}
                {isHovered && isDesktop && typeTooltip === 'small' && (
                    <div 
                        className="
                            absolute bottom-6 -left-1 transform -translate-x-18
                            text-[10px] text-white bg-[#8591AB] rounded px-2 py-1 z-20
                            font-garetbold whitespace-nowrap
                        "
                    >
                        {text}
                    </div>
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
                                <button type="button" onClick={() => setIsHovered(false)} className="cursor-pointer hover:shadow-[0px_3px_12px_#4615524D] rounded-full bg-transparent border-0 p-0" aria-label="Cerrar">
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