import React from 'react';
import DynamicDiv from '@helpers/DynamicDiv';
import Typography from './Typography';
import DatePicker from './DatePicker';

const RangeExtremo = ({
    dateName, optionName, placeholder, opciones, abierto,
    minDate, maxDate, methods, disabled, validate, deps, rest,
}) => {
    const { register, watch, setValue } = methods;
    const opcion = watch(optionName);

    const seleccionarOpcion = (value) => setValue(optionName, value, {
        shouldValidate: true,
        shouldDirty: true,
    });

    return (
        <>
            {abierto && <input type="hidden" {...register(optionName)} />}
            <DatePicker
                inline
                name={dateName}
                placeholder={placeholder}
                minDate={minDate}
                maxDate={maxDate}
                methods={methods}
                disabled={disabled}
                validate={validate}
                deps={deps}
                options={abierto ? opciones : []}
                optionValue={abierto ? opcion : ''}
                onSelectOption={abierto ? seleccionarOpcion : undefined}
                {...rest}
            />
        </>
    );
};

const DateRangePicker = ({
    name, label, required,
    minDate, maxDate, tooltip, disabled,
    colSpan, newRow, wDiv, methods, field, opciones = [],
    placeholder: _placeholder, ...rest
}) => {
    const { getValues } = methods;
    const startName = `${name}.start`;
    const endName = `${name}.end`;
    const startOptionName = `${name}.startOption`;
    const endOptionName = `${name}.endOption`;

    const openStart = !!field?.openStart;
    const openEnd = !!field?.openEnd;

    const capturado = (dateName, optionName, abierto) => (
        !!getValues(dateName) || (abierto && !!getValues(optionName))
    );

    const validarInicio = (value) => {
        if (openStart && getValues(startOptionName)) return true;
        if (required && !value) return 'Este campo es obligatorio';
        if (capturado(endName, endOptionName, openEnd) && !value) {
            return 'Captura la fecha inicial';
        }
        return true;
    };

    const validarFin = (value) => {
        if (openEnd && getValues(endOptionName)) return true;
        if (required && !value) return 'Este campo es obligatorio';
        if (capturado(startName, startOptionName, openStart) && !value) {
            return 'Captura la fecha final';
        }
        const start = getValues(startName);
        if (value && start && value < start) {
            return 'La fecha final no puede ser anterior a la inicial';
        }
        return true;
    };

    return (
        <DynamicDiv colSpan={colSpan} newRow={newRow} wDiv={wDiv} className="mt-4">
            <Typography
                as="label"
                titleName={label}
                tooltip={tooltip}
                name={name}
                required={required}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mt-[12px]">
                <RangeExtremo
                    dateName={startName}
                    optionName={startOptionName}
                    placeholder="Fecha inicial"
                    opciones={opciones}
                    abierto={openStart}
                    minDate={minDate}
                    maxDate={maxDate}
                    methods={methods}
                    disabled={disabled}
                    validate={validarInicio}
                    deps={[endName, endOptionName, startOptionName]}
                    rest={rest}
                />
                <RangeExtremo
                    dateName={endName}
                    optionName={endOptionName}
                    placeholder="Fecha final"
                    opciones={opciones}
                    abierto={openEnd}
                    minDate={minDate}
                    maxDate={maxDate}
                    methods={methods}
                    disabled={disabled}
                    validate={validarFin}
                    deps={[startName, startOptionName, endOptionName]}
                    rest={rest}
                />
            </div>
        </DynamicDiv>
    );
};

export default DateRangePicker;
