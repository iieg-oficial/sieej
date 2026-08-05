import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFormState } from 'react-hook-form';
import ErrorsRequired from '@helpers/ErrorsRequired';
import { getFieldError } from '@helpers/formErrors';
import DynamicDiv from '@helpers/DynamicDiv';
import useFieldClear from '@helpers/useFieldClear';
import { filterOptions, shouldSearch } from '@helpers/selectSearch';
import FieldClearButton from './FieldClearButton';
import SelectSearchInput from './SelectSearchInput';
import Typography from './Typography';

const Select = ({
    name, options, label, badge, required, _defaultValue, placeholder, colSpan, col,
    wDiv, tooltip, tooltipModal, methods, pattern, enableSearch, ...rest
}) => {
    const { register, setValue, control, watch } = methods;
    const { errors } = useFormState({ control, name });
    const { hasValue, clear } = useFieldClear({ methods, name });
    const [ selectedValue, setSelectedValue ] = useState('');
    const [ showDropdown, setShowDropdown ] = useState(false);
    const [ searchTerm, setSearchTerm ] = useState(null);
    const dropdownRef = useRef(null);
    const searchRef = useRef(null);
    const watchedValue = watch(name);

    const searchEnabled = enableSearch ?? shouldSearch(options);
    const selectedLabel = options.find((option) => option.value === selectedValue)?.label ?? '';
    const escribiendo = searchTerm !== null;
    const filteredOptions = escribiendo ? filterOptions(options, searchTerm) : options;

    const handleSelect = (value) => {
        setSelectedValue(value);
        setValue(name, value);
        setSearchTerm(null);
        setShowDropdown(false);
    };

    const handleClickOutside = useCallback((event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setShowDropdown(false);
            setSearchTerm(null);
        }
    }, [dropdownRef]);

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [handleClickOutside]);

    useEffect(() => setSelectedValue(watchedValue), [watchedValue]);

    useEffect(() => {
        if (!searchEnabled) return;
        if (showDropdown) {
            setSearchTerm('');
            searchRef.current?.focus();
        } else {
            setSearchTerm(null);
        }
    }, [showDropdown, searchEnabled]);

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Escape') {
            setShowDropdown(false);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredOptions.length > 0) handleSelect(filteredOptions[0].value);
        }
    };

    return (
        <DynamicDiv colSpan={colSpan} col={col} wDiv={wDiv} className="mt-[15px] group/field" ref={dropdownRef}>
            <Typography
                as="label"
                titleName={label}
                tooltip={tooltip}
                tooltipModal={tooltipModal}
                name={name}
                required={required}
                badge={badge}
            />
            <div
                id={name}
                role="combobox"
                tabIndex={searchEnabled ? -1 : 0}
                aria-expanded={showDropdown}
                aria-haspopup="listbox"
                aria-controls={`${name}-listbox`}
                onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                        setShowDropdown(false);
                    } else if (!searchEnabled && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        setShowDropdown((prev) => !prev);
                    }
                }}
                className={`
                    mt-[12px] flex items-center justify-between gap-2 w-full min-h-[40px] px-3 py-2 rounded-lg text-[#5C2472] overflow-hidden
                    ${showDropdown
            ? 'shadow-[0px_4px_20px_#A8A8A899]'
            : 'hover:shadow-[0px_4px_20px_#A8A8A899] hover:bg-[#FFFFFF] hover:border-[#4A148C] hover:border'
        }
                    font-garetmedium text-[14px] bg-[#F8F8F8] cursor-pointer
                    placeholder-[#6B6B6B] placeholder:font-garetregular
                    focus:outline-none focus:bg-[#FFFFFF] focus:ring focus:ring-[#4A148C]
                    ${getFieldError(errors, name) ? 'border border-[#EA4336] placeholder-[#EA4336] bg-white' : ''}
                `}
                onClick={() => setShowDropdown((prev) => !prev)}
                {...rest}
                {...register(name, {
                    required: required ? 'Este campo es obligatorio' : false,
                    pattern: pattern ? { value: pattern, message: 'Formato inválido' } : false,
                })}
            >   
                {searchEnabled ? (
                    <SelectSearchInput
                        ref={searchRef}
                        value={escribiendo ? searchTerm : selectedLabel}
                        placeholder={selectedLabel || placeholder || 'Busca o selecciona una opción'}
                        onChange={setSearchTerm}
                        onOpen={() => setShowDropdown(true)}
                        onKeyDown={handleSearchKeyDown}
                        activo={!!selectedValue}
                    />
                ) : (selectedValue ? (
                    <span className="min-w-0 truncate">{selectedLabel}</span>
                ) : (
                    <span
                        className={`
                            font-garetregular text-[13px]
                            ${showDropdown ? 'text-[#5C2472] font-garetmedium' : 'text-[#191919]'}
                            hover:text-[#5C2472] hover:font-garetmedium
                        `}
                    >
                        {placeholder || 'Selecciona una opción'}
                    </span>
                ))}
                {hasValue && <FieldClearButton label={label} onClear={clear} />}
                {showDropdown && (
                    <div
                        id={`${name}-listbox`}
                        role="listbox"
                        className="
                            absolute left-0 top-[76px] z-2 bg-white shadow-lg shadow-[#B6A6BC99]
                            rounded-lg w-full max-h-120 overflow-auto py-1
                        "
                    >
                        {filteredOptions.map(({ value, label }) => (
                            <div
                                key={value}
                                role="option"
                                aria-selected={selectedValue === value}
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleSelect(value);
                                    }
                                }}
                                className={`
                                    flex items-center w-full px-3 py-2 cursor-pointer
                                    ${selectedValue === value ? 'bg-[#FBF1FF]' : 'hover:bg-[#F8F8F8]'}
                                `}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelect(value);
                                }}
                            >
                                <span
                                    className={`
                                        text-[13px]
                                        ${selectedValue === value
                                ? 'font-garetbold text-[#5C2472]'
                                : 'font-garetregular text-[#191919]'}
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
