import React from 'react';

const CORNER_POSITION = {
    'top-right': 'right-0 top-1/2 -translate-y-1/2 translate-x-1/2',
    'bottom-right': 'right-1 bottom-1 translate-x-1/3 translate-y-1/3',
    'top-left': 'left-0 top-1/2 -translate-y-1/2 -translate-x-1/2',
    'bottom-left': 'left-1 bottom-1 -translate-x-1/3 translate-y-1/3',
};

const IncompleteBadge = ({ count, corner = 'top-right', className = '' }) => {
    if (!count || count <= 0) return null;

    return (
        <span
            className={[
                'bg-orange-400 text-white absolute',
                CORNER_POSITION[corner] || CORNER_POSITION['top-right'],
                'z-10 px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none',
                'shadow-sm pointer-events-none select-none',
                'min-w-[16px] text-center',
                className,
            ].join(' ')}
            aria-label={`${count} formulario(s) incompleto(s)`}
        >
            {count > 9 ? '9+' : count}
        </span>
    );
};

export default IncompleteBadge;
