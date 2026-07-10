import React from 'react';
import Input from '@components/Input';
import Select from '@components/Select';
import SelectMultiple from '@components/SelectMultiple';
import Radio from '@components/Radio';
import Checkbox from '@components/Checkbox';
import DatePicker from '@components/DatePicker';
import Typography from '@components/Typography';
import Dragger from '@components/Dragger';
import { resolveOptions } from './catalogResolver';

const toRegExp = (raw) => {
    if (!raw) return undefined;
    const str = String(raw);
    const match = str.match(/^\/(.*)\/([a-z]*)$/);
    try {
        return match ? new RegExp(match[1], match[2]) : new RegExp(str);
    } catch {
        return undefined;
    }
};

const SPAN_CLASS = { 2: 'col-span-2', 3: 'col-span-3', 6: 'col-span-6' };

const FieldRenderer = ({ field, methods, catalogos, onUpload }) => {
    const { type, name, label, required, placeholder, tooltip, validation, layout, showWhen } = field;
    const gridSpan = (() => {
        const cs = layout?.colSpan ?? 1;
        if (cs === 2) return 3;
        if (cs === 3) return 2;
        return 6;
    })();

    const spanClass = SPAN_CLASS[gridSpan] || 'col-span-6';

    if (type === 'info') {
        return (
            <div className={spanClass}>
                <Typography variant="body" className="text-[#7C7C7C] italic">{label}</Typography>
            </div>
        );
    }

    const baseProps = {
        name, label, required, placeholder, tooltip, methods, colSpan: gridSpan,
    };

    const wrapCondicional = (el) => showWhen ? (
        <div className={spanClass}>
            <span className="inline-block text-[10px] font-garetmedium text-[#7C7C7C] bg-[#F0E2F5] px-2 py-0.5 rounded-full mb-1">
                Condicionado
            </span>
            {el}
        </div>
    ) : el;

    const patternProps = {
        pattern: toRegExp(validation?.pattern),
        patternMessage: validation?.patternMessage,
    };

    switch (type) {
    case 'text':
        return wrapCondicional(<Input {...baseProps} {...patternProps} type="text" maxLength={validation?.maxLength} />);
    case 'textarea':
        return wrapCondicional(<Input {...baseProps} {...patternProps} type="textarea" maxLength={validation?.maxLength} />);
    case 'number':
        return wrapCondicional(<Input {...baseProps} type="number" />);
    case 'email':
        return wrapCondicional(
            <Input
                {...baseProps}
                type="email"
                maxLength={validation?.maxLength}
                pattern={toRegExp(validation?.pattern) || /^[^@\s]+@[^@\s]+\.[^@\s]+$/}
                patternMessage={patternProps.patternMessage || 'Ingresa un correo electrónico válido'}
            />
        );
    case 'tel':
        return wrapCondicional(
            <Input
                {...baseProps}
                type="tel"
                normalize="number"
                maxLength={validation?.maxLength ?? 10}
                pattern={toRegExp(validation?.pattern) || /^\d{10}$/}
                patternMessage={patternProps.patternMessage || 'Ingresa un teléfono válido de 10 dígitos'}
            />
        );
    case 'date':
        return wrapCondicional(<DatePicker {...baseProps} />);
    case 'select':
        return wrapCondicional(<Select {...baseProps} options={resolveOptions(field, catalogos)} />);
    case 'select_multiple':
        return wrapCondicional(<SelectMultiple {...baseProps} options={resolveOptions(field, catalogos)} />);
    case 'radio':
        return wrapCondicional(<Radio {...baseProps} options={resolveOptions(field, catalogos)} />);
    case 'checkbox':
        return wrapCondicional(<Checkbox {...baseProps} />);
    case 'file':
        return wrapCondicional(
            <Dragger
                {...baseProps}
                accept={field.accept?.join(',')}
                maxSizeMB={field.maxSizeMB}
                onFile={async (files) => {
                    const file = Array.isArray(files) ? files[0] : files;
                    if (!file) return null;
                    return onUpload?.(name, file);
                }}
            />
        );
    default:
        return <Typography variant="body">Tipo no soportado: {type}</Typography>;
    }
};

export default FieldRenderer;
