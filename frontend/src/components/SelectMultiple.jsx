import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFormState } from 'react-hook-form';
import arrowDown from '@assets/icons/ico_down_arrow.svg';
import ErrorsRequired from '@helpers/ErrorsRequired';
import { getFieldError } from '@helpers/formErrors';
import DynamicDiv from '@helpers/DynamicDiv';
import Typography from './Typography';

const SelectMultiple = ({
    name, options, label, required, tooltip,
    placeholder, colSpan, col, wDiv, methods, pattern, ...rest
}) => {
    const { register, setValue, control, getValues } = methods;
    const { errors } = useFormState({ control, name });
    const [ selectedValues, setSelectedValues ] = useState([]);
    const [ showDropdown, setShowDropdown ] = useState(false);
    const dropdownRef = useRef(null);
    const hasThingSelected = selectedValues.length > 0;

    const handleSelect = (value) => {
        let newValues;
        if (selectedValues.includes(value)) {
            newValues = selectedValues.filter((v) => v !== value);
        } else {
            newValues = [...selectedValues, value];
        }
        setSelectedValues(newValues);
        setValue(name, newValues);
    };

    const handleRemoveTag = (value) => {
        const newValues = selectedValues.filter((v) => v !== value);
        setSelectedValues(newValues);
        setValue(name, newValues);
    };

    const handleClickOutside = useCallback((event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setShowDropdown(false);
        }
    }, []);
    
    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [handleClickOutside]);

    useEffect(() => {
        const fieldValue = getValues(name);
        if (fieldValue) setSelectedValues(fieldValue);
    }, [getValues, name]);

    return (
        <DynamicDiv colSpan={colSpan} col={col} wDiv={wDiv} className="mt-[15px]" ref={dropdownRef}>
            <Typography
                as="label"
                titleName={label} 
                tooltip={tooltip} 
                name={name}
                required={required}
            />
            <div
                id={name}
                name={name}
                role="combobox"
                tabIndex={0}
                aria-controls={`${name}-listbox`}
                aria-expanded={showDropdown}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setShowDropdown((prev) => !prev);
                    }
                }}
                className={`
                    mt-[12px] block w-full min-h-[40px] px-3 py-2 flex items-center justify-between 
                    ${showDropdown ? 'rounded-t-lg' : 'rounded-lg '}
                    ${hasThingSelected ? 'bg-white' : 'bg-[#F8F8F8] cursor-pointer hover:border-[#5C2472] hover:border-1'}
                    focus:outline-none focus:ring-1 focus:ring-[#5C2472] 
                    hover:shadow-lg hover:shadow-[#CECECE33] hover:bg-white
                     ${getFieldError(errors, name) ? 'border border-[#EA4336] placeholder-[#EA4336] bg-white' : ''}
                `}
                onClick={() => setShowDropdown((prev) => !prev)}
                {...register(name, {
                    required: required ? 'Este campo es obligatorio' : false,
                    pattern: pattern ? { value: pattern, message: 'Formato inválido' } : false,
                })}
                {...rest}
            >
                {hasThingSelected ? (
                    <div className="flex flex-wrap gap-2">
                        {selectedValues.map((value) => {
                            const optionLabel = options.find((option) => option.value === value)?.label;
                            return (
                                <div 
                                    key={value}
                                    className="
                                        flex items-center justify-center text-[13px] text-[#5C2472] font-garetmedium 
                                        bg-[#FBF1FF] gap-2 px-2 py-1 rounded-lg
                                    " 
                                >
                                    <span className="flex items-center">
                                        {optionLabel}
                                    </span>
                                    <span
                                        role="button"
                                        tabIndex={0}
                                        aria-label={`Eliminar ${optionLabel}`}
                                        className="text-[10px] cursor-pointer flex items-center"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                handleRemoveTag(value);
                                            }
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveTag(value);
                                        }}
                                    >
                                        &#120;
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <span 
                        className={`
                            font-garetregular text-[13px] 
                            ${showDropdown ? 'text-[#5C2472] font-garetmedium' : 'text-[#191919]'}
                            hover:text-[#5C2472] hover:font-garetmedium
                        `}
                    > 
                        {placeholder || 'Selecciona una o más opciónes'}
                    </span>
                )}
                <img src={arrowDown} alt="seleccion multiple icono drop"/>
            </div>

            {showDropdown && (
                <div
                    className="
                        absolute z-2 bg-white shadow-lg shadow-[#B6A6BC99]
                        rounded-b-lg w-full max-h-120 overflow-auto
                    "
                >
                    {options.map(({ value, label }) => (
                        <div
                            key={value}
                            className="flex items-center px-3 py-1 hover:bg-gray-100"
                        >
                            <input
                                type="checkbox"
                                id={`${name}-${value}`}
                                checked={selectedValues.includes(value)}
                                onChange={() => handleSelect(value)}
                                className="
                                    w-[20px] h-[20px] mr-[10px] my-[5px] border border-[#CCD3E2] rounded-sm appearance-none 
                                    hover:shadow-lg hover:shadow-[#2859C440] hover:border-[#5C2472]
                                    checked:bg-[#5C2472] checked:border-[#5C2472]
                                    checked:before:flex checked:before:items-center checked:before:justify-center 
                                    checked:before:h-full checked:before:text-white checked:before:content-['✔'] 
                                    checked:before:text-[16px]
                                "
                            />
                            <label
                                htmlFor={`${name}-${value}`}
                                className={`
                                    cursor-pointer text-[13px] text-[#191919]
                                    ${selectedValues.includes(value) ? 'font-garetbold' : 'font-garetregular'
                        }`}
                            >
                                {label}
                            </label>
                        </div>
                    ))}
                </div>
            )}

            <ErrorsRequired name={name} errors={errors} />
        </DynamicDiv>
    );
};

export default SelectMultiple;
