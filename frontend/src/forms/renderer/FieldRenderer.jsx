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
import { placementClasses, startColOf, unitsOfColSpan } from '@helpers/gridLayout';
import BadgeAutoria from '@forms/components/BadgeAutoria';

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


const CLASE_BADGE = 'inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-garetbold ml-2 bg-[#FFE9CC] text-[#9E5200]';

const LABEL_CAMBIO = { nuevo: 'Nuevo', eliminado: 'Cambió', modificado: 'Cambió' };

const FieldRenderer = ({
    field, placement, methods, catalogos, onUpload, cambioField, autoriaField, onInteract,
}) => {
    const { type, name, label, required, placeholder, tooltip, validation, layout } = field;
    const gridSpan = placement?.units ?? unitsOfColSpan(layout?.colSpan ?? 1);
    const startCol = placement?.col
        ?? startColOf({ col: layout?.col, newRow: !!layout?.newRow, colSpan: gridSpan });
    const spanClass = placementClasses({ colSpan: gridSpan, col: startCol });

    const interactRef = React.useRef(null);
    const notifyInteract = useCallback(() => {
        if (interactRef.current) return;
        interactRef.current = true;
        onInteract?.();
    }, [onInteract]);

    const badgeCambio = cambioField && LABEL_CAMBIO[cambioField.tipo]
        ? <span className={CLASE_BADGE}>{LABEL_CAMBIO[cambioField.tipo]}</span>
        : null;

    const badge = (badgeCambio || autoriaField) ? (
        <React.Fragment>
            {badgeCambio}
            <BadgeAutoria autoria={autoriaField} />
        </React.Fragment>
    ) : null;

    if (type === 'info') {
        return (
            <div className={spanClass}>
                <Typography variant="body" className="text-[#7C7C7C] italic">{label}</Typography>
            </div>
        );
    }

    const baseProps = {
        name, label, badge, required, placeholder, tooltip, methods, colSpan: gridSpan,
        col: startCol,
    };

    const patternProps = {
        pattern: toRegExp(validation?.pattern),
        patternMessage: validation?.patternMessage,
        minLength: validation?.minLength,
    };

    const dateProps = {
        minDate: validation?.minDate,
        maxDate: validation?.maxDate,
    };

    switch (type) {
    case 'text':
    case 'email':
    case 'tel':
        return (
            <Input {...baseProps} {...patternProps} type="text" maxLength={validation?.maxLength}
                onFocus={notifyInteract} />
        );
    case 'textarea':
        return (
            <Input {...baseProps} {...patternProps} type="textarea" maxLength={validation?.maxLength}
                onFocus={notifyInteract} />
        );
    case 'number':
        return (
            <Input {...baseProps} type="number" onFocus={notifyInteract} />
        );
    case 'date':
        return (
            <DatePicker {...baseProps} {...dateProps} onFocus={notifyInteract} />
        );
    case 'date_range':
        return (
            <DateRangePicker {...baseProps} {...dateProps}
                field={field}
                opciones={openRangeOptions(field, catalogos)}
                disabled={field.disabled}
                onFocus={notifyInteract} />
        );
    case 'select':
        return (
            <Select {...baseProps} options={resolveOptions(field, catalogos)}
                onFocus={notifyInteract} />
        );
    case 'select_multiple':
        return (
            <SelectMultiple {...baseProps} options={resolveOptions(field, catalogos)}
                onFocus={notifyInteract} />
        );
    case 'radio':
        return (
            <Radio {...baseProps} options={resolveOptions(field, catalogos)}
                onChange={notifyInteract} />
        );
    case 'checkbox':
        return (
            <Checkbox {...baseProps} onChange={notifyInteract} />
        );
    case 'file':
        return (
            <Dragger
                {...baseProps}
                accept={field.accept?.join(',')}
                maxSizeMB={field.maxSizeMB}
                onFile={async (files) => {
                    const file = Array.isArray(files) ? files[0] : files;
                    if (!file) return null;
                    notifyInteract();
                    return onUpload?.(name, file);
                }}
            />
        );
    default:
        return (
            <Input {...baseProps} {...patternProps} type="text" maxLength={validation?.maxLength}
                onFocus={notifyInteract} />
        );
    }
};

export default FieldRenderer;
