import React from 'react';
import ErrorsRequired from '@helpers/ErrorsRequired';
import { getFieldError } from '@helpers/formErrors';
import DynamicDiv from '@helpers/DynamicDiv';
import Typography from './Typography';

const Radio = ({
    name, options, label, required, description, tooltip, colSpan = 1, newRow, col, alone,
    wDiv, methods, ...rest
}) => {
    const { register, formState: { errors } } = methods;

    return (
        <DynamicDiv colSpan={colSpan} newRow={newRow} col={col} alone={alone} wDiv={wDiv} className="mt-[15px]">
            <Typography
                as="label"
                titleName={label}
                tooltip={tooltip}
                name={name}
                required={required}
            />
            {description && (<Typography as="h5" titleName={description} className='mt-2'/>)}

            <div className="flex flex-col mt-3 space-y-2 md:space-y-0 md:flex-row md:space-x-10">
                {options.map((option) => (
                    <div key={option.value} className="flex items-center h-[40px]">
                        <input
                            type="radio"
                            id={`${name}-${option.value}`}
                            value={option.value}
                            {...rest}
                            {...register(name, { required: required ? 'Este campo es obligatorio' : false })}
                            className={`
                                h-[20px] w-[20px] border-[#5C2472] border cursor-pointer rounded-full appearance-none
                                checked:bg-[#5C2472] checked:border-[#5C2472] checked:before:flex checked:before:items-center
                                checked:before:justify-center checked:before:h-full hover:bg-[#5C2472]
                                 ${getFieldError(errors, name) ? 'border border-[#EA4336] placeholder-[#EA4336] bg-white' : ''}
                            `}
                        />
                        <label htmlFor={`${name}-${option.value}`} className="ml-[12px] text-xs text-[#191919] font-garetmedium cursor-pointer">
                            {option.label}
                        </label>
                    </div>
                ))}
            </div>

            <ErrorsRequired name={name} errors={errors} />
        </DynamicDiv>
    );
};

export default Radio;
