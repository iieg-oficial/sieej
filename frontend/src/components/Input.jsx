import React, { useEffect, useRef, useState } from 'react';
import { useFormState } from 'react-hook-form';
import icoFilled from '@assets/icons/ico_filled.svg';
import icoNotFilled from '@assets/icons/ico_not_filled.svg';
import icoShow from '@assets/icons/ico_show.svg';
import icoHidden from '@assets/icons/ico_hidden.svg';
import icoArrow from '@assets/icons/ico_down_arrow.svg';
import ErrorsRequired from '@helpers/ErrorsRequired';
import DynamicDiv from '@helpers/DynamicDiv';
import FieldHints from '@helpers/FieldHints';
import { buildFieldHints, HINT_TYPES } from '@helpers/fieldHints';
import { getFieldError } from '@helpers/formErrors';
import useOverflow from '@helpers/useOverflow';
import useFieldClear from '@helpers/useFieldClear';
import FieldClearButton from './FieldClearButton';
import TextControl from './TextControl';
import Typography from './Typography';

const FILAS_COLAPSADO = 1;
const FILAS_EXPANDIDO = 8;

const Input = ({
    name, type, pattern, patternMessage, placeholder, label, badge, required, colSpan, col,
    wDiv, tooltip, methods, _inside, clean, className, normalize = 'normal',
    filled, minLength, maxLength, ...rest
}) => {
    const { register, control, setValue, watch } = methods;
    const { errors } = useFormState({ control, name });
    const [ showPassword, setShowPassword ] = useState(false);
    const [ focused, setFocused ] = useState(false);
    const [ expandido, setExpandido ] = useState(false);
    const controlRef = useRef(null);
    const isPassword = type === 'password';
    const esTextarea = type === 'textarea';
    const watchedValue = watch(name);
    const error = getFieldError(errors, name);
    const hints = buildFieldHints({
        pattern, patternMessage, minLength, maxLength, value: watchedValue,
    });
    const errorEnHint = !!error && hints.length > 0 && HINT_TYPES.includes(error.type);
    const patternOk = hints.find((hint) => hint.id === 'pattern')?.state !== 'error';
    const { hasValue, clear } = useFieldClear({ methods, name });

    const desbordado = useOverflow(controlRef, watchedValue, esTextarea ? 'y' : 'x');
    const admiteExpansion = !isPassword && type !== 'number';
    const mostrarExpandir = admiteExpansion && (expandido || desbordado);
    const multiline = esTextarea || expandido;

    useEffect(() => {
        if (!watchedValue) return;
        const transformations = {
            capitalize: (text) => text.charAt(0).toUpperCase() + text.slice(1).toLowerCase(),
            lowercase: (text) => text.toLowerCase(),
            uppercase: (text) => text.toUpperCase(),
            identifier: (text) => text.replace(/\s/g, '').toLowerCase(),
            number: (text) => text.replace(/\D/g, ''),
            normal: (text) => text
        };
        const transform = transformations[normalize];
        if (!transform) return;
        const transformedText = transform(String(watchedValue)) || watchedValue;
        if (transformedText !== watchedValue) setValue(name, transformedText);
    }, [watchedValue, setValue, normalize, name]);

    useEffect(() => {
        if (clean) setValue(name, '');
    }, [clean, setValue, name]);

    useEffect(() => setExpandido(false), [name]);

    useEffect(() => {
        if (expandido) controlRef.current?.focus();
    }, [expandido]);

    const handleInput = (e) => {
        if (normalize === 'number') {
            e.target.value = e.target.value.replace(/\D/g, '');
            setValue(name, e.target.value);
        }
    };

    const { ref: registerRef, onBlur: registerBlur, ...registered } = register(name, {
        required: required && 'Este campo es obligatorio',
        pattern: pattern && {
            value: pattern,
            message: patternMessage || 'Formato inválido'
        },
        minLength: minLength && {
            value: minLength,
            message: `Mínimo ${minLength} caracteres`
        },
        maxLength: maxLength && {
            value: maxLength,
            message: `Máximo ${maxLength} caracteres permitidos`
        },
    });

    const reservas = (hasValue && !isPassword ? 1 : 0)
        + (admiteExpansion && hasValue ? 1 : 0)
        + (isPassword || (filled && watchedValue && !error) ? 1 : 0);

    const acciones = [];
    if (hasValue && !isPassword) {
        acciones.push(<FieldClearButton key="clear" label={label} onClear={clear} />);
    }
    if (mostrarExpandir) {
        acciones.push(
            <button
                key="expandir"
                type="button"
                onClick={() => setExpandido((v) => !v)}
                aria-label={expandido ? 'Contraer campo' : 'Ver el campo completo'}
                aria-expanded={expandido}
                title={expandido ? 'Contraer campo' : 'Ver el campo completo'}
                className="
                    inline-flex items-center justify-center shrink-0 w-[22px] h-[22px] rounded-full
                    border-none! bg-transparent p-0! cursor-pointer
                    hover:bg-[#F0E2F5]!
                    focus:outline-none focus-visible:ring-1 focus-visible:ring-[#5C2472]
                "
            >
                <img
                    src={icoArrow}
                    alt=""
                    className={`w-[10px] h-[7px] transition-transform ${expandido ? 'rotate-180' : ''}`}
                />
            </button>
        );
    }
    if (isPassword) {
        acciones.push(
            <button
                key="password"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                aria-pressed={showPassword}
                className="
                    inline-flex items-center justify-center shrink-0 w-[22px] h-[22px]
                    border-none! bg-transparent p-0! text-[#5C2472] cursor-pointer
                    focus:outline-none focus-visible:ring-1 focus-visible:ring-[#5C2472] rounded
                "
            >
                <img src={showPassword ? icoShow : icoHidden} alt="" className="w-[22px] h-[22px]" />
            </button>
        );
    } else if (filled && watchedValue && !error) {
        acciones.push(
            <img
                key="filled"
                src={patternOk ? icoFilled : icoNotFilled}
                alt={patternOk ? 'Valido' : 'No valido'}
                className="w-[22px] h-[22px] shrink-0"
            />
        );
    }

    return (
        <DynamicDiv colSpan={colSpan} col={col} wDiv={wDiv} className="mt-4">
            <Typography
                as="label"
                titleName={label}
                tooltip={tooltip}
                name={name}
                required={required}
                badge={badge}
            />
            <TextControl
                multiline={multiline}
                expandido={expandido}
                rows={expandido ? FILAS_EXPANDIDO : FILAS_COLAPSADO}
                error={error}
                acciones={acciones}
                reservas={reservas}
                className={className}
                type={isPassword && showPassword ? 'text' : (multiline ? undefined : type || 'text')}
                id={name}
                name={name}
                defaultValue={watchedValue ?? ''}
                placeholder={placeholder || label}
                maxLength={maxLength}
                inputMode={normalize === 'number' ? 'numeric' : undefined}
                onInput={handleInput}
                {...rest}
                {...registered}
                ref={(el) => {
                    registerRef(el);
                    controlRef.current = el;
                }}
                onFocus={(e) => {
                    setFocused(true);
                    rest.onFocus?.(e);
                }}
                onBlur={(e) => {
                    setFocused(false);
                    if (controlRef.current) controlRef.current.scrollLeft = 0;
                    registerBlur(e);
                    rest.onBlur?.(e);
                }}
                onKeyDown={(e) => {
                    if (multiline && !esTextarea && e.key === 'Enter') e.preventDefault();
                    rest.onKeyDown?.(e);
                }}
            />
            <div className={hints.length > 0 ? 'min-h-[18px]' : ''}>
                {!!error && !(focused && errorEnHint) && (
                    <ErrorsRequired name={name} errors={errors} />
                )}
                {focused && hints.length > 0 && <FieldHints items={hints} />}
            </div>
        </DynamicDiv>
    );
};

export default Input;
