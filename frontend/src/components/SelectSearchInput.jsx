import React, { forwardRef } from 'react';

const SelectSearchInput = forwardRef(({
    value, placeholder, onChange, onOpen, onKeyDown, activo,
}, ref) => (
    <input
        ref={ref}
        type="text"
        value={value}
        placeholder={placeholder}
        aria-label={placeholder}
        autoComplete="off"
        onChange={(e) => {
            onOpen?.();
            onChange(e.target.value);
        }}
        onClick={(e) => {
            e.stopPropagation();
            onOpen?.();
        }}
        onKeyDown={onKeyDown}
        className={`
            min-w-0 flex-1 p-0 bg-transparent border-none outline-none cursor-pointer
            font-garetmedium text-[14px] placeholder:font-garetregular placeholder:text-[13px]
            ${activo
        ? 'text-[#5C2472] placeholder-[#5C2472]'
        : 'text-[#191919] placeholder-[#191919]'}
        `}
    />
));

SelectSearchInput.displayName = 'SelectSearchInput';

export default SelectSearchInput;
