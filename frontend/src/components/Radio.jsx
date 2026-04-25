import React, { useCallback, useEffect, useState } from 'react';
import ErrorsRequired from '../helpers/ErrorsRequired';
import DynamicDiv from '../helpers/DynamicDiv';
import Label from './Label';
import Typography from './Typography';

const Radio = ({ 
    name, options, label, required, description, tooltip, colSpan = 1, 
    wDiv, _labelInput, methods, _other, ...rest
}) => {
    const { register, formState: { errors }, setValue, watch } = methods;
    const [additionalInputType, setAdditionalInputType] = useState(null);
    const watchedRadioValue = watch(name);

    const updateAdditionalInput = useCallback((selectedValue) => {
        if (selectedValue === 'true' || selectedValue === true) {
            setAdditionalInputType('regular');
        } else if (selectedValue === 'Otro') {
            setAdditionalInputType('Otro');
        } else {
            setAdditionalInputType(null);
        }

        if (selectedValue !== 'true' && selectedValue !== true) {
            setValue(`desc_${name}`, '');
            if (name === '') setValue(`archivo_${name}`, null);
            if (name === '') {
                setValue(`nombre_${name}`, '');
                setValue(`url_${name}`, '');
            }
        }

        if (selectedValue !== 'Otro') {
            setValue(`desc_${name}`, '');
        }
    }, [name, setValue]);

    const handleRadioChange = (event) => {
        const selectedValue = event.target.value;
        updateAdditionalInput(selectedValue);
        setValue(name, selectedValue);
    };

    useEffect(() => {
        if (watchedRadioValue !== undefined) {
            updateAdditionalInput(watchedRadioValue);
        }
    }, [watchedRadioValue, updateAdditionalInput]);

    return (
        <DynamicDiv colSpan={additionalInputType ? 2: colSpan} wDiv={wDiv} className="mt-[15px]">
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
                                h-[20px] w-[20px] border-[#5C2472] border coursor-pointer rounded-full appearance-none 
                                checked:bg-[#5C2472] checked:border-[#5C2472] checked:before:flex checked:before:items-center
                                checked:before:justify-center checked:before:h-full hover:bg-[#5C2472]
                                 ${errors[name] ? 'border border-[#EA4336] placeholder-[#EA4336] bg-white' : ''}
                            `}
                            onChange={handleRadioChange}
                        />
                        <label htmlFor={`${name}-${option.value}`} className="ml-[12px] text-xs text-[#191919] font-garetmedium coursor-pointer">
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
