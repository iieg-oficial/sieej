import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFormState } from 'react-hook-form';
import ErrorsRequired from '../helpers/ErrorsRequired';
import DynamicDiv from "../helpers/DynamicDiv";
import Typography from "./Typography";

const Select = ({
    name, options, label, required, defaultValue, placeholder, colSpan, 
    wDiv, tooltip, tooltipModal, methods, pattern, enableSearch, ...rest
}) => {
    const { register, setValue, control, watch } = methods;
    const { errors } = useFormState({ control, name });
    const [ selectedValue, setSelectedValue ] = useState("");
    const [ showDropdown, setShowDropdown ] = useState(false);
    const [ searchTerm, setSearchTerm ] = useState("");
    const dropdownRef = useRef(null);
    const watchedValue = watch(name);
    
    const handleSelect = (value) => {
        setSelectedValue(value);
        setValue(name, value);
        document.removeEventListener("mousedown", handleClickOutside)
        setSearchTerm("");
    };

    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleClickOutside = useCallback((event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setShowDropdown(false);
            setSearchTerm("");
        }
    }, [dropdownRef]);

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [handleClickOutside]);

    useEffect(() => setSelectedValue(watchedValue), [watchedValue]);

    return (
        <DynamicDiv colSpan={colSpan} wDiv={wDiv} className="mt-[15px]" ref={dropdownRef}>
            <Typography
                as="label"
                titleName={label} 
                tooltip={tooltip} 
                tooltipModal={tooltipModal}
                name={name}
                required={required}
            />
            <div
                id={name}
                name={name}
                className={`
                    mt-[12px] block w-full min-h-[40px] px-3 py-2 rounded-[10px] text-[#5C2472] overflow-hidden
                    ${showDropdown 
                        ? "rounded-t-lg shadow-[0px_4px_20px_#A8A8A899]" 
                        : "rounded-lg hover:shadow-[0px_4px_20px_#A8A8A899] hover:bg-[#FFFFFF] hover:border-[#4A148C] hover:border"
                    }
                    font-garetmedium text-[14px] bg-[#F8F8F8] cursor-pointer
                    placeholder-[#6B6B6B] placeholder:font-garetregular
                    focus:outline-none focus:bg-[#FFFFFF] focus:ring focus:ring-[#4A148C]
                    ${errors[name] ? 'border border-[#EA4336] placeholder-[#EA4336] bg-white' : ''}
                `}
                onClick={() => setShowDropdown((prev) => !prev)}
                {...rest}
                {...register(name, { 
                    required: required ? 'Este campo es obligatorio' : false,
                    pattern: pattern ? { value: pattern, message: 'Formato inválido' } : false,
                })}
            >   
                {selectedValue ? (
                    <span>{options.find(option => option.value === selectedValue)?.label}</span>
                ) : (
                    <span 
                        className={`
                            font-garetregular text-[13px] 
                            ${showDropdown ? "text-[#5C2472] font-garetmedium" : "text-[#191919]"}
                            hover:text-[#5C2472] hover:font-garetmedium
                        `}
                    > 
                        {placeholder || 'Selecciona una opción'}
                    </span>
                )}
                {showDropdown && (
                    <div
                        className="
                            absolute left-0 top-17 z-2 bg-white shadow-lg shadow-[#B6A6BC99]
                            rounded-b-lg w-full max-h-120 overflow-auto
                        "
                    >
                        {enableSearch && (
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder={'Busca una opción'}
                                className={`
                                    w-full h-[40px] px-3 border-none outline-none bg-[#F8F8F8] font-garetmedium
                                    placeholder-[#8E8E8E] placeholder:font-garetregular sticky top-0
                                    ${selectedValue ? "text-[#5C2472]" : "text-[#191919]"}
                                `}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowDropdown(true);
                                }}
                            />
                        )}
                        {filteredOptions.map(({ value, label }) => (
                            <div
                                key={value}
                                className="flex items-center w-full px-3 py-2 hover:bg-[#F8F8F8] cursor-pointer"
                                onClick={() => handleSelect(value)}
                            >
                                <span
                                    className={`
                                        text-[13px] text-[#191919]
                                        ${selectedValue === value ? 'font-garetbold' : 'font-garetregular'}
                                    `}
                                >
                                    {label}
                                </span>
                            </div>
                        ))}
                        {filteredOptions.length === 0 && (
                            <div className="flex items-center font-garetregular w-full px-3 py-2 text-[#8E8E8E]">
                                No se encontraron opciones
                            </div>
                        )}
                    </div>
                )}
            </div>
            <ErrorsRequired name={name} errors={errors}/>
        </DynamicDiv>
    );
};

export default Select;
