import React from 'react';
import { GRID_COLUMNS, placementClasses } from './gridLayout';

const DynamicDiv = React.forwardRef(function DynamicDiv(
    {
        colSpan = GRID_COLUMNS, wDiv, center, inline, col,
        className, children
    },
    ref
) {
    if (inline) {
        if (colSpan === 0) return null;
        return <div ref={ref} className={className || ''}>{children}</div>;
    }

    const placement = placementClasses({ colSpan, col });

    const wClass = wDiv ? `w-${wDiv}` : '';
    const isCenter = center
        ? `${className} flex justify-center items-center w-full h-full`
        : `${className} relative mb-2 ${placement} ${wClass}`;

    return (
        <div ref={ref} className={isCenter}>
            {colSpan === 0 ? <React.Fragment></React.Fragment> : children}
        </div>
    );
});

export default DynamicDiv;
