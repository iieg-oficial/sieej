import React from 'react';
import { useFormState } from 'react-hook-form';
import ErrorsRequired from '@helpers/ErrorsRequired';
import DynamicDiv from '@helpers/DynamicDiv';
import Typography from './Typography';

const Checkbox = ({
    name, label, required, tooltip,
    colSpan, newRow, col, alone, wDiv, methods, ...rest
}) => {
    const { register, control } = methods;
    const { errors } = useFormState({ control, name });

    return (
        <DynamicDiv colSpan={colSpan} newRow={newRow} col={col} alone={alone} wDiv={wDiv} className="mt-4">
            <div className="flex items-center gap-3">
                <input
                    type="checkbox"
                    id={name}
                    {...rest}
                    {...register(name, {
                        required: required ? 'Este campo es obligatorio' : false,
                    })}
                    className="
                        w-5 h-5 border border-[#CCD3E2] rounded-sm appearance-none cursor-pointer
                        hover:shadow-lg hover:shadow-[#2859C440] hover:border-[#5C2472]
                        checked:bg-[#5C2472] checked:border-[#5C2472]
                        checked:before:flex checked:before:items-center checked:before:justify-center
                        checked:before:h-full checked:before:text-white checked:before:content-['✔']
                        checked:before:text-[14px]
                    "
                />
                <Typography
                    as="label"
                    titleName={label}
                    tooltip={tooltip}
                    name={name}
                    required={required}
                />
            </div>
            <ErrorsRequired name={name} errors={errors} />
        </DynamicDiv>
    );
};

export default Checkbox;
