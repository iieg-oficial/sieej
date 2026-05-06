import React from 'react';
import Typography from '@components/Typography';

const formatValue = (value) => {
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'boolean') return value ? 'Sí' : 'No';
    if (Array.isArray(value)) return value.length ? value.join(', ') : '—';
    if (typeof value === 'object') {
        if (value.filename_original) return value.filename_original;
        if (value.url_publica) return value.url_publica;
        return JSON.stringify(value);
    }
    return String(value);
};

const renderStepData = (step, datos) => {
    if (step.type === 'summary') return null;
    const stepData = datos[step.id];

    if (step.type === 'repeater') {
        const items = Array.isArray(stepData) ? stepData : [];
        return (
            <div className="space-y-4">
                {items.length === 0 && <Typography variant="caption">Sin elementos.</Typography>}
                {items.map((item, idx) => (
                    <div key={idx} className="rounded border border-neutral-200 p-3">
                        <Typography variant="caption">Item {idx + 1}</Typography>
                        <dl className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                            {step.fields.map((field) => (
                                <div key={field.name}>
                                    <dt className="text-xs text-neutral-500">{field.label}</dt>
                                    <dd>{formatValue(item?.[field.name])}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {step.fields.map((field) => {
                if (field.type === 'info') return null;
                return (
                    <div key={field.name}>
                        <dt className="text-xs text-neutral-500">{field.label}</dt>
                        <dd>{formatValue(stepData?.[field.name])}</dd>
                    </div>
                );
            })}
        </dl>
    );
};

const SummaryStep = ({ definicion, datos }) => {
    return (
        <div className="space-y-6">
            {definicion.steps.map((step) => {
                if (step.type === 'summary') return null;
                return (
                    <section key={step.id}>
                        <Typography variant="heading">{step.title}</Typography>
                        <div className="mt-3">{renderStepData(step, datos)}</div>
                    </section>
                );
            })}
        </div>
    );
};

export default SummaryStep;
