import React, { useState } from "react";
import { useFormContext } from 'react-hook-form';
import Input from "./Input";
import Tooltip from "./Tooltip";

const CheckboxGroup = ({ name, question, options, description, required, tooltip }) => {
    const { register, formState: { errors }, setValue } = useFormContext();
    const [ showOtherInput, setShowOtherInput ] = useState(false);

    if (!options) {
        return [];
    }

    const handleOtherChange = (e) => {
        if (e.target.checked) {
            setShowOtherInput(true);
        } else {
            setShowOtherInput(false);
            setValue(name, (prevValue) => prevValue.filter(val => val !== "otro"));
        }
    };

    return (
        <div className="mb-4">
            <Tooltip text={tooltip}>
                <p className="font-medium text-gray-700 mb-2">{question}</p>
            </Tooltip>
            {description && <p className="text-sm text-gray-500 mb-2">{description}</p>}
            <div className="space-y-2">
                {options?.map((option, index) => (
                    <div key={index} className="flex items-center">
                        <input
                            type="checkbox"
                            id={`${name}-${index}`}
                            value={option.value}
                            {...register(name, { required: required ? 'Este campo es obligatorio' : false })}
                            onChange={option.label === 'Otro' ? handleOtherChange : undefined}
                            className="mr-2 w-4 h-4 text-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`${name}-${index}`} className="text-sm text-gray-600">
                            {option.label}
                        </label>
                    </div>
                ))}
                {showOtherInput && (
                    <Input 
                        name={`${name}_other`}
                        placeholder="Especificar otro"
                        required
                    />
                )}
            </div>
            {errors[name] && <span className="text-red-500 text-sm">{errors[name]?.message}</span>}
            {errors[`${name}_other`] && <span className="text-red-500 text-sm">{errors[`${name}_other`]?.message}</span>}
        </div>
    );
};

export default CheckboxGroup;