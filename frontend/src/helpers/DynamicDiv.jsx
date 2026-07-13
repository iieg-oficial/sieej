import React from 'react';

const DynamicDiv = React.forwardRef(function DynamicDiv(
    { colSpan = 1, wDiv, colSpanCondicional, center, inline, className, children },
    ref
) {
    if (inline) {
        if (colSpan === 0) return null;
        return <div ref={ref} className={className || ''}>{children}</div>;
    }

    const colSpanClasses = {
        1: 'col-span-1',
        2: 'col-span-2',
        3: 'col-span-3',
        4: 'col-span-4',
        5: 'col-span-5',
        6: 'col-span-6',
        0: 'hidden'
    };

    const colClass = colSpanCondicional 
        ? colSpanClasses[2] 
        : colSpanClasses[colSpan] || '';

    const wClass = wDiv ? `w-${wDiv}` : '';
    const isCenter = center 
        ? `${className} flex justify-center items-center w-full h-full`
        : `${className} relative mb-4 ${colClass} ${wClass}`;

    return (
        <div ref={ref} className={isCenter}>
            {colSpan === 0 ? <React.Fragment></React.Fragment> : children}
        </div>
    );
});

export default DynamicDiv;
