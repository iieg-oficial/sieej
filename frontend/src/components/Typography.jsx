import React from 'react';
import Tooltip from './Tooltip';

const tagStyles = {
    h1: 'text-[#191919] text-[28px]/[36px] font-garetbold mb-4',
    h2: 'text-[#5C2472] text-[22px] font-garetbold',
    h3: 'text-[#5C2472] text-sm font-garetbold',
    h4: 'text-[#191919] text-xs font-garetmedium',
    h5: 'text-[#191919] text-[10px] font-garetregular',
    span: 'text-gray-800 text-xs font-garetregular',
    p: 'font-garetbold text-base text-[#191919]',
    label: 'text-[#191919] text-xs font-garetmedium',
};

const Typography = ({
    as: Tag = 'h2',
    titleName,
    className = '',
    style,
    icon,
    colSpan,
    tooltip,
    tooltipModal,
    tooltipPlacement = 'top',
    required,
    badge,
    children,
}) => {
    const content = children ?? titleName;
    if (!content) return <React.Fragment></React.Fragment>;
    const tagClass = typeof Tag === 'string' ? tagStyles[Tag] || '' : '';

    return (
        <div className={`${icon || tooltip ? 'flex items-center space-x-2 md:space-x-4' : ''} ${colSpan ? `col-span-${colSpan}` : ''}`}>
            {icon && <img src={icon} alt="" className="w-8 h-8" />}
            <Tag style={style} className={`${tagClass} ${className} tracking-normal`}>
                {content}
                {required && <span className="text-[#5C2472] ml-1">*</span>}
                {badge}
            </Tag>
            {tooltip && <Tooltip text={tooltip} size={tooltipModal && 'full'} placement={tooltipPlacement}/>}
        </div>
    );
};

export default Typography;