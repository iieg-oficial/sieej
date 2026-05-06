import React from 'react';

const IncompleteBadge = ({ count, className = '' }) => {
    if (!count || count <= 0) return null;

    return (
        <span
            className={[
                'bg-orange-400 text-white',
                'absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10',
                'px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none',
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
