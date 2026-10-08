import React, { useCallback, useEffect, useRef, useState } from 'react';
import icoArrow from '@assets/icons/ico_down_arrow.svg';

const PLACEHOLDER = 'Sin fecha exacta';

const itemClassName = (active) => {
    const base = 'w-full text-left px-3 py-2 font-garetmedium text-[13px] transition '
        + 'focus:outline-none focus-visible:ring-1 focus-visible:ring-[#5C2472] ';
    return active
        ? `${base}bg-[#5C2472] text-white`
        : `${base}text-[#191919] hover:bg-[#F0E2F5] hover:text-[#5C2472]`;
};

const CalendarOptions = ({ options, optionValue, onSelectOption }) => {
    const [open, setOpen] = useState(false);
    const wrapRef = useRef(null);

    const handleClickOutside = useCallback((event) => {
        if (wrapRef.current && !wrapRef.current.contains(event.target)) setOpen(false);
    }, []);

    useEffect(() => {
        if (!open) return undefined;
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open, handleClickOutside]);

    if (!options.length) return null;

    const selectedLabel = optionValue
        ? (options.find((o) => o.value === optionValue)?.label ?? optionValue)
        : '';

    const elegir = (value) => {
        onSelectOption(value === optionValue ? '' : value);
        setOpen(false);
    };

    return (
        <div ref={wrapRef} className="relative mt-3">
            <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={() => setOpen((prev) => !prev)}
                className={`flex items-center justify-between w-full h-[36px] px-3 rounded-[8px]
                    font-garetmedium text-[13px] transition focus:outline-none
                    focus-visible:ring-1 focus-visible:ring-[#5C2472]
                    ${selectedLabel
            ? 'bg-[#F0E2F5] text-[#5C2472]'
            : 'bg-[#F8F8F8] text-[#6B6B6B] font-garetregular hover:bg-[#F0E2F5] hover:text-[#5C2472]'}`}
            >
                <span className="truncate">{selectedLabel || PLACEHOLDER}</span>
                <img
                    src={icoArrow}
                    alt=""
                    className={`w-[10px] h-[7px] ml-2 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
                />
            </button>
            {open && (
                <div
                    role="listbox"
                    className="absolute left-0 right-0 bottom-full mb-1 z-30 bg-white rounded-[8px]
                        border border-[#5C2472] shadow-[0px_2px_24px_#B6A6BC98]
                        max-h-[220px] overflow-y-auto overflow-x-hidden"
                >
                    {selectedLabel && (
                        <button
                            type="button"
                            role="option"
                            aria-selected={false}
                            onClick={() => elegir(optionValue)}
                            className={`${itemClassName(false)} border-b border-[#EAEAEA]`}
                        >
                            Usar una fecha del calendario
                        </button>
                    )}
                    {options.map(({ value, label }) => (
                        <button
                            key={value}
                            type="button"
                            role="option"
                            aria-selected={value === optionValue}
                            onClick={() => elegir(value)}
                            className={itemClassName(value === optionValue)}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CalendarOptions;
