import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFormState } from 'react-hook-form';
import arrowDown from '@assets/icons/ico_down_arrow.svg';
import ErrorsRequired from '@helpers/ErrorsRequired';
import { getFieldError } from '@helpers/formErrors';
import DynamicDiv from '@helpers/DynamicDiv';
import useFieldClear from '@helpers/useFieldClear';
import { filterOptions, shouldSearch } from '@helpers/selectSearch';
import FieldClearButton from './FieldClearButton';
import SelectSearchInput from './SelectSearchInput';
import Typography from './Typography';

const SelectMultiple = ({
    name, options, label, badge, required, tooltip,
    placeholder, colSpan, col, wDiv, methods, pattern, enableSearch, ...rest
}) => {
    const { register, setValue, control, getValues } = methods;
    const { errors } = useFormState({ control, name });
    const [ selectedValues, setSelectedValues ] = useState([]);
    const [ showDropdown, setShowDropdown ] = useState(false);
    const [ searchTerm, setSearchTerm ] = useState('');
    const dropdownRef = useRef(null);
    const searchRef = useRef(null);
    const searchEnabled = enableSearch ?? shouldSearch(options);
    const filteredOptions = searchEnabled ? filterOptions(options, searchTerm) : options;
    const hasThingSelected = selectedValues.length > 0;
    const vaciarSeleccion = useCallback(() => setSelectedValues([]), []);
    const { clear } = useFieldClear({
        methods, name, empty: [], onClear: vaciarSeleccion,
    });

    const handleSelect = (value) => {
        let newValues;
        if (selectedValues.includes(value)) {
            newValues = selectedValues.filter((v) => v !== value);
        } else {
            newValues = [...selectedValues, value];
        }
        setSelectedValues(newValues);
        setValue(name, newValues);
        setSearchTerm('');
        searchRef.current?.focus();
    };

    const handleRemoveTag = (value) => {
        const newValues = selectedValues.filter((v) => v !== value);
        setSelectedValues(newValues);
        setValue(name, newValues);
    };

    const handleClickOutside = useCallback((event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setShowDropdown(false);
            setSearchTerm('');
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

    useEffect(() => {
        if (showDropdown && searchEnabled) searchRef.current?.focus();
        if (!showDropdown) setSearchTerm('');
    }, [showDropdown, searchEnabled]);

    return (
        <DynamicDiv colSpan={colSpan} col={col} wDiv={wDiv} className="mt-[15px] group/field" ref={dropdownRef}>
            <Typography
                as="label"
                titleName={label}
                tooltip={tooltip}
                name={name}
                required={required}
                badge={badge}
            />
            <div
                id={name}
                name={name}
                role="combobox"
                tabIndex={searchEnabled ? -1 : 0}
                aria-controls={`${name}-listbox`}
                aria-expanded={showDropdown}
                onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                        setShowDropdown(false);
                    } else if (!searchEnabled && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        setShowDropdown((prev) => !prev);
                    }
                }}
                className={`
                    mt-[12px] block w-full min-h-[40px] px-3 py-2 flex items-center justify-between rounded-lg
                    ${showDropdown ? 'shadow-[0px_4px_20px_#A8A8A899]' : ''}
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
                {hasThingSelected || searchEnabled ? (
                    <div className="flex flex-wrap items-center gap-2 min-w-0 flex-1">
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
                        {searchEnabled && (
                            <SelectSearchInput
                                ref={searchRef}
                                value={searchTerm}
                                placeholder={hasThingSelected
                                    ? 'Busca otra opción'
                                    : (placeholder || 'Busca o selecciona una o más opciones')}
                                onChange={setSearchTerm}
                                onOpen={() => setShowDropdown(true)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Escape') setShowDropdown(false);
                                }}
                                activo={hasThingSelected}
                            />
                        )}
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
                <div className="flex items-center gap-1 shrink-0">
                    {hasThingSelected && <FieldClearButton label={label} onClear={clear} />}
                    <img src={arrowDown} alt="seleccion multiple icono drop"/>
                </div>
            </div>

            {showDropdown && (
                <div
                    className="
                        absolute z-2 mt-2 bg-white shadow-lg shadow-[#B6A6BC99]
                        rounded-lg w-full max-h-120 overflow-auto py-1
                    "
                >
                    {filteredOptions.map(({ value, label }) => (
                        <div
                            key={value}
                            className={`
                                flex items-center px-3 py-1
                                ${selectedValues.includes(value) ? 'bg-[#FBF1FF]' : 'hover:bg-gray-100'}
                            `}
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
                                    cursor-pointer text-[13px]
                                    ${selectedValues.includes(value)
                            ? 'font-garetbold text-[#5C2472]'
                            : 'font-garetregular text-[#191919]'
                        }`}
                            >
                                {label}
                            </label>
                        </div>
                    ))}
                    {filteredOptions.length === 0 && (
                        <div className="flex items-center font-garetregular w-full px-3 py-2 text-[#8E8E8E]">
                            No se encontraron opciones
                        </div>
                    )}
                </div>
            )}

            <ErrorsRequired name={name} errors={errors} />
        </DynamicDiv>
    );
};

export default SelectMultiple;
