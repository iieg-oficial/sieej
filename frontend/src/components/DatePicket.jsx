import React, { } from 'react';
import { useFormContext } from 'react-hook-form';
import Label from './Label';

const DatePicker = ({
    name, label, required, defaultValue, 
    minDate, maxDate, placeholderText,
}) => {
    const { register, formState: { errors } } = useFormContext();
  
    return (
        <div className="mb-4">
            <Label labelName={label} />
    
            <input
                type="date"
                id={name}
                name={name}
                defaultValue={defaultValue || ''}
                min={minDate || ''}
                max={maxDate || ''}
                placeholder={placeholderText || 'Selecciona una fecha...'}
                {...register(name, { required: required ? 'Este campo es obligatorio' : false })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
    
            {errors[name] && <span className="text-red-500 text-sm">{errors[name]?.message}</span>}
        </div>
    );
};

export default DatePicker;