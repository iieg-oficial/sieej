import React from 'react';
import { placementClasses } from './gridLayout';

const DynamicDiv = React.forwardRef(function DynamicDiv(
    {
        colSpan = 1, wDiv, colSpanCondicional, center, inline, newRow, col, alone,
        className, children
    },
    ref
) {
    if (inline) {
        if (colSpan === 0) return null;
        return <div ref={ref} className={className || ''}>{children}</div>;
    }

    const placement = colSpanCondicional
        ? placementClasses({ colSpan: 2 })
        : placementClasses({ colSpan, col, newRow, alone });

    const wClass = wDiv ? `w-${wDiv}` : '';
    const isCenter = center
        ? `${className} flex justify-center items-center w-full h-full`
        : `${className} relative mb-4 ${placement} ${wClass}`;

    return (
        <div ref={ref} className={isCenter}>
            {colSpan === 0 ? <React.Fragment></React.Fragment> : children}
        </div>
    );
});

export default DynamicDiv;
