import React from 'react';
import ClearIcon from './icons/ClearIcon';

const FieldClearButton = ({ label, onClear, className = '' }) => (
    <button
        type="button"
        onClick={(e) => {
            e.stopPropagation();
            onClear();
        }}
        aria-label={`Limpiar ${typeof label === 'string' && label ? label : 'campo'}`}
        title="Limpiar campo"
        className={`
            ${className}
            inline-flex items-center justify-center shrink-0 w-[22px] h-[22px] rounded-full
            border-none! bg-transparent p-0! text-[#8E8E8E] cursor-pointer
            opacity-0 transition-opacity
            group-hover/field:opacity-100 group-focus-within/field:opacity-100
            focus-visible:opacity-100 focus-visible:outline-none
            focus-visible:ring-1 focus-visible:ring-[#5C2472]
            hover:text-[#5C2472] hover:bg-[#F0E2F5]!
        `}
    >
        <ClearIcon />
    </button>
);

export default FieldClearButton;
