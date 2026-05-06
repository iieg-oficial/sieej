import React from 'react';
import Input from '@components/Input';
import Select from '@components/Select';
import SelectMultiple from '@components/SelectMultiple';
import Radio from '@components/Radio';
import Checkbox from '@components/Checkbox';
import DatePicket from '@components/DatePicket';
import Typography from '@components/Typography';
import Dragger from '@components/Dragger';
import { resolveOptions } from './catalogResolver';

const FieldRenderer = ({ field, methods, catalogos, onUpload }) => {
    const { type, name, label, required, placeholder, tooltip, validation, layout } = field;
    const colSpan = layout?.colSpan ?? 1;

    if (type === 'info') {
        return (
            <div className={`col-span-${colSpan}`}>
                <Typography variant="body">{label}</Typography>
            </div>
        );
    }

    const baseProps = {
        name, label, required, placeholder, tooltip, methods, colSpan,
    };

    switch (type) {
    case 'text':
        return <Input {...baseProps} type="text" maxLength={validation?.maxLength} />;
    case 'textarea':
        return <Input {...baseProps} type="textarea" maxLength={validation?.maxLength} />;
    case 'number':
        return <Input {...baseProps} type="number" />;
    case 'email':
        return <Input {...baseProps} type="email" />;
    case 'tel':
        return <Input {...baseProps} type="tel" />;
    case 'date':
        return <DatePicket {...baseProps} />;
    case 'select':
        return <Select {...baseProps} options={resolveOptions(field, catalogos)} />;
    case 'select_multiple':
        return <SelectMultiple {...baseProps} options={resolveOptions(field, catalogos)} />;
    case 'radio':
        return <Radio {...baseProps} options={resolveOptions(field, catalogos)} />;
    case 'checkbox':
        return <Checkbox {...baseProps} />;
    case 'file':
        return (
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
