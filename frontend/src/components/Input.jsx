import React, { useEffect, useState } from "react";
import { useFormState } from 'react-hook-form';
import icoFilled from '../assets/icons/ico_filled.svg';
import icoNotFilled from '../assets/icons/ico_not_filled.svg';
import icoShow from '../assets/icons/ico_show.svg';
import icoHidden from '../assets/icons/ico_hidden.svg';
import ErrorsRequired from '../helpers/ErrorsRequired';
import DynamicDiv from "../helpers/DynamicDiv";
import Typography from "./Typography";

const Input = ({
    name, type, pattern, patternMessage, placeholder, label, required, colSpan, 
    wDiv, tooltip, methods, inside, clean, className, normalize = "capitalize", 
    filled, maxLength, ...rest
}) => {
    const { register, control, setValue, watch } = methods;
    const { errors } = useFormState({ control, name });
    const [ showPassword, setShowPassword ] = useState(false);
    const isPassword = type === 'password';
    const watchedValue = watch(name);

    useEffect(() => {
        if (!watchedValue) return;
        const transformations = {
            capitalize: (text) => text.charAt(0).toUpperCase() + text.slice(1).toLowerCase(),
            lowercase: (text) => text.toLowerCase(),
            uppercase: (text) => text.toUpperCase(),
            number: (text) => text.replace(/\D/g, ''),
            normal: (text) => text
        };
        const transform = transformations[normalize];
        if (!transform) return;
        const transformedText = transform(String(watchedValue)) || watchedValue;
        if (transformedText !== watchedValue) setValue(name, transformedText);
    }, [watchedValue, setValue, normalize, name]);

    useEffect(() => {
        if (clean) setValue(name, "");
    }, [clean, setValue, name]);

    const handleInput = (e) => {
        if (normalize === "number") {
            e.target.value = e.target.value.replace(/\D/g, '');
            setValue(name, e.target.value); // También actualizamos en react-hook-form
        }
    };

    return (
        <DynamicDiv colSpan={colSpan} wDiv={wDiv} className="mt-4">
            <Typography
                as="label"
                titleName={label} 
                tooltip={tooltip} 
                name={name}
                required={required}
            />
            <div className="relative">
                <input
                    type={isPassword && showPassword ? 'text' : type || 'text'}
                    id={name}
                    name={name}
                    placeholder={placeholder || label}
                    maxLength={maxLength || 100}
                    inputMode={normalize === "number" ? "numeric" : undefined}
                    onInput={handleInput}
                    {...rest}
                    {...register(name, {
                        required: required && 'Este campo es obligatorio',
                        pattern: pattern && { 
                            value: pattern, 
                            message: patternMessage || 'Formato inválido' 
                        },
                        maxLength: maxLength && { 
                            value: maxLength, 
                            message: `Máximo ${maxLength} caracteres permitidos` 
                        },
                    })}
                    className={`
                        ${className || ''} 
                        ${errors[name] ? 'border border-[#EA4336] placeholder-[#EA4336] bg-white' : ''}
                        mt-[12px] block w-full h-[40px] px-4 py-2 rounded-[8px] bg-[#F8F8F8] text-[#5C2472]
                        font-garetmedium text-[13px] cursor-auto
                        placeholder-[#8E8E8E] placeholder:font-garetregular 
                        hover:shadow-[0px_2px_24px_#B6A6BC98] hover:bg-white hover:border-[#5C2472] hover:border
                        focus:outline-none focus:ring-1 focus:ring-[#5C2472] focus:bg-white 
                    `}
                    style={{ marginBottom: errors[name] && 0 }}
                />
                {isPassword && (
                    <span
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#5C2472]"
                    >
                        <img 
                            src={showPassword ? icoShow : icoHidden} 
                            alt={showPassword ? "showPassword" : "hiddenPassword"} 
                            className="w-[22px] h-[22px]" 
                        />
                    </span>
                )}
                {filled && watchedValue && !errors[name] && (
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <img 
                            src={!errors[name] && (!pattern || (pattern && pattern.test(watchedValue))) ? icoFilled : icoNotFilled} 
                            alt={!errors[name] && (!pattern || (pattern && pattern.test(watchedValue))) ? "Valido" : "No valido"} 
                            className="w-[22px] h-[22px]" 
                        />
                    </span>
                )}
            </div>
            <ErrorsRequired name={name} errors={errors}/>
        </DynamicDiv>
    );
};

export default Input;