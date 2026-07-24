import React, { useCallback } from 'react';
import Input from '@components/Input';
import Select from '@components/Select';
import SelectMultiple from '@components/SelectMultiple';
import Radio from '@components/Radio';
import Checkbox from '@components/Checkbox';
import DatePicker from '@components/DatePicker';
import DateRangePicker from '@components/DateRangePicker';
import Typography from '@components/Typography';
import Dragger from '@components/Dragger';
import { openRangeOptions, resolveOptions } from './catalogResolver';

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

const SPAN_CLASS = { 2: 'md:col-span-2', 3: 'md:col-span-3', 6: 'md:col-span-6' };

const BADGE_CAMBIO = {
    nuevo: 'bg-[#EAF6ED] text-[#34A853]',
    eliminado: 'bg-[#FEDAB2] text-[#FF8300]',
    modificado: 'bg-[#FEDAB2] text-[#FF8300]',
};

const LABEL_CAMBIO = { nuevo: 'Nuevo', eliminado: 'Cambió', modificado: 'Cambió' };

const FieldRenderer = ({ field, methods, catalogos, onUpload, cambioField, onInteract }) => {
    const { type, name, label, required, placeholder, tooltip, validation, layout } = field;
    const gridSpan = (() => {
        const cs = layout?.colSpan ?? 1;
        if (cs === 2) return 3;
        if (cs === 3) return 2;
        return 6;
    })();

    const spanClass = SPAN_CLASS[gridSpan] || 'md:col-span-6';

    const interactRef = React.useRef(null);
    const notifyInteract = useCallback(() => {
        if (interactRef.current) return;
        interactRef.current = true;
        onInteract?.();
    }, [onInteract]);

    const badge = cambioField && LABEL_CAMBIO[cambioField.tipo]
        ? (
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-garetbold ml-2 ${BADGE_CAMBIO[cambioField.tipo]}`}>
                {LABEL_CAMBIO[cambioField.tipo]}
            </span>
        )
        : null;

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

    const patternProps = {
        pattern: toRegExp(validation?.pattern),
        patternMessage: validation?.patternMessage,
    };

    const labelWithBadge = badge ? (
        <span className="inline-flex items-center">
            {label || name}
            {badge}
        </span>
    ) : undefined;

    switch (type) {
    case 'text':
        return (
            <Input {...baseProps} {...patternProps} type="text" maxLength={validation?.maxLength}
                label={labelWithBadge || label} onFocus={notifyInteract} />
        );
    case 'textarea':
        return (
            <Input {...baseProps} {...patternProps} type="textarea" maxLength={validation?.maxLength}
                label={labelWithBadge || label} onFocus={notifyInteract} />
        );
    case 'number':
        return (
            <Input {...baseProps} type="number"
                label={labelWithBadge || label} onFocus={notifyInteract} />
        );
    case 'date':
        return (
            <DatePicker {...baseProps}
                label={labelWithBadge || label}
                onFocus={notifyInteract} />
        );
    case 'date_range':
        return (
            <DateRangePicker {...baseProps}
                label={labelWithBadge || label}
                field={field}
                opciones={openRangeOptions(field, catalogos)}
                disabled={field.disabled}
                onFocus={notifyInteract} />
        );
    case 'select':
        return (
            <Select {...baseProps} options={resolveOptions(field, catalogos)}
                label={labelWithBadge || label}
                onFocus={notifyInteract} />
        );
    case 'select_multiple':
        return (
            <SelectMultiple {...baseProps} options={resolveOptions(field, catalogos)}
                label={labelWithBadge || label}
                onFocus={notifyInteract} />
        );
    case 'radio':
        return (
            <Radio {...baseProps} options={resolveOptions(field, catalogos)}
                label={labelWithBadge || label}
                onChange={notifyInteract} />
        );
    case 'checkbox':
        return (
            <Checkbox {...baseProps}
                label={labelWithBadge || label}
                onChange={notifyInteract} />
        );
    case 'file':
        return (
            <Dragger
                {...baseProps}
                accept={field.accept?.join(',')}
                maxSizeMB={field.maxSizeMB}
                label={labelWithBadge || label}
                onFile={async (files) => {
                    const file = Array.isArray(files) ? files[0] : files;
                    if (!file) return null;
                    notifyInteract();
                    return onUpload?.(name, file);
                }}
            />
        );
    default:
        return <Typography variant="body">Tipo no soportado: {type}</Typography>;
    }
};

export default FieldRenderer;
