import React from 'react';
import DynamicDiv from '@helpers/DynamicDiv';
import Typography from './Typography';
import DatePicker from './DatePicker';

const DateRangePicker = ({
    name, label, required,
    minDate, maxDate, tooltip, disabled,
    colSpan, wDiv, methods, placeholder: _placeholder, ...rest
}) => {
    const { getValues } = methods;
    const startName = `${name}.start`;
    const endName = `${name}.end`;

    return (
        <DynamicDiv colSpan={colSpan} wDiv={wDiv} className="mt-4">
            <Typography
                as="label"
                titleName={label}
                tooltip={tooltip}
                name={name}
                required={required}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mt-[12px]">
                <DatePicker
                    inline
                    name={startName}
                    placeholder="Fecha inicial"
                    minDate={minDate}
                    maxDate={maxDate}
                    methods={methods}
                    disabled={disabled}
                    validate={(value) => {
                        if (required && !value) return 'Este campo es obligatorio';
                        if (getValues(endName) && !value) return 'Captura la fecha inicial';
                        return true;
                    }}
                    deps={[endName]}
                    {...rest}
                />
                <DatePicker
                    inline
                    name={endName}
                    placeholder="Fecha final"
                    minDate={minDate}
                    maxDate={maxDate}
                    methods={methods}
                    disabled={disabled}
                    validate={(value) => {
                        if (required && !value) return 'Este campo es obligatorio';
                        const start = getValues(startName);
                        if (start && !value) return 'Captura la fecha final';
                        if (value && start && value < start) {
                            return 'La fecha final no puede ser anterior a la inicial';
                        }
                        return true;
                    }}
                    deps={[startName]}
                    {...rest}
                />
            </div>
        </DynamicDiv>
    );
};

export default DateRangePicker;
