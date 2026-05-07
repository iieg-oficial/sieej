import React from 'react';
import { useFormState } from 'react-hook-form';
import ErrorsRequired from '@helpers/ErrorsRequired';
import DynamicDiv from '@helpers/DynamicDiv';
import Typography from './Typography';

const DatePicker = ({
    name, label, required, defaultValue,
    minDate, maxDate, placeholder, tooltip,
    colSpan, wDiv, methods, ...rest
}) => {
    const { register, control } = methods;
    const { errors } = useFormState({ control, name });

    return (
        <DynamicDiv colSpan={colSpan} wDiv={wDiv} className="mt-4">
            <Typography
                as="label"
                titleName={label}
                tooltip={tooltip}
                name={name}
                required={required}
            />
            <input
                type="date"
                id={name}
                defaultValue={defaultValue || ''}
                min={minDate || ''}
                max={maxDate || ''}
                placeholder={placeholder || 'Selecciona una fecha...'}
                {...rest}
                {...register(name, {
                    required: required ? 'Este campo es obligatorio' : false,
                })}
                className={`
                    mt-[12px] block w-full h-[40px] px-4 py-2 rounded-[8px] bg-[#F8F8F8] text-[#5C2472]
                    font-garetmedium text-[13px]
                    hover:shadow-[0px_2px_24px_#B6A6BC98] hover:bg-white hover:border-[#5C2472] hover:border
                    focus:outline-none focus:ring-1 focus:ring-[#5C2472] focus:bg-white
                    ${errors[name] ? 'border border-[#EA4336] bg-white' : ''}
                `}
            />
            <ErrorsRequired name={name} errors={errors} />
        </DynamicDiv>
    );
};

export default DatePicker;
