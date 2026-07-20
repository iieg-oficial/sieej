import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFormState } from 'react-hook-form';
import ErrorsRequired from '@helpers/ErrorsRequired';
import { getErrorMessage } from '@helpers/formErrors';
import DynamicDiv from '@helpers/DynamicDiv';
import icoArrow from '@assets/icons/ico_down_arrow.svg';
import { formatDisplay } from '@helpers/dateFormat';
import Typography from './Typography';
import Calendar from './Calendar';

const DatePicker = ({
    name, label, required,
    minDate, maxDate, placeholder, tooltip,
    colSpan, wDiv, methods, inline, validate, deps, onFocus, disabled,
    options = [], optionValue, onSelectOption, ...rest
}) => {
    const { register, setValue, watch, control } = methods;
    const { errors } = useFormState({ control, name });
    const [open, setOpen] = useState(false);
    const wrapRef = useRef(null);
    const value = watch(name);
    const hasError = !!getErrorMessage(errors, name);

    const handleClickOutside = useCallback((event) => {
        if (wrapRef.current && !wrapRef.current.contains(event.target)) setOpen(false);
    }, []);

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [handleClickOutside]);

    const handleSelect = (iso) => {
        setValue(name, iso, { shouldValidate: true, shouldDirty: true });
        onSelectOption?.('');
        setOpen(false);
    };

    const handleSelectOption = (option) => {
        onSelectOption?.(option);
        if (!option) return;
        setValue(name, '', { shouldValidate: true, shouldDirty: true });
        setOpen(false);
    };

    const toggle = () => {
        if (disabled) return;
        setOpen((prev) => !prev);
    };

    const triggerClass = [
        label ? 'mt-[12px]' : '',
        'flex items-center justify-between w-full h-[40px] px-4 py-2 rounded-[8px] font-garetmedium text-[13px]',
        disabled
            ? 'bg-[#F1F1F1] cursor-not-allowed'
            : 'cursor-pointer bg-[#F8F8F8] hover:shadow-[0px_2px_24px_#B6A6BC98] hover:bg-white hover:border-[#5C2472] hover:border focus:outline-none focus:ring-1 focus:ring-[#5C2472] focus:bg-white',
        !disabled && open ? 'bg-white border border-[#5C2472] shadow-[0px_2px_24px_#B6A6BC98]' : '',
        !disabled && hasError ? 'border border-[#EA4336] bg-white' : '',
    ].join(' ');

    const optionLabel = optionValue
        ? (options.find((o) => o.value === optionValue)?.label ?? optionValue)
        : '';

    const valueClass = disabled
        ? 'text-[#CBCBCB]'
        : ((value || optionLabel) ? 'text-[#5C2472]' : 'text-[#8E8E8E] font-garetregular');

    return (
        <DynamicDiv inline={inline} colSpan={colSpan} wDiv={wDiv} className={inline ? '' : 'mt-4'}>
            <Typography
                as="label"
                titleName={label}
                tooltip={tooltip}
                name={name}
                required={required}
            />
            <div ref={wrapRef} className="relative">
                <div
                    id={name}
                    role="button"
                    tabIndex={disabled ? -1 : 0}
                    aria-haspopup="dialog"
                    aria-expanded={open}
                    aria-disabled={disabled || undefined}
                    onFocus={disabled ? undefined : onFocus}
                    onClick={toggle}
                    onKeyDown={(e) => {
                        if (disabled) return;
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setOpen((prev) => !prev);
                        } else if (e.key === 'Escape') {
                            setOpen(false);
                        }
                    }}
                    {...rest}
                    {...register(name, {
                        required: required ? 'Este campo es obligatorio' : false,
                        validate,
                        deps,
                    })}
                    className={triggerClass}
                >
                    <span className={valueClass}>
                        {optionLabel || (value
                            ? formatDisplay(value)
                            : (placeholder || 'Selecciona una fecha...'))}
                    </span>
                    <img
                        src={icoArrow}
                        alt=""
                        className={`w-[10px] h-[7px] ml-2 shrink-0 transition-transform
                            ${open ? 'rotate-180' : ''} ${disabled ? 'opacity-40' : ''}`}
                    />
                </div>
                {open && !disabled && (
                    <Calendar
                        value={value}
                        min={minDate}
                        max={maxDate}
                        options={options}
                        optionValue={optionValue}
                        onSelectOption={handleSelectOption}
                        onSelect={handleSelect}
                        onClose={() => setOpen(false)}
                    />
                )}
            </div>
            <ErrorsRequired name={name} errors={errors} />
        </DynamicDiv>
    );
};

export default DatePicker;
