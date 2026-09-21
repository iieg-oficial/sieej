import React, { useState } from 'react';
import useGlobal from '@context/useGlobal';
import Tooltip from './Tooltip';
import Spinner from './Spinner';
import DynamicDiv from '@helpers/DynamicDiv';

const Button = ({
    type = 'button',        // button | submit | reset | custom
    variant = 'primary',    // 'primary' | 'secondary' | 'outline' | 'link' | 'delete' | 'label' | 'danger' | 'disabled' | 'inline'
    disabled = false,       // true | false
    loading = false,        // true | false
    iconButton = null,      // React component
    icon = null,            // React component
    sufIcon = null,         // React component
    sufIconButton = false,  // true | false
    onSufClick = () => {},  
    sufExtra = null,
    onHoverIcon = null,     // React component
    fullWidth = false,      // true | false
    fit = false,            // ancho segun contenido en vez de fijo
    isActive = false,       // true | false
    isVisited = false,      // true | false
    className = '',  
    iconButtonStyle = 'w-5 h-5',
    tooltip = null,       
    center,    
    label,
    onClick,                
    colSpan, 
    wDiv,
    ...rest                 
}) => {
    const { isMobile } = useGlobal();
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => setIsHovered(false);

    const isLabel = variant === 'label';

    const baseStyles = `
        flex items-center justify-center h-[40px] rounded-[20px]
        ${fit ? 'w-auto px-6' : 'w-[240px] md:w-[260px] grow'}
        ${fullWidth && 'w-full'}
    `;

    const variants = {
        primary: `
            bg-[#5C2472] text-white focus-visible:outline-none
            hover:shadow-[0px_8px_16px_#4615524D]
        `,
        secondary: `
            bg-[#E2E2E2] text-[#465055]
            hover:bg-[#CECDCD] hover:shadow-[0px_8px_16px_#6E6E6E29]
        `,
        inline: `
            bg-transparent text-[#5C2472] ring-[#5C2472] ring-1 
            hover:bg-[#703089] hover:text-white 
            focus:ring-[#5C2472] active:ring-[#5C2472]
        `,
        outline: `
            bg-transparent text-[#5C2472] border border-[#5C2472]
            hover:bg-[#FAF5FC]
        `,
        link: `
            bg-transparent text-[#5C2472] hover:underline
        `,
        delete: `
            bg-transparent text-[#B3261E] border border-[#FCDBDA]
            hover:bg-[#FCDBDA] 
        `,
        danger: `
            bg-[#C60800] text-white border border-[#C60800]
            hover:bg-[#B40700] 
        `,
        label: isActive ? `
            bg-[#FFE9CC] text-[#9E5200] ring ring-[#FF8300]
        ` : isVisited ? `text-[#32A752] bg-[#EAF6ED]`: `text-[#465055] bg-[#F8F8F8]`
        ,
        disabled: `
            ${variant === 'link' ? 'bg-transparent' : 'bg-[#CBCBCB]'} 
            text-[#5B6670] cursor-not-allowed
        `,
    };

    const getVariantStyles = (variant) => {
        return disabled ? variants['disabled'] : variants[variant] || variants['primary'];
    };

    return (
        <DynamicDiv colSpan={colSpan} wDiv={wDiv} center={center} inline={fit}>
            <Tooltip text={tooltip} showIcon={false} size="small">
                <button
                    type={type}
                    onClick={onClick}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    disabled={disabled || loading}
                    className={`${className} ${baseStyles} ${getVariantStyles(variant)}`}
                    style={{
                        ...(isLabel && { width: 'auto', padding: '4px 16px', borderRadius: '0.5rem', height: '30px' }),
                        ...(iconButton && { width: '40px', height: '40px', padding: 9, borderRadius: !isMobile && '50%', flexShrink: 0}),
                        ...(disabled && tooltip && { pointerEvents: 'none' }),
                    }}
                    aria-busy={loading}
                    aria-label={label || 'button'}
                    {...rest}
                >
                    {icon && !loading && (
                        <img 
                            src={ isHovered ? (onHoverIcon ? onHoverIcon : icon) : icon } 
                            alt="icon" 
                            className="mr-5 h-3 w-3"
                        />
                    )}
                    
                    {iconButton && (
                        <img 
                            src={ isHovered ? (onHoverIcon ? onHoverIcon : iconButton) : iconButton  } 
                            alt="iconButton" 
                            className={iconButtonStyle}
                        />
                    )}

                    {loading ? (
                        <Spinner color={variant === 'primary' ? '#FFF' : undefined} />
                    ) : (
                        <span className={`
                            font-garetbold 
                            ${isLabel ? `text-base` : `text-sm`}
                        `}>
                            {label}
                        </span>
                    )}

                    {sufExtra && !loading && sufExtra}

                    {sufIcon && !loading && (
                        <span
                            role={sufIconButton ? 'button' : undefined} 
                            tabIndex={sufIconButton ? 0 : undefined} 
                            onClick={sufIconButton ? onSufClick : undefined}
                            onKeyDown={(e) => sufIconButton && e.key === 'Enter' && onSufClick()}
                            className="ml-5 h-3 hover:invert-20 cursor-pointer"
                        >
                            <img 
                                src={isHovered ? (onHoverIcon || sufIcon) : sufIcon} 
                                alt="sufIcon" 
                                className="h-3"
                            />
                        </span>
                    )}  
                </button>
            </Tooltip>
        </DynamicDiv>
    );
};

export default Button;
